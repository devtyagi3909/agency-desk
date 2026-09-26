from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timedelta
from database import get_db
from models import Invitation, Membership, User
from schemas import InviteCreate, InviteAccept, InviteResponse
from auth import get_current_membership, get_current_user

router = APIRouter()


@router.post("/accept")
def accept_invite(
    accept: InviteAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invitation = db.query(Invitation).filter(Invitation.token == accept.token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid token")
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")

    # Check if membership already exists — idempotent
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.agency_id == invitation.agency_id,
    ).first()

    if not membership:
        membership = Membership(
            user_id=current_user.id,
            agency_id=invitation.agency_id,
            role=invitation.role,
        )
        db.add(membership)

    invitation.accepted = True
    db.commit()
    return {"status": "ok", "agency_id": invitation.agency_id}


@router.post("/{agency_id}", response_model=InviteResponse)
def create_invite(
    agency_id: str,
    invite: InviteCreate,
    db: Session = Depends(get_db),
    membership: Membership = Depends(get_current_membership),
):
    if membership.role != "agency_admin":
        raise HTTPException(status_code=403, detail="Only agency admins can invite")

    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)

    # Upsert: update token if invitation already exists for this email+agency
    existing = db.query(Invitation).filter(
        Invitation.email == invite.email,
        Invitation.agency_id == agency_id,
    ).first()

    if existing:
        existing.token = token
        existing.expires_at = expires_at
        existing.role = invite.role
        existing.accepted = False
        db_inv = existing
    else:
        db_inv = Invitation(
            agency_id=agency_id,
            email=str(invite.email),
            role=invite.role,
            token=token,
            expires_at=expires_at,
        )
        db.add(db_inv)

    db.commit()
    db.refresh(db_inv)
    return db_inv


@router.get("/{agency_id}", response_model=List[InviteResponse])
def list_invites(
    agency_id: str,
    db: Session = Depends(get_db),
    membership: Membership = Depends(get_current_membership),
):
    if membership.role != "agency_admin":
        raise HTTPException(status_code=403, detail="Only agency admins can view invites")
    return db.query(Invitation).filter(
        Invitation.agency_id == agency_id,
        Invitation.accepted == False,
    ).all()
