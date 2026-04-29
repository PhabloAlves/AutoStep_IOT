from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, Stage, StageEvent

router = APIRouter()


@router.get("/daily")
def daily_metrics(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    target_date = target_date or date.today()

    rows = (
        db.query(
            StageEvent.stage,
            func.count(StageEvent.id).label("count"),
            func.avg(StageEvent.duration_sec).label("avg_duration_sec"),
            func.min(StageEvent.duration_sec).label("min_duration_sec"),
            func.max(StageEvent.duration_sec).label("max_duration_sec"),
        )
        .filter(
            func.date(StageEvent.entered_at) == target_date,
            StageEvent.exited_at != None,
        )
        .group_by(StageEvent.stage)
        .all()
    )

    return [
        {
            "stage": r.stage,
            "count": r.count,
            "avg_duration_sec": round(r.avg_duration_sec or 0),
            "min_duration_sec": r.min_duration_sec,
            "max_duration_sec": r.max_duration_sec,
        }
        for r in rows
    ]


@router.get("/bottlenecks")
def bottlenecks(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    historical = {
        r.stage: r.avg
        for r in db.query(StageEvent.stage, func.avg(StageEvent.duration_sec).label("avg"))
        .filter(StageEvent.exited_at != None)
        .group_by(StageEvent.stage)
        .all()
    }

    today_rows = (
        db.query(StageEvent.stage, func.avg(StageEvent.duration_sec).label("avg"))
        .filter(
            func.date(StageEvent.entered_at) == date.today(),
            StageEvent.exited_at != None,
        )
        .group_by(StageEvent.stage)
        .all()
    )

    result = []
    for r in today_rows:
        hist = historical.get(r.stage, 0) or 0
        if hist and r.avg > hist * 1.2:
            result.append({
                "stage": r.stage,
                "today_avg_sec": round(r.avg),
                "historical_avg_sec": round(hist),
                "excess_pct": round((r.avg / hist - 1) * 100),
            })

    return result


@router.get("/vehicles/{prism_code}/history")
def vehicle_history(
    prism_code: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    prism = db.query(Prism).filter(Prism.prism_code == prism_code).first()
    if not prism:
        return []

    events = (
        db.query(StageEvent)
        .filter(StageEvent.prism_id == prism.id)
        .order_by(StageEvent.entered_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "stage": e.stage,
            "elevator_id": e.elevator_id,
            "entered_at": e.entered_at.isoformat(),
            "exited_at": e.exited_at.isoformat() if e.exited_at else None,
            "duration_sec": e.duration_sec,
        }
        for e in events
    ]
