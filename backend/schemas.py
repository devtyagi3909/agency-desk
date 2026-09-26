from datetime import datetime, date
from typing import Literal, Optional, Dict
from pydantic import BaseModel, EmailStr, ConfigDict
from models import RoleEnum, ProjectStatus, TaskStatus, PriorityEnum, ApprovalStatus


# Auth
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    agency_slug: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: RoleEnum


# Agency
class AgencyCreate(BaseModel):
    name: str
    slug: str


class AgencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str


# Client
class ClientCreate(BaseModel):
    name: str
    email: EmailStr


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    agency_id: str


# Project
class ProjectCreate(BaseModel):
    name: str
    description: str
    client_id: str


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    description: str
    status: ProjectStatus
    client_id: str
    agency_id: str


# Task
class TaskCreate(BaseModel):
    title: str
    description: str
    priority: PriorityEnum
    is_internal: bool = False
    assignee_membership_id: Optional[str] = None
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[PriorityEnum] = None
    is_internal: Optional[bool] = None
    assignee_membership_id: Optional[str] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: str
    status: TaskStatus
    priority: PriorityEnum
    is_internal: bool
    assignee_membership_id: Optional[str] = None
    due_date: Optional[date] = None
    project_id: str
    agency_id: str


# Comment
class CommentCreate(BaseModel):
    content: str
    is_internal: bool = False


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    content: str
    is_internal: bool
    author_membership_id: str
    task_id: str
    created_at: datetime


# TimeEntry
class TimeEntryCreate(BaseModel):
    duration_minutes: int
    note: Optional[str] = None
    date: date


class TimeEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    duration_minutes: int
    note: Optional[str] = None
    date: date
    task_id: str
    membership_id: str


# Attachment
class AttachmentApproval(BaseModel):
    approval_status: Literal["approved", "needs_changes"]


class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    filename: str
    is_internal: bool
    approval_status: ApprovalStatus
    task_id: str
    uploaded_by_membership_id: str


# Invitation
class InviteCreate(BaseModel):
    email: EmailStr
    role: RoleEnum


class InviteAccept(BaseModel):
    token: str


class InviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    role: RoleEnum
    expires_at: datetime
    token: str


# Dashboard
class DashboardResponse(BaseModel):
    task_counts_by_status: Dict[str, int]
    total_hours: int
    pending_approvals: int


# Membership
class MembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    agency_id: str
    role: RoleEnum
    client_id: Optional[str] = None
