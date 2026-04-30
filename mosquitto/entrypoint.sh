#!/bin/sh
set -e
mosquitto_passwd -b -c /mosquitto/config/passwd "$MQTT_USER" "$MQTT_PASSWORD"
exec mosquitto -c /mosquitto/config/mosquitto.conf
