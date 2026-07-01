import json
import os
from datetime import datetime, timezone
from pathlib import Path

import paho.mqtt.client as mqtt
import serial

CONFIG_PATH = Path(__file__).parent / "rfid_config.json"

STAGE_ORDER     = ("waiting", "transit", "lift_up", "service", "lift_down", "outflow")
EXTERNAL_STAGES = {"waiting", "outflow"}

STAGE_LABELS_PT = {
    "waiting":   "Espera",
    "transit":   "Deslocamento",
    "lift_up":   "Subida/Inspeção",
    "service":   "Serviço",
    "lift_down": "Descida",
    "outflow":   "Saída",
}
EVENT_TYPE_LABELS_PT = {
    "enter": "ENTRADA",
    "exit":  "SAÍDA",
}

MQTT_USER     = os.environ.get("MQTT_USER", "autostep")
MQTT_PASSWORD = os.environ.get("MQTT_PASSWORD", "autostep123")


def load_config() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def publish_event(client, prism_code, stage, event_type, elevator_id):
    topic = f"autostep/prisma/{prism_code}/{event_type}"
    payload = {
        "stage":       stage,
        "timestamp":   datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "prism_code":  prism_code,
        "elevator_id": elevator_id,
    }
    client.publish(topic, json.dumps(payload), qos=1)
    label = f"elevador {elevator_id}" if elevator_id else "externo"
    evento = EVENT_TYPE_LABELS_PT.get(event_type, event_type.upper())
    etapa = STAGE_LABELS_PT.get(stage, stage)
    print(f"  -> [{evento}] {etapa} | {prism_code} ({label})")


def main():
    config      = load_config()
    broker      = config["broker"]
    ser_cfg     = config["serial"]
    elevator_id = config.get("elevator_id", 1)
    cards       = config.get("cards", {})

    state = {}

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    client.connect(broker["host"], broker["port"])
    client.loop_start()
    print(f"[MQTT] Conectado em {broker['host']}:{broker['port']}")

    ser = serial.Serial(ser_cfg["port"], ser_cfg["baud"], timeout=1)
    print(f"[SERIAL] Ouvindo {ser_cfg['port']} @ {ser_cfg['baud']}. Aproxime um cartão...\n")

    try:
        while True:
            linha = ser.readline().decode(errors="ignore").strip()
            if not linha.startswith("CARD:"):
                continue

            uid = linha[5:].strip().lower()
            prism_code = cards.get(uid)

            if not prism_code:
                print(f"[?] Cartão não mapeado: {uid}")
                print(f"    Adicione em rfid_config.json -> \"cards\": {{ \"{uid}\": \"PRISMA_01\" }}")
                continue

            st = state.setdefault(prism_code, {"idx": 0, "inside": False})
            if st["idx"] >= len(STAGE_ORDER):
                print(f"[i] {prism_code} já concluiu o fluxo. Reiniciando.")
                st["idx"], st["inside"] = 0, False

            stage = STAGE_ORDER[st["idx"]]
            eid   = None if stage in EXTERNAL_STAGES else elevator_id

            if not st["inside"]:
                publish_event(client, prism_code, stage, "enter", eid)
                st["inside"] = True
            else:
                publish_event(client, prism_code, stage, "exit", eid)
                st["inside"] = False
                st["idx"] += 1
    except KeyboardInterrupt:
        print("\nEncerrando...")
    finally:
        ser.close()
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
