from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Prism, StageEvent

router = APIRouter()

STAGE_ORDER = ["waiting", "transit", "lift_up", "service", "lift_down", "outflow"]


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


@router.get("/{prism_code}/status")
def prism_status(
    prism_code: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Retorna a etapa atual do prisma — para o simulador retomar de onde parou."""
    prism = db.query(Prism).filter_by(prism_code=prism_code).first()
    if not prism:
        raise HTTPException(status_code=404, detail=f"Prisma '{prism_code}' não encontrado")

    # Evento aberto (entrou mas ainda não saiu)
    open_event = (
        db.query(StageEvent)
        .filter(StageEvent.prism_id == prism.id, StageEvent.exited_at == None)
        .order_by(StageEvent.entered_at.desc())
        .first()
    )

    # Último evento fechado (para saber de onde continuar se não há evento aberto)
    last_closed = (
        db.query(StageEvent)
        .filter(StageEvent.prism_id == prism.id, StageEvent.exited_at != None)
        .order_by(StageEvent.entered_at.desc())
        .first()
    )

    if open_event:
        return {
            "prism_code": prism_code,
            "current_stage": open_event.stage,
            "inside": True,   # está dentro da etapa, aguardando SAIR
        }

    if last_closed:
        stage_val = last_closed.stage.value if hasattr(last_closed.stage, "value") else last_closed.stage
        idx = STAGE_ORDER.index(stage_val) if stage_val in STAGE_ORDER else -1
        next_idx = idx + 1
        if next_idx < len(STAGE_ORDER):
            return {
                "prism_code": prism_code,
                "current_stage": STAGE_ORDER[next_idx],
                "inside": False,  # precisa ENTRAR na próxima etapa
            }

    # Sem histórico — começa do zero
    return {"prism_code": prism_code, "current_stage": "waiting", "inside": False}
