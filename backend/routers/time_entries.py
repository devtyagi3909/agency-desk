from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import TimeEntry, Membership
from schemas import TimeEntryCreate, TimeEntryResponse
from auth import get_current_membership

router = APIRouter()

@router.get("/{agency_id}/tasks/{task_id}/time", response_model=List[TimeEntryResponse])
def list_time(agency_id: str, task_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        raise HTTPException(status_code=403)
    return db.query(TimeEntry).filter(TimeEntry.task_id == task_id, TimeEntry.agency_id == agency_id).all()

@router.post("/{agency_id}/tasks/{task_id}/time", response_model=TimeEntryResponse)
def create_time(agency_id: str, task_id: str, time: TimeEntryCreate, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        raise HTTPException(status_code=403)
    db_time = TimeEntry(**time.model_dump(), task_id=task_id, agency_id=agency_id, membership_id=membership.id)
    db.add(db_time)
    db.commit()
    db.refresh(db_time)
    return db_time
