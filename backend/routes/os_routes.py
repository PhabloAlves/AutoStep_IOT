import io

import pdfplumber
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import ServiceOrder

router = APIRouter()

MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB
PDF_MAGIC = b"%PDF-"


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
