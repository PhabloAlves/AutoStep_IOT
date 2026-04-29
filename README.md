# AutoStep

Sistema IoT para rastreamento de veículos em oficinas mecânicas. Monitora automaticamente o tempo que cada veículo passa em cada etapa do processo — da espera externa até a entrega — gerando métricas acionáveis para o gestor identificar gargalos.

---

## Fluxo do Veículo

```
Espera (fora) → Deslocamento → Subida + Inspeção → Serviço → Descida → Entrega (fora)
```

Cada transição é capturada via MQTT (hardware ESP32 na fase real, script Python na fase de simulação).

---

## Stack

| Camada      | Tecnologia                        |
|-------------|-----------------------------------|
| Backend     | FastAPI + SQLAlchemy + SQLite     |
| Frontend    | React + Vite + Tailwind + Recharts|
| IoT / Broker| MQTT (Mosquitto)                  |
| Simulador   | Python + paho-mqtt                |
| Auth        | JWT (usuário único: gestor)       |
| PDF Parser  | pdfplumber                        |

---

## Estrutura do Projeto

```
autostep/
├── backend/
│   ├── main.py            # FastAPI app
│   ├── models.py          # SQLAlchemy: ServiceOrder, Prism, StageEvent, User
│   ├── database.py        # SQLite + sessão
│   ├── auth.py            # JWT + bcrypt
│   ├── mqtt_client.py     # Subscriber MQTT → banco
│   └── routes/
│       ├── auth.py        # POST /auth/login
│       ├── os_routes.py   # POST /os/upload (pdfplumber)
│       ├── events.py      # POST /events
│       └── metrics.py     # GET /metrics/daily, /bottlenecks, /vehicles/:code/history
├── simulator/
│   ├── sensor_sim.py      # Simula um veículo por vez, ciclo completo
│   └── config.json        # Delays min/max por etapa (segundos)
├── frontend/
│   └── src/
│       ├── pages/         # Overview, Bottlenecks, History, ServiceOrders
│       ├── components/    # Sidebar, StatCard, DateFilter, LinkPrismModal
│       └── mock/data.js   # Dados de exemplo (fase visual)
├── mosquitto/
│   └── mosquitto.conf
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

---

## Como Rodar

### Pré-requisitos

- Docker Desktop (para Mosquitto)
- Python 3.12+
- Node.js 20+

### 1. Subir o broker MQTT

```bash
docker compose up mosquitto
```

### 2. Backend

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

API disponível em `http://localhost:8000`  
Documentação automática em `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard disponível em `http://localhost:5173`

### 4. Simulador

```bash
python simulator/sensor_sim.py
```

Simula 5 veículos sequencialmente, publicando eventos MQTT idênticos ao hardware real.

### Tudo via Docker

```bash
docker compose up --build
```

---

## Tópicos MQTT

```
autostep/prisma/{prism_code}/enter
autostep/prisma/{prism_code}/exit
```

**Payload:**
```json
{
  "stage": "waiting",
  "timestamp": "2026-04-29T14:32:00Z",
  "prism_code": "PRISMA_03",
  "elevator_id": null
}
```

> `elevator_id` é `null` para etapas externas (`waiting`, `outflow`) e obrigatório para etapas no elevador (`transit`, `lift_up`, `service`, `lift_down`).

---

## Endpoints da API

| Método | Rota                                    | Descrição                        |
|--------|-----------------------------------------|----------------------------------|
| POST   | `/auth/login`                           | Login, retorna JWT               |
| POST   | `/os/upload`                            | Importar OS via PDF              |
| GET    | `/os/`                                  | Listar ordens de serviço         |
| POST   | `/events/`                              | Registrar evento de etapa        |
| GET    | `/metrics/daily`                        | Métricas agregadas do dia        |
| GET    | `/metrics/bottlenecks`                  | Etapas acima da média histórica  |
| GET    | `/metrics/vehicles/{prism_code}/history`| Histórico de um veículo          |

---

## Dashboard

| Página              | Conteúdo                                                     |
|---------------------|--------------------------------------------------------------|
| Visão Geral         | Cards de métricas + gráfico de barras por etapa + filtro de período |
| Gargalos            | Alertas de etapas acima da média + comparativo hoje vs histórico |
| Histórico           | Tabela completa de eventos por veículo                       |
| Ordens de Serviço   | Upload de PDF + vínculo de prisma por OS                     |

---

## Fase Atual

O projeto está em **fase de simulação**. O simulador (`simulator/sensor_sim.py`) publica eventos MQTT idênticos ao hardware físico. Quando o ESP32 + NFC forem instalados, apenas a origem da mensagem muda — o backend não precisa ser alterado.

---

## Ambiente Piloto

- **Oficina:** GrandPneus — Poços de Caldas, MG
- **Elevadores:** 2
- **Veículos simultâneos:** ~5
