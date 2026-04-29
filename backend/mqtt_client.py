import json
import os
import threading
from datetime import datetime

import paho.mqtt.client as mqtt

from backend.database import SessionLocal
from backend.models import Prism, Stage, StageEvent

MQTT_HOST = os.environ.get("MQTT_HOST", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", 1883))


def _process(payload: dict, event_type: str):
    db = SessionLocal()
    try:
        prism_code  = payload["prism_code"]
        stage       = Stage(payload["stage"])
        timestamp   = datetime.fromisoformat(payload["timestamp"].replace("Z", "+00:00"))
        elevator_id = payload.get("elevator_id")

        prism = db.query(Prism).filter(Prism.prism_code == prism_code).first()
        if not prism:
            print(f"[MQTT] Prisma desconhecido: {prism_code}")
            return

        if event_type == "enter":
            db.add(StageEvent(
                prism_id=prism.id,
                elevator_id=elevator_id,
                stage=stage,
                entered_at=timestamp,
            ))

        elif event_type == "exit":
            event = (
                db.query(StageEvent)
                .filter(
                    StageEvent.prism_id == prism.id,
                    StageEvent.stage == stage,
                    StageEvent.exited_at == None,
                )
                .order_by(StageEvent.entered_at.desc())
                .first()
            )
            if not event:
                print(f"[MQTT] Entrada não encontrada: {prism_code}/{stage}")
                return
            event.exited_at    = timestamp
            event.duration_sec = int((timestamp - event.entered_at).total_seconds())
            if stage == Stage.OUTFLOW:
                prism.is_active = False

        db.commit()
        print(f"[MQTT] {event_type.upper()} {prism_code}/{stage}")
    except Exception as exc:
        db.rollback()
        print(f"[MQTT] Erro: {exc}")
    finally:
        db.close()


def _on_message(client, userdata, message):
    try:
        event_type = message.topic.split("/")[-1]
        if event_type not in ("enter", "exit"):
            return
        payload = json.loads(message.payload.decode())
        _process(payload, event_type)
    except Exception as exc:
        print(f"[MQTT] Erro ao parsear mensagem: {exc}")


def start_mqtt_subscriber():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = _on_message
    try:
        client.connect(MQTT_HOST, MQTT_PORT)
        client.subscribe("autostep/#")
        thread = threading.Thread(target=client.loop_forever, daemon=True)
        thread.start()
        print(f"[MQTT] Subscriber conectado em {MQTT_HOST}:{MQTT_PORT} — ouvindo autostep/#")
    except Exception as exc:
        print(f"[MQTT] Falha ao conectar: {exc}")
    return client
