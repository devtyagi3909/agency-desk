from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Task, Project, Membership
from schemas import TaskCreate, TaskUpdate, TaskResponse
from auth import get_current_membership

router = APIRouter()

@router.get("/{agency_id}/projects/{project_id}/tasks", response_model=List[TaskResponse])
def list_tasks(agency_id: str, project_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    query = db.query(Task).filter(Task.project_id == project_id, Task.agency_id == agency_id)
    if membership.role == "client_user":
        query = query.filter(Task.is_internal == False)
    return query.all()

@router.get("/{agency_id}/tasks/search", response_model=List[TaskResponse])
def search_tasks(agency_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    query = db.query(Task).filter(Task.agency_id == agency_id)
    if membership.role == "client_user":
        query = query.filter(Task.is_internal == False)
    return query.all()

@router.post("/{agency_id}/projects/{project_id}/tasks", response_model=TaskResponse)
def create_task(agency_id: str, project_id: str, task: TaskCreate, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        raise HTTPException(status_code=403)
    db_task = Task(**task.model_dump(), project_id=project_id, agency_id=agency_id, status="todo")
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.patch("/{agency_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(agency_id: str, task_id: str, task: TaskUpdate, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        raise HTTPException(status_code=403)
    db_task = db.query(Task).filter(Task.id == task_id, Task.agency_id == agency_id).first()
    if not db_task:
        raise HTTPException(status_code=404)
        
    update_data = task.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_task, k, v)
    db.commit()
    db.refresh(db_task)
    return db_task
