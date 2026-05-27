import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.auth import hash_password
from backend.database import SessionLocal, init_db
from backend.limiter import limiter
from backend.models import Prism, User
from backend.mqtt_client import start_mqtt_subscriber
from backend.routes import auth, events, metrics, os_routes
from backend.routes import prisms as prisms_routes

app = FastAPI(title="AutoStep API", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _seed_data():
    db = SessionLocal()
    try:
        # Admin user via env vars
        username = os.getenv("AUTOSTEP_ADMIN_USER", "admin")
        password = os.getenv("AUTOSTEP_ADMIN_PASSWORD")
        if password and not db.query(User).filter_by(username=username).first():
            db.add(User(username=username, password_hash=hash_password(password)))

        # Prisms PRISMA_01..PRISMA_10
        for i in range(1, 11):
            code = f"PRISMA_{i:02d}"
            if not db.query(Prism).filter_by(prism_code=code).first():
                db.add(Prism(prism_code=code, is_active=False))

        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup():
    init_db()
    _seed_data()
    start_mqtt_subscriber()


app.include_router(auth.router,          prefix="/auth",    tags=["auth"])
app.include_router(os_routes.router,     prefix="/os",      tags=["os"])
app.include_router(events.router,        prefix="/events",  tags=["events"])
app.include_router(metrics.router,       prefix="/metrics", tags=["metrics"])
app.include_router(prisms_routes.router, prefix="/prisms",  tags=["prisms"])


@app.get("/health")
def health():
    return {"status": "ok"}
