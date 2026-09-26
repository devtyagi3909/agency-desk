from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Task, TimeEntry, Attachment, Membership
from schemas import DashboardResponse
from auth import get_current_membership

router = APIRouter()

@router.get("/{agency_id}/projects/{project_id}/dashboard", response_model=DashboardResponse)
def get_dashboard(agency_id: str, project_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    tasks_query = db.query(Task.status, func.count(Task.id)).filter(Task.project_id == project_id, Task.agency_id == agency_id)
    if membership.role == "client_user":
        tasks_query = tasks_query.filter(Task.is_internal == False)
    
    tasks_by_status = dict(tasks_query.group_by(Task.status).all())
    
    if membership.role == "client_user":
        total_hours = 0
    else:
        total_mins = db.query(func.sum(TimeEntry.duration_minutes)).join(Task).filter(Task.project_id == project_id, Task.agency_id == agency_id).scalar()
        total_hours = (total_mins or 0) // 60
        
    pending_approvals = db.query(func.count(Attachment.id)).join(Task).filter(
        Task.project_id == project_id,
        Task.agency_id == agency_id,
        Attachment.approval_status == "pending",
        Attachment.is_internal == False
    ).scalar()
    
    return {
        "task_counts_by_status": tasks_by_status,
        "total_hours": total_hours,
        "pending_approvals": pending_approvals
    }
