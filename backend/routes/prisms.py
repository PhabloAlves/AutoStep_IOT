from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism

router = APIRouter()


@router.get("/available")
def available_prisms(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Lista prismas disponíveis (is_active=False), prontos para vincular a uma OS."""
    prisms = (
        db.query(Prism)
        .filter(Prism.is_active == False)
        .order_by(Prism.prism_code)
        .all()
    )
    return [{"id": p.id, "prism_code": p.prism_code} for p in prisms]
