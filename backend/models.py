import enum
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Stage(str, enum.Enum):
    WAITING   = "waiting"
    TRANSIT   = "transit"
    LIFT_UP   = "lift_up"
    SERVICE   = "service"
    LIFT_DOWN = "lift_down"
    OUTFLOW   = "outflow"


class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id           = Column(Integer, primary_key=True)
    os_number    = Column(String, unique=True, nullable=False)
    plate        = Column(String, nullable=False)
    service_type = Column(String)
    mechanic     = Column(String)
    opened_at    = Column(DateTime)
    created_at   = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    prisms = relationship("Prism", back_populates="service_order")


class Prism(Base):
    __tablename__ = "prisms"

    id         = Column(Integer, primary_key=True)
    prism_code = Column(String, unique=True, nullable=False)
    os_id      = Column(Integer, ForeignKey("service_orders.id"), nullable=True)
    is_active  = Column(Boolean, default=False)

    service_order = relationship("ServiceOrder", back_populates="prisms")
    stage_events  = relationship("StageEvent", back_populates="prism")


class StageEvent(Base):
    __tablename__ = "stage_events"

    id           = Column(Integer, primary_key=True)
    prism_id     = Column(Integer, ForeignKey("prisms.id"), nullable=False)
    elevator_id  = Column(Integer, nullable=True)   # NULL para waiting e outflow
    stage        = Column(SAEnum(Stage), nullable=False)
    entered_at   = Column(DateTime, nullable=False)
    exited_at    = Column(DateTime, nullable=True)
    duration_sec = Column(Integer, nullable=True)   # calculado no exit

    prism = relationship("Prism", back_populates="stage_events")


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    username      = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
