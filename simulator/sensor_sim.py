import json
import random
import time
from datetime import datetime, timezone
from pathlib import Path

import paho.mqtt.client as mqtt

CONFIG_PATH = Path(__file__).parent / "config.json"
EXTERNAL_STAGES = {"waiting", "outflow"}


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return json.load(f)


def publish_event(client: mqtt.Client, prism_code: str, stage: str, event_type: str, elevator_id=None):
    topic = f"autostep/prisma/{prism_code}/{event_type}"
    payload = {
        "stage":       stage,
        "timestamp":   datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "prism_code":  prism_code,
        "elevator_id": elevator_id,
    }
    client.publish(topic, json.dumps(payload), qos=1)
    label = f"elevador {elevator_id}" if elevator_id else "externo"
    print(f"  [{event_type.upper()}] {stage} ({label})")


def simulate_vehicle(client: mqtt.Client, prism_code: str, elevator_id: int, config: dict):
    stages_config = config["stages"]
    stages = ("waiting", "transit", "lift_up", "service", "lift_down", "outflow")

    for stage in stages:
        eid   = None if stage in EXTERNAL_STAGES else elevator_id
        delay = random.randint(stages_config[stage]["min"], stages_config[stage]["max"])

        publish_event(client, prism_code, stage, "enter", eid)
        time.sleep(delay)
        publish_event(client, prism_code, stage, "exit", eid)


def main():
    config = load_config()
    broker = config["broker"]

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(broker["host"], broker["port"])
    client.loop_start()

    for i, prism_code in enumerate(config["prisms"]):
        elevator_id = (i % 2) + 1
        print(f"\n=== {prism_code} | Elevador {elevator_id} ===")
        simulate_vehicle(client, prism_code, elevator_id, config)
        print(f"=== {prism_code} concluído ===")

    client.loop_stop()
    client.disconnect()


if __name__ == "__main__":
    main()
