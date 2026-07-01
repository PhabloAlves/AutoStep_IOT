from datetime import date, datetime
from typing import Optional


def _naive(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None) if dt and dt.tzinfo else dt

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, Stage, StageEvent
from backend.utils import LOCAL_TZ_MODIFIER, shop_today, to_utc_iso

router = APIRouter()


class EventPayload(BaseModel):
    prism_code:  str
    stage:       Stage
    event_type:  str
    timestamp:   datetime
    elevator_id: Optional[int] = None


@router.get("")
def list_events(
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    today = shop_today()
    start = start or today
    end = end or today

    local_date = func.date(func.datetime(StageEvent.entered_at, LOCAL_TZ_MODIFIER))

    rows = (
        db.query(StageEvent, Prism.prism_code)
        .join(Prism, Prism.id == StageEvent.prism_id)
        .filter(
            local_date >= start,
            local_date <= end,
        )
        .order_by(StageEvent.entered_at.desc())
        .all()
    )

    return [
        {
            "prism_code":   prism_code,
            "stage":        e.stage,
            "elevator_id":  e.elevator_id,
            "entered_at":   to_utc_iso(e.entered_at),
            "exited_at":    to_utc_iso(e.exited_at),
            "duration_sec": e.duration_sec,
        }
        for e, prism_code in rows
    ]


@router.post("/")
def register_event(
    payload: EventPayload,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    prism = db.query(Prism).filter(Prism.prism_code == payload.prism_code).first()
    if not prism:
        raise HTTPException(status_code=404, detail=f"Prisma '{payload.prism_code}' não encontrado")

    ts = _naive(payload.timestamp)

    if payload.event_type == "enter":
        db.add(StageEvent(
            prism_id=prism.id,
            os_id=prism.os_id,
            elevator_id=payload.elevator_id,
            stage=payload.stage,
            entered_at=ts,
        ))
        db.commit()
        return {"message": "Entrada registrada"}

    if payload.event_type == "exit":
        event = (
            db.query(StageEvent)
            .filter(
                StageEvent.prism_id == prism.id,
                StageEvent.stage == payload.stage,
                StageEvent.exited_at == None,
            )
            .order_by(StageEvent.entered_at.desc())
            .first()
        )
        if not event:
            raise HTTPException(status_code=404, detail="Entrada aberta não encontrada para esta etapa")
        event.exited_at    = ts
        event.duration_sec = int((ts - event.entered_at).total_seconds())
        if payload.stage == Stage.OUTFLOW:
            prism.is_active = False
        db.commit()
        return {"message": "Saída registrada", "duration_sec": event.duration_sec}

    raise HTTPException(status_code=400, detail="event_type deve ser 'enter' ou 'exit'")
