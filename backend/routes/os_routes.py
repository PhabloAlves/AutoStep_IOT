import io
from datetime import datetime
from typing import Optional

import pdfplumber
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, ServiceOrder

router = APIRouter()

MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB
PDF_MAGIC = b"%PDF-"


# ── Schemas ──────────────────────────────────────────────────────────────────

class CreateOSPayload(BaseModel):
    os_number:    str
    plate:        str
    marca:        Optional[str] = None
    modelo:       Optional[str] = None
    service_type: Optional[str] = None
    mechanic:     Optional[str] = None
    opened_at:    Optional[datetime] = None


class LinkPrismPayload(BaseModel):
    prism_code: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_os_data(pdf_bytes: bytes) -> dict:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    # TODO: implementar parser específico após ter o layout real do PDF da oficina
    # Mapear os campos: os_number, plate, service_type, mechanic, opened_at
    return {"raw_text": text}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_os(
    payload: CreateOSPayload,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Criar uma Ordem de Serviço manualmente."""
    if db.query(ServiceOrder).filter_by(os_number=payload.os_number).first():
        raise HTTPException(status_code=400, detail=f"OS '{payload.os_number}' já existe")

    os_obj = ServiceOrder(
        os_number=payload.os_number,
        plate=payload.plate,
        marca=payload.marca,
        modelo=payload.modelo,
        service_type=payload.service_type,
        mechanic=payload.mechanic,
        opened_at=payload.opened_at,
    )
    db.add(os_obj)
    db.commit()
    db.refresh(os_obj)
    return {
        "id":           os_obj.id,
        "os_number":    os_obj.os_number,
        "plate":        os_obj.plate,
        "marca":        os_obj.marca,
        "modelo":       os_obj.modelo,
        "service_type": os_obj.service_type,
        "mechanic":     os_obj.mechanic,
        "opened_at":    os_obj.opened_at.isoformat() if os_obj.opened_at else None,
        "created_at":   os_obj.created_at.isoformat() if os_obj.created_at else None,
    }


@router.post("/upload")
def upload_os(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    content = file.file.read(MAX_PDF_BYTES + 1)
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo PDF excede o limite de 10 MB")
    if not content.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="O arquivo não é um PDF válido")
    data = _extract_os_data(content)

    # TODO: mapear `data` para ServiceOrder após definir o layout do PDF
    return {"message": "PDF recebido com sucesso", "extracted": data}


@router.get("/")
def list_orders(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    orders = db.query(ServiceOrder).order_by(ServiceOrder.created_at.desc()).all()

    # Build a map from os_id -> prism_code (only active prisms linked to an OS)
    prisms = db.query(Prism).filter(Prism.os_id != None).all()
    os_to_prism = {p.os_id: p.prism_code for p in prisms}

    return [
        {
            "id":           o.id,
            "os_number":    o.os_number,
            "plate":        o.plate,
            "marca":        o.marca,
            "modelo":       o.modelo,
            "service_type": o.service_type,
            "mechanic":     o.mechanic,
            "opened_at":    o.opened_at.isoformat() if o.opened_at else None,
            "prism_code":   os_to_prism.get(o.id),
        }
        for o in orders
    ]


@router.post("/{os_id}/link-prism")
def link_prism(
    os_id: int,
    payload: LinkPrismPayload,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Vincula um prisma livre a uma Ordem de Serviço."""
    os_obj = db.query(ServiceOrder).filter_by(id=os_id).first()
    if not os_obj:
        raise HTTPException(status_code=404, detail="OS não encontrada")

    prism = db.query(Prism).filter_by(prism_code=payload.prism_code).first()
    if not prism:
        raise HTTPException(status_code=404, detail=f"Prisma '{payload.prism_code}' não encontrado")

    if prism.is_active:
        raise HTTPException(status_code=400, detail=f"Prisma '{payload.prism_code}' já está em uso")

    prism.os_id = os_obj.id
    prism.is_active = True
    db.commit()

    return {"message": f"{payload.prism_code} vinculado à OS {os_obj.os_number}"}
