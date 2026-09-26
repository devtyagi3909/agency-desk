import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Date, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from database import Base

class RoleEnum(str, enum.Enum):
    agency_admin = "agency_admin"
    agency_member = "agency_member"
    client_user = "client_user"

class ProjectStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"

class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    in_review = "in_review"
    done = "done"

class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    needs_changes = "needs_changes"

class Agency(Base):
    __tablename__ = "agencies"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True)
    hashed_password: Mapped[str] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Client(Base):
    __tablename__ = "clients"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Membership(Base):
    __tablename__ = "memberships"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum))
    client_id: Mapped[str | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    
    __table_args__ = (UniqueConstraint('user_id', 'agency_id', name='uq_user_agency'),)

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ProjectMember(Base):
    __tablename__ = "project_members"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    membership_id: Mapped[str] = mapped_column(ForeignKey("memberships.id"))
    
    __table_args__ = (UniqueConstraint('project_id', 'membership_id', name='uq_project_membership'),)

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))
    priority: Mapped[PriorityEnum] = mapped_column(Enum(PriorityEnum))
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False)
    assignee_membership_id: Mapped[str | None] = mapped_column(ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    author_membership_id: Mapped[str] = mapped_column(ForeignKey("memberships.id"))
    content: Mapped[str] = mapped_column(String)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class TimeEntry(Base):
    __tablename__ = "time_entries"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    membership_id: Mapped[str] = mapped_column(ForeignKey("memberships.id"))
    duration_minutes: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String, nullable=True)
    date: Mapped[datetime] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Attachment(Base):
    __tablename__ = "attachments"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    uploaded_by_membership_id: Mapped[str] = mapped_column(ForeignKey("memberships.id"))
    filename: Mapped[str] = mapped_column(String)
    file_path: Mapped[str] = mapped_column(String)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False)
    approval_status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Invitation(Base):
    __tablename__ = "invitations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"))
    email: Mapped[str] = mapped_column(String)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum))
    token: Mapped[str] = mapped_column(String, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    __table_args__ = (UniqueConstraint('email', 'agency_id', name='uq_invite_email_agency'),)
