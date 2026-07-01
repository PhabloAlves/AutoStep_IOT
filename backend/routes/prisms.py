from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, StageEvent
from backend.utils import to_utc_iso

router = APIRouter()

STAGE_ORDER = ["waiting", "transit", "lift_up", "service", "lift_down", "outflow"]


@router.get("/available")
def available_prisms(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    prisms = (
        db.query(Prism)
        .filter(Prism.is_active == False)
        .order_by(Prism.prism_code)
        .all()
    )
    return [{"id": p.id, "prism_code": p.prism_code} for p in prisms]


def _current_status(db: Session, prism: Prism) -> dict:
    open_event = (
        db.query(StageEvent)
        .filter(StageEvent.prism_id == prism.id, StageEvent.exited_at == None)
        .order_by(StageEvent.entered_at.desc())
        .first()
    )
    if open_event:
        return {
            "current_stage": open_event.stage.value,
            "inside": True,
            "stage_entered_at": to_utc_iso(open_event.entered_at),
        }

    last_closed = (
        db.query(StageEvent)
        .filter(StageEvent.prism_id == prism.id, StageEvent.exited_at != None)
        .order_by(StageEvent.entered_at.desc())
        .first()
    )
    if last_closed:
        stage_val = last_closed.stage.value
        idx = STAGE_ORDER.index(stage_val) if stage_val in STAGE_ORDER else -1
        next_idx = idx + 1
        if next_idx < len(STAGE_ORDER):
            return {
                "current_stage": STAGE_ORDER[next_idx],
                "inside": False,
                "stage_entered_at": None,
            }

    return {"current_stage": "waiting", "inside": False, "stage_entered_at": None}


@router.get("/active")
def active_sessions(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    prisms = (
        db.query(Prism)
        .filter(Prism.is_active == True)
        .order_by(Prism.prism_code)
        .all()
    )

    result = []
    for prism in prisms:
        status = _current_status(db, prism)
        os_obj = prism.service_order
        result.append({
            "prism_code":   prism.prism_code,
            "os_number":    os_obj.os_number if os_obj else None,
            "plate":        os_obj.plate if os_obj else None,
            "service_type": os_obj.service_type if os_obj else None,
            **status,
        })
    return result


@router.get("/{prism_code}/status")
def prism_status(
    prism_code: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    prism = db.query(Prism).filter_by(prism_code=prism_code).first()
    if not prism:
        raise HTTPException(status_code=404, detail=f"Prisma '{prism_code}' não encontrado")

    status = _current_status(db, prism)
    return {"prism_code": prism_code, **status}
