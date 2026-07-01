from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, ServiceOrder, Stage, StageEvent
from backend.utils import LOCAL_TZ_MODIFIER, shop_today, to_utc_iso

router = APIRouter()


def _local_date(col):
    return func.date(func.datetime(col, LOCAL_TZ_MODIFIER))


@router.get("/daily")
def daily_metrics(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    target_date = target_date or shop_today()

    rows = (
        db.query(
            StageEvent.stage,
            func.count(StageEvent.id).label("count"),
            func.avg(StageEvent.duration_sec).label("avg_duration_sec"),
            func.min(StageEvent.duration_sec).label("min_duration_sec"),
            func.max(StageEvent.duration_sec).label("max_duration_sec"),
        )
        .filter(
            _local_date(StageEvent.entered_at) == target_date,
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
            _local_date(StageEvent.entered_at) == shop_today(),
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
            "entered_at":   to_utc_iso(e.entered_at),
            "exited_at":    to_utc_iso(e.exited_at),
            "duration_sec": e.duration_sec,
        }
        for e in events
    ]


@router.get("/volume-by-day")
def volume_by_day(
    days: int = 7,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    start = shop_today() - timedelta(days=days - 1)

    rows = (
        db.query(
            _local_date(StageEvent.entered_at).label("day"),
            func.count(StageEvent.prism_id.distinct()).label("count"),
        )
        .filter(
            StageEvent.stage == Stage.WAITING,
            _local_date(StageEvent.entered_at) >= start,
        )
        .group_by("day")
        .order_by("day")
        .all()
    )

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
    rows = (
        db.query(
            ServiceOrder.service_type,
            StageEvent.os_id,
            func.sum(StageEvent.duration_sec).label("total_sec"),
            func.sum(
                case((StageEvent.stage == Stage.SERVICE, StageEvent.duration_sec), else_=0)
            ).label("service_sec"),
        )
        .join(ServiceOrder, ServiceOrder.id == StageEvent.os_id)
        .filter(StageEvent.exited_at != None, ServiceOrder.service_type != None)
        .group_by(ServiceOrder.service_type, StageEvent.os_id)
        .all()
    )

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
    target_date = target_date or shop_today()

    rows = (
        db.query(
            func.strftime("%H", func.datetime(StageEvent.entered_at, LOCAL_TZ_MODIFIER)).label("hour"),
            func.count(StageEvent.id).label("count"),
        )
        .filter(
            StageEvent.stage == Stage.WAITING,
            _local_date(StageEvent.entered_at) == target_date,
        )
        .group_by("hour")
        .all()
    )

    hour_map = {r.hour: r.count for r in rows}

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
    start = shop_today() - timedelta(days=days - 1)

    rows = (
        db.query(
            _local_date(StageEvent.entered_at).label("day"),
            func.avg(StageEvent.duration_sec).label("avg_sec"),
        )
        .filter(
            StageEvent.stage == Stage.OUTFLOW,
            StageEvent.exited_at != None,
            _local_date(StageEvent.entered_at) >= start,
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
    hist_rows = (
        db.query(
            ServiceOrder.service_type,
            func.avg(StageEvent.duration_sec).label("avg_sec"),
        )
        .join(StageEvent, StageEvent.os_id == ServiceOrder.id)
        .filter(
            StageEvent.stage == Stage.SERVICE,
            StageEvent.exited_at != None,
            ServiceOrder.service_type != None,
        )
        .group_by(ServiceOrder.service_type)
        .all()
    )
    hist_avg = {r.service_type: r.avg_sec or 0 for r in hist_rows}

    detail_rows = (
        db.query(
            ServiceOrder.service_type,
            StageEvent.duration_sec,
        )
        .join(StageEvent, StageEvent.os_id == ServiceOrder.id)
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
