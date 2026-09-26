import os
from datetime import datetime
from database import get_engine, Base, get_session_local
from models import Agency, User, Membership, Client, Project, Task, RoleEnum
import auth

def seed():
    engine = get_engine()
    Base.metadata.create_all(engine)
    SessionLocal = get_session_local()
    db = SessionLocal()
    
    # Check if seeded
    if db.query(Agency).filter(Agency.slug == "alpha").first():
        print("Already seeded.")
        return
        
    alpha = Agency(name="Alpha Agency", slug="alpha")
    beta = Agency(name="Beta Agency", slug="beta")
    db.add_all([alpha, beta])
    db.commit()
    db.refresh(alpha)
    db.refresh(beta)
    
    hashed_pwd = auth.hash_password("password123")
    
    admin_alpha = User(email="admin@alpha.com", full_name="Alpha Admin", hashed_password=hashed_pwd)
    member_alpha = User(email="member@alpha.com", full_name="Alpha Member", hashed_password=hashed_pwd)
    cross_user = User(email="crossuser@example.com", full_name="Cross User", hashed_password=hashed_pwd)
    client_acme = User(email="client@acme.com", full_name="Acme Client", hashed_password=hashed_pwd)
    admin_beta = User(email="admin@beta.com", full_name="Beta Admin", hashed_password=hashed_pwd)
    
    db.add_all([admin_alpha, member_alpha, cross_user, client_acme, admin_beta])
    db.commit()
    
    # Clients
    acme = Client(name="Acme Corp", email="contact@acme.com", agency_id=alpha.id)
    techstart = Client(name="TechStart", email="contact@techstart.com", agency_id=alpha.id)
    retailco = Client(name="RetailCo", email="contact@retailco.com", agency_id=beta.id)
    db.add_all([acme, techstart, retailco])
    db.commit()
    
    # Memberships
    m1 = Membership(user_id=admin_alpha.id, agency_id=alpha.id, role=RoleEnum.agency_admin)
    m2 = Membership(user_id=member_alpha.id, agency_id=alpha.id, role=RoleEnum.agency_member)
    m3 = Membership(user_id=cross_user.id, agency_id=alpha.id, role=RoleEnum.client_user, client_id=acme.id)
    m4 = Membership(user_id=cross_user.id, agency_id=beta.id, role=RoleEnum.agency_member)
    m5 = Membership(user_id=client_acme.id, agency_id=alpha.id, role=RoleEnum.client_user, client_id=acme.id)
    m6 = Membership(user_id=admin_beta.id, agency_id=beta.id, role=RoleEnum.agency_admin)
    
    db.add_all([m1, m2, m3, m4, m5, m6])
    db.commit()
    
    # Projects
    p1 = Project(agency_id=alpha.id, client_id=acme.id, name="Acme Redesign", description="Redesign website", status="active")
    db.add(p1)
    db.commit()
    
    # Tasks
    t1 = Task(project_id=p1.id, agency_id=alpha.id, title="Mockups", description="Initial mockups", status="todo", priority="high", is_internal=False)
    t2 = Task(project_id=p1.id, agency_id=alpha.id, title="Internal Review", description="Review mockups internally", status="todo", priority="medium", is_internal=True)
    db.add_all([t1, t2])
    db.commit()
    print("Seed complete.")

if __name__ == "__main__":
    seed()
