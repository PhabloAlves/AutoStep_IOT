from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.database import init_db
from backend.limiter import limiter
from backend.mqtt_client import start_mqtt_subscriber
from backend.routes import auth, events, metrics, os_routes

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


@app.on_event("startup")
def startup():
    init_db()
    start_mqtt_subscriber()


app.include_router(auth.router,      prefix="/auth",    tags=["auth"])
app.include_router(os_routes.router, prefix="/os",      tags=["os"])
app.include_router(events.router,    prefix="/events",  tags=["events"])
app.include_router(metrics.router,   prefix="/metrics", tags=["metrics"])


@app.get("/health")
def health():
    return {"status": "ok"}
