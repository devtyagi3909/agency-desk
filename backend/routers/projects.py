from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, ProjectMember, Task, Membership
from schemas import ProjectCreate, ProjectResponse
from auth import get_current_membership

router = APIRouter()

@router.get("/{agency_id}", response_model=List[ProjectResponse])
def list_projects(agency_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        return db.query(Project).filter(Project.client_id == membership.client_id, Project.agency_id == agency_id).all()
    return db.query(Project).filter(Project.agency_id == agency_id).all()

@router.get("/{agency_id}/{project_id}", response_model=ProjectResponse)
def get_project(agency_id: str, project_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    project = db.query(Project).filter(Project.id == project_id, Project.agency_id == agency_id).first()
    if not project:
        raise HTTPException(status_code=404)
    if membership.role == "client_user" and project.client_id != membership.client_id:
        raise HTTPException(status_code=403)
    return project

@router.post("/{agency_id}", response_model=ProjectResponse)
def create_project(agency_id: str, project: ProjectCreate, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        raise HTTPException(status_code=403)
    db_project = Project(**project.model_dump(), agency_id=agency_id, status="active")
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{agency_id}/{project_id}/members/{membership_id}")
def remove_member(agency_id: str, project_id: str, membership_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        raise HTTPException(status_code=403)
    
    pm = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.membership_id == membership_id).first()
    if pm:
        db.delete(pm)
        
    db.query(Task).filter(Task.project_id == project_id, Task.assignee_membership_id == membership_id).update({"assignee_membership_id": None})
    db.commit()
    return {"status": "ok"}
