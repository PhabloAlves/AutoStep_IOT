#!/bin/sh
set -e
mosquitto_passwd -b -c /mosquitto/config/passwd "$MQTT_USER" "$MQTT_PASSWORD"
chown mosquitto:mosquitto /mosquitto/config/passwd
chmod 0700 /mosquitto/config/passwd
exec mosquitto -c /mosquitto/config/mosquitto.conf
