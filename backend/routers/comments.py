from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Comment, Task, Membership
from schemas import CommentCreate, CommentResponse
from auth import get_current_membership

router = APIRouter()

@router.get("/{agency_id}/tasks/{task_id}/comments", response_model=List[CommentResponse])
def list_comments(agency_id: str, task_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    query = db.query(Comment).filter(Comment.task_id == task_id, Comment.agency_id == agency_id)
    if membership.role == "client_user":
        query = query.filter(Comment.is_internal == False)
    return query.all()

@router.post("/{agency_id}/tasks/{task_id}/comments", response_model=CommentResponse)
def create_comment(agency_id: str, task_id: str, comment: CommentCreate, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user" and comment.is_internal:
        raise HTTPException(status_code=403)
    db_comment = Comment(
        content=comment.content,
        is_internal=comment.is_internal,
        task_id=task_id,
        agency_id=agency_id,
        author_membership_id=membership.id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment
