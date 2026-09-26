from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Client, Membership
from schemas import ClientCreate, ClientResponse
from auth import get_current_membership

router = APIRouter()

@router.get("/{agency_id}", response_model=List[ClientResponse])
def list_clients(agency_id: str, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        return db.query(Client).filter(Client.id == membership.client_id).all()
    return db.query(Client).filter(Client.agency_id == agency_id).all()

@router.post("/{agency_id}", response_model=ClientResponse)
def create_client(agency_id: str, client: ClientCreate, db: Session = Depends(get_db), membership: Membership = Depends(get_current_membership)):
    if membership.role == "client_user":
        raise HTTPException(status_code=403, detail="Clients cannot create clients")
    db_client = Client(**client.model_dump(), agency_id=agency_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client
