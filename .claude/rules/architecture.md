# Decisões de Arquitetura

## Fase Atual: Simulação
O projeto está em fase de simulação. Nenhum hardware físico (ESP32, NFC, reed switch) está em uso ainda.
O simulador (`simulator/sensor_sim.py`) publica eventos MQTT idênticos ao hardware real — quando o hardware for instalado, o backend não muda.

## O que NÃO fazer
- Não usar WebSocket — o dashboard é histórico/agregado, REST puro é suficiente
- Não usar PostgreSQL — SQLite é a escolha para o piloto
- Não implementar múltiplos perfis de usuário — apenas o gestor com JWT
- Não adicionar OCR — o PDF da OS é digital (texto selecionável), usar `pdfplumber`
- Não hardcodar `elevator_id = 1` — sempre parametrizar, a oficina tem 2 elevadores

## Tópicos MQTT
Formato: `autostep/prisma/{prism_code}/{event_type}` onde `event_type` é `enter` ou `exit`
Payload JSON: `{"stage": "...", "timestamp": "ISO8601", "prism_code": "PRISMA_XX", "elevator_id": 1|2|null}`
- `elevator_id` é null para etapas externas (`waiting`, `outflow`), obrigatório para as demais
- Ver contrato completo em `rules/mqtt-schema.md`

## Endpoints FastAPI esperados
- `POST /auth/login` — retorna JWT
- `POST /os/upload` — recebe PDF, extrai dados com pdfplumber, salva OS no banco
- `POST /events` — recebe evento de etapa (também via MQTT subscriber interno)
- `GET /metrics/daily` — resumo do dia: tempo médio por etapa, contagem de veículos
- `GET /metrics/bottlenecks` — etapas com tempo acima da média
- `GET /vehicles/{prisma_id}/history` — histórico de etapas de um veículo

## Simulador
- Arquivo: `simulator/sensor_sim.py`
- Config: `simulator/config.json` (delays mínimo/máximo por etapa em segundos)
- Simula um veículo por vez, ciclo completo do fluxo
- Publica via paho-mqtt no broker Mosquitto local
