from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid
from database import get_db
from models import Attachment, Membership, ApprovalStatus
from schemas import AttachmentResponse, AttachmentApproval
from auth import get_current_membership

router = APIRouter()

@router.post("/{agency_id}/tasks/{task_id}/attachments", response_model=AttachmentResponse)
def upload_attachment(agency_id: str, task_id: str, file: UploadFile = File(...), is_internal: bool = Form(False), db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user" and is_internal:
        raise HTTPException(status_code=403)
        
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = f"uploads/{filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_att = Attachment(
        task_id=task_id,
        agency_id=agency_id,
        uploaded_by_membership_id=membership.id,
        filename=file.filename,
        file_path=file_path,
        is_internal=is_internal,
        approval_status=ApprovalStatus.pending
    )
    db.add(db_att)
    db.commit()
    db.refresh(db_att)
    return db_att

@router.get("/{agency_id}/tasks/{task_id}/attachments", response_model=List[AttachmentResponse])
def list_attachments(agency_id: str, task_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    query = db.query(Attachment).filter(Attachment.task_id == task_id, Attachment.agency_id == agency_id)
    if membership.role == "client_user":
        query = query.filter(Attachment.is_internal == False)
    return query.all()

@router.patch("/{agency_id}/attachments/{attachment_id}/approve", response_model=AttachmentResponse)
def approve_attachment(agency_id: str, attachment_id: str, approval: AttachmentApproval, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role != "client_user":
        raise HTTPException(status_code=403)
    db_att = db.query(Attachment).filter(Attachment.id == attachment_id, Attachment.agency_id == agency_id, Attachment.is_internal == False).first()
    if not db_att:
        raise HTTPException(status_code=404)
        
    db_att.approval_status = approval.approval_status
    db.commit()
    db.refresh(db_att)
    return db_att
