from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, ServiceOrder, Stage, StageEvent

router = APIRouter()


# ── Endpoints existentes ───────────────────────────────────────────────────────

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
            "stage":            r.stage,
            "count":            r.count,
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
                "stage":               r.stage,
                "today_avg_sec":       round(r.avg),
                "historical_avg_sec":  round(hist),
                "excess_pct":          round((r.avg / hist - 1) * 100),
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
            "stage":        e.stage,
            "elevator_id":  e.elevator_id,
            "entered_at":   e.entered_at.isoformat(),
            "exited_at":    e.exited_at.isoformat() if e.exited_at else None,
            "duration_sec": e.duration_sec,
        }
        for e in events
    ]


# ── Novos endpoints de análise ─────────────────────────────────────────────────

@router.get("/volume-by-day")
def volume_by_day(
    days: int = 7,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Número de veículos atendidos por dia nos últimos N dias."""
    start = date.today() - timedelta(days=days - 1)

    rows = (
        db.query(
            func.date(StageEvent.entered_at).label("day"),
            func.count(StageEvent.prism_id.distinct()).label("count"),
        )
        .filter(
            StageEvent.stage == Stage.WAITING,
            func.date(StageEvent.entered_at) >= start,
        )
        .group_by("day")
        .order_by("day")
        .all()
    )

    # Preencher dias sem dados com 0
    row_map = {str(r.day): r.count for r in rows}
    result = []
    for i in range(days):
        day = start + timedelta(days=i)
        day_str = day.strftime("%d/%m")
        result.append({"date": day_str, "count": row_map.get(str(day), 0)})

    return result


@router.get("/service-type-stats")
def service_type_stats(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Tempo médio total e de serviço por tipo de OS."""
    # Buscar todos os stage_events concluídos com OS vinculada
    rows = (
        db.query(
            ServiceOrder.service_type,
            StageEvent.prism_id,
            func.sum(StageEvent.duration_sec).label("total_sec"),
            func.sum(
                func.case((StageEvent.stage == Stage.SERVICE, StageEvent.duration_sec), else_=0)
            ).label("service_sec"),
        )
        .join(Prism, Prism.id == StageEvent.prism_id)
        .join(ServiceOrder, ServiceOrder.id == Prism.os_id)
        .filter(StageEvent.exited_at != None, ServiceOrder.service_type != None)
        .group_by(ServiceOrder.service_type, StageEvent.prism_id)
        .all()
    )

    # Agregar por service_type
    agg: dict = {}
    for r in rows:
        st = r.service_type
        if st not in agg:
            agg[st] = {"total_sec_sum": 0, "service_sec_sum": 0, "count": 0}
        agg[st]["total_sec_sum"]   += r.total_sec or 0
        agg[st]["service_sec_sum"] += r.service_sec or 0
        agg[st]["count"]           += 1

    return [
        {
            "service_type":    st,
            "avg_total_sec":   round(v["total_sec_sum"] / v["count"]) if v["count"] else 0,
            "avg_service_sec": round(v["service_sec_sum"] / v["count"]) if v["count"] else 0,
            "count":           v["count"],
        }
        for st, v in sorted(agg.items(), key=lambda x: -x[1]["total_sec_sum"])
    ]


@router.get("/peak-hours")
def peak_hours(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Número de entradas de veículos por hora do dia (stage=waiting)."""
    target_date = target_date or date.today()

    rows = (
        db.query(
            func.strftime("%H", StageEvent.entered_at).label("hour"),
            func.count(StageEvent.id).label("count"),
        )
        .filter(
            StageEvent.stage == Stage.WAITING,
            func.date(StageEvent.entered_at) == target_date,
        )
        .group_by("hour")
        .all()
    )

    hour_map = {r.hour: r.count for r in rows}

    # Exibir faixa 07h-18h, completar com zeros
    return [
        {"hour": f"{h:02d}h", "count": hour_map.get(f"{h:02d}", 0)}
        for h in range(7, 19)
    ]


@router.get("/outflow-wait")
def outflow_wait(
    days: int = 7,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Tempo médio de espera pós-pronto (stage=outflow) por dia, em minutos."""
    start = date.today() - timedelta(days=days - 1)

    rows = (
        db.query(
            func.date(StageEvent.entered_at).label("day"),
            func.avg(StageEvent.duration_sec).label("avg_sec"),
        )
        .filter(
            StageEvent.stage == Stage.OUTFLOW,
            StageEvent.exited_at != None,
            func.date(StageEvent.entered_at) >= start,
        )
        .group_by("day")
        .order_by("day")
        .all()
    )

    row_map = {str(r.day): round((r.avg_sec or 0) / 60) for r in rows}
    result = []
    for i in range(days):
        day = start + timedelta(days=i)
        result.append({
            "date":    day.strftime("%d/%m"),
            "avg_min": row_map.get(str(day), 0),
        })

    return result


@router.get("/punctuality")
def punctuality(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Taxa de pontualidade por tipo de serviço.

    On-time = duração do stage 'service' ≤ média histórica para aquele service_type.
    """
    # Média histórica de 'service' por service_type
    hist_rows = (
        db.query(
            ServiceOrder.service_type,
            func.avg(StageEvent.duration_sec).label("avg_sec"),
        )
        .join(Prism, Prism.os_id == ServiceOrder.id)
        .join(StageEvent, StageEvent.prism_id == Prism.id)
        .filter(
            StageEvent.stage == Stage.SERVICE,
            StageEvent.exited_at != None,
            ServiceOrder.service_type != None,
        )
        .group_by(ServiceOrder.service_type)
        .all()
    )
    hist_avg = {r.service_type: r.avg_sec or 0 for r in hist_rows}

    # Todos os eventos 'service' concluídos com OS vinculada
    detail_rows = (
        db.query(
            ServiceOrder.service_type,
            StageEvent.duration_sec,
        )
        .join(Prism, Prism.os_id == ServiceOrder.id)
        .join(StageEvent, StageEvent.prism_id == Prism.id)
        .filter(
            StageEvent.stage == Stage.SERVICE,
            StageEvent.exited_at != None,
            ServiceOrder.service_type != None,
        )
        .all()
    )

    agg: dict = {}
    for r in detail_rows:
        st = r.service_type
        if st not in agg:
            agg[st] = {"on_time": 0, "total": 0}
        avg = hist_avg.get(st, 0)
        agg[st]["total"] += 1
        if avg and (r.duration_sec or 0) <= avg:
            agg[st]["on_time"] += 1

    return [
        {"service_type": st, "on_time": v["on_time"], "total": v["total"]}
        for st, v in sorted(agg.items())
    ]
