import io

import pdfplumber
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import ServiceOrder

router = APIRouter()


def _extract_os_data(pdf_bytes: bytes) -> dict:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    # TODO: implementar parser específico após ter o layout real do PDF da oficina
    # Mapear os campos: os_number, plate, service_type, mechanic, opened_at
    return {"raw_text": text}


@router.post("/upload")
def upload_os(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    content = file.file.read()
    data = _extract_os_data(content)

    # TODO: mapear `data` para ServiceOrder após definir o layout do PDF
    return {"message": "PDF recebido com sucesso", "extracted": data}


@router.get("/")
def list_orders(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    orders = db.query(ServiceOrder).order_by(ServiceOrder.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "os_number": o.os_number,
            "plate": o.plate,
            "service_type": o.service_type,
            "mechanic": o.mechanic,
            "opened_at": o.opened_at.isoformat() if o.opened_at else None,
        }
        for o in orders
    ]
