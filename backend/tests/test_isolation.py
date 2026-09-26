import os
import pytest

# Must set DATABASE_URL BEFORE importing anything that touches the DB
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from database import Base, get_db, get_engine, get_session_local
from main import app
from models import Agency, User, Membership, Project, Task, Client, ProjectMember, RoleEnum
import auth

# Patch the engine singleton to use in-memory SQLite
import database as db_module

_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

# Inject our engine before tables are created
db_module._engine = _test_engine
db_module._SessionLocal = _TestingSessionLocal

Base.metadata.create_all(bind=_test_engine)


def override_get_db():
    db = _TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Drop and recreate all tables before each test for isolation."""
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    yield


def setup_base_data():
    """Create two agencies, users, and memberships directly in the DB."""
    db = _TestingSessionLocal()
    hashed_pwd = auth.hash_password("password123")

    agency_a = Agency(name="Agency A", slug="agency-a")
    agency_b = Agency(name="Agency B", slug="agency-b")
    db.add_all([agency_a, agency_b])
    db.flush()

    user_a = User(email="admin@a.com", full_name="Admin A", hashed_password=hashed_pwd)
    user_b = User(email="admin@b.com", full_name="Admin B", hashed_password=hashed_pwd)
    client_u = User(email="client@acme.com", full_name="Client User", hashed_password=hashed_pwd)
    db.add_all([user_a, user_b, client_u])
    db.flush()

    acme = Client(name="Acme Corp", email="acme@corp.com", agency_id=agency_a.id)
    db.add(acme)
    db.flush()

    mem_a = Membership(user_id=user_a.id, agency_id=agency_a.id, role=RoleEnum.agency_admin)
    mem_b = Membership(user_id=user_b.id, agency_id=agency_b.id, role=RoleEnum.agency_admin)
    mem_cu = Membership(user_id=client_u.id, agency_id=agency_a.id, role=RoleEnum.client_user, client_id=acme.id)
    db.add_all([mem_a, mem_b, mem_cu])
    db.flush()

    project_a = Project(
        agency_id=agency_a.id, client_id=acme.id,
        name="Project Alpha", description="desc", status="active"
    )
    db.add(project_a)
    db.commit()

    # Refresh to get stable IDs
    db.refresh(agency_a); db.refresh(agency_b)
    db.refresh(user_a); db.refresh(user_b); db.refresh(client_u)
    db.refresh(acme); db.refresh(mem_a); db.refresh(mem_b); db.refresh(mem_cu)
    db.refresh(project_a)
    db.close()

    return {
        "agency_a": agency_a, "agency_b": agency_b,
        "user_a": user_a, "user_b": user_b, "client_u": client_u,
        "acme": acme, "mem_a": mem_a, "mem_b": mem_b, "mem_cu": mem_cu,
        "project_a": project_a,
    }


def login(email: str, agency_slug: str) -> str:
    res = client.post("/auth/login", json={"email": email, "password": "password123", "agency_slug": agency_slug})
    assert res.status_code == 200, f"Login failed: {res.json()}"
    return res.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: Cross-tenant project access
# ─────────────────────────────────────────────────────────────────────────────
def test_cross_tenant_project_access():
    d = setup_base_data()
    token_b = login("admin@b.com", "agency-b")

    # Agency B admin tries to access Agency A's project
    res = client.get(
        f"/projects/{d['agency_a'].id}/{d['project_a'].id}",
        headers=auth_header(token_b),
    )
    assert res.status_code in (403, 404), f"Expected 403/404, got {res.status_code}: {res.json()}"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: Client cannot see internal tasks (list endpoint)
# ─────────────────────────────────────────────────────────────────────────────
def test_client_cannot_see_internal_tasks():
    d = setup_base_data()
    db = _TestingSessionLocal()
    t_visible = Task(project_id=d["project_a"].id, agency_id=d["agency_a"].id,
                     title="Visible Task", description="V", status="todo", priority="low", is_internal=False)
    t_internal = Task(project_id=d["project_a"].id, agency_id=d["agency_a"].id,
                      title="Internal Task", description="I", status="todo", priority="low", is_internal=True)
    db.add_all([t_visible, t_internal])
    db.commit()
    db.close()

    token = login("client@acme.com", "agency-a")
    res = client.get(
        f"/tasks/{d['agency_a'].id}/projects/{d['project_a'].id}/tasks",
        headers=auth_header(token),
    )
    assert res.status_code == 200
    titles = [t["title"] for t in res.json()]
    assert "Visible Task" in titles
    assert "Internal Task" not in titles


# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: Client cannot see internal tasks via search endpoint
# ─────────────────────────────────────────────────────────────────────────────
def test_client_cannot_see_internal_via_search():
    d = setup_base_data()
    db = _TestingSessionLocal()
    t_visible = Task(project_id=d["project_a"].id, agency_id=d["agency_a"].id,
                     title="SearchVisible", description="V", status="todo", priority="low", is_internal=False)
    t_internal = Task(project_id=d["project_a"].id, agency_id=d["agency_a"].id,
                      title="SearchInternal", description="I", status="todo", priority="low", is_internal=True)
    db.add_all([t_visible, t_internal])
    db.commit()
    db.close()

    token = login("client@acme.com", "agency-a")
    res = client.get(
        f"/tasks/{d['agency_a'].id}/tasks/search",
        headers=auth_header(token),
    )
    assert res.status_code == 200
    titles = [t["title"] for t in res.json()]
    assert "SearchVisible" in titles
    assert "SearchInternal" not in titles


# ─────────────────────────────────────────────────────────────────────────────
# TEST 4: One person, two agencies — different roles, both work
# ─────────────────────────────────────────────────────────────────────────────
def test_one_person_two_agencies():
    d = setup_base_data()
    db = _TestingSessionLocal()
    # Add user_a to agency_b as agency_member
    db.add(Membership(user_id=d["user_a"].id, agency_id=d["agency_b"].id, role=RoleEnum.agency_member))
    db.commit()
    db.close()

    token_as_admin_a = login("admin@a.com", "agency-a")
    token_as_member_b = login("admin@a.com", "agency-b")

    # Tokens should be different (different agency_id embedded)
    assert token_as_admin_a != token_as_member_b

    # As admin of agency A, can list agency A projects
    res = client.get(f"/projects/{d['agency_a'].id}", headers=auth_header(token_as_admin_a))
    assert res.status_code == 200

    # As member of agency B, can list agency B projects
    res = client.get(f"/projects/{d['agency_b'].id}", headers=auth_header(token_as_member_b))
    assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# TEST 5: Invite race — no duplicate invitations
# ─────────────────────────────────────────────────────────────────────────────
def test_invite_no_duplicate():
    d = setup_base_data()
    token = login("admin@a.com", "agency-a")

    payload = {"email": "newuser@test.com", "role": "agency_member"}
    r1 = client.post(f"/invitations/{d['agency_a'].id}", json=payload, headers=auth_header(token))
    assert r1.status_code == 200

    r2 = client.post(f"/invitations/{d['agency_a'].id}", json=payload, headers=auth_header(token))
    assert r2.status_code == 200

    # Only one invitation row should exist
    r_list = client.get(f"/invitations/{d['agency_a'].id}", headers=auth_header(token))
    assert r_list.status_code == 200
    invites = [i for i in r_list.json() if i["email"] == "newuser@test.com"]
    assert len(invites) == 1, f"Expected 1 invite, got {len(invites)}"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 6: Accept invite idempotent — no duplicate memberships
# ─────────────────────────────────────────────────────────────────────────────
def test_accept_invite_idempotent():
    d = setup_base_data()
    token_admin = login("admin@a.com", "agency-a")

    # Create invite for a brand new user
    inv_res = client.post(
        f"/invitations/{d['agency_a'].id}",
        json={"email": "brandnew@test.com", "role": "agency_member"},
        headers=auth_header(token_admin),
    )
    assert inv_res.status_code == 200
    invite_token = inv_res.json()["token"]

    # Register the new user
    reg_res = client.post("/auth/register", json={"email": "brandnew@test.com", "password": "password123", "full_name": "Brand New"})
    assert reg_res.status_code == 200
    new_user_token = reg_res.json()["access_token"]

    # Accept invite first time → 200
    acc1 = client.post("/invitations/accept", json={"token": invite_token}, headers=auth_header(new_user_token))
    assert acc1.status_code == 200, f"First accept failed: {acc1.json()}"

    # Accept invite second time → 200 (idempotent) or 400 (already accepted)
    acc2 = client.post("/invitations/accept", json={"token": invite_token}, headers=auth_header(new_user_token))
    assert acc2.status_code in (200, 400), f"Unexpected status: {acc2.json()}"

    # Critically: only ONE membership for this user in agency A
    db = _TestingSessionLocal()
    from models import User as UserModel
    new_user = db.query(UserModel).filter(UserModel.email == "brandnew@test.com").first()
    memberships = db.query(Membership).filter(
        Membership.user_id == new_user.id,
        Membership.agency_id == d["agency_a"].id
    ).all()
    db.close()
    assert len(memberships) == 1, f"Expected 1 membership, got {len(memberships)}"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 7: Remove member from project unassigns their tasks
# ─────────────────────────────────────────────────────────────────────────────
def test_remove_member_unassigns_tasks():
    d = setup_base_data()
    db = _TestingSessionLocal()

    # Add project member
    pm = ProjectMember(project_id=d["project_a"].id, membership_id=d["mem_a"].id)
    db.add(pm)

    # Assign a task to that member
    task = Task(
        project_id=d["project_a"].id, agency_id=d["agency_a"].id,
        title="Assigned Task", description="desc", status="todo", priority="low",
        is_internal=False, assignee_membership_id=d["mem_a"].id
    )
    db.add(task)
    db.commit()
    task_id = task.id
    db.close()

    token = login("admin@a.com", "agency-a")
    res = client.delete(
        f"/projects/{d['agency_a'].id}/{d['project_a'].id}/members/{d['mem_a'].id}",
        headers=auth_header(token),
    )
    assert res.status_code == 200, f"Remove member failed: {res.json()}"

    # Verify task is now unassigned
    db = _TestingSessionLocal()
    refreshed_task = db.query(Task).filter(Task.id == task_id).first()
    db.close()
    assert refreshed_task.assignee_membership_id is None, "Task was not unassigned!"
