from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, Stage, StageEvent

router = APIRouter()


class EventPayload(BaseModel):
    prism_code:  str
    stage:       Stage
    event_type:  str        # "enter" ou "exit"
    timestamp:   datetime
    elevator_id: Optional[int] = None


@router.post("/")
def register_event(
    payload: EventPayload,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    prism = db.query(Prism).filter(Prism.prism_code == payload.prism_code).first()
    if not prism:
        raise HTTPException(status_code=404, detail=f"Prisma '{payload.prism_code}' não encontrado")

    if payload.event_type == "enter":
        db.add(StageEvent(
            prism_id=prism.id,
            elevator_id=payload.elevator_id,
            stage=payload.stage,
            entered_at=payload.timestamp,
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
        event.exited_at    = payload.timestamp
        event.duration_sec = int((payload.timestamp - event.entered_at).total_seconds())
        if payload.stage == Stage.OUTFLOW:
            prism.is_active = False
        db.commit()
        return {"message": "Saída registrada", "duration_sec": event.duration_sec}

    raise HTTPException(status_code=400, detail="event_type deve ser 'enter' ou 'exit'")
