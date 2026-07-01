# AutoStep

Sistema de rastreamento de veículos por etapas via MQTT, com dashboard de métricas.
Fase atual: simulação (sem hardware físico — um script Python publica os eventos MQTT).

## Stack

- Backend: FastAPI + SQLAlchemy + SQLite (`backend/`)
- Frontend: React + Vite + Tailwind + Recharts (`frontend/`)
- Broker MQTT: Mosquitto (`mosquitto/`)
- Simulador: scripts Python que publicam eventos MQTT (`simulator/`)

## Rodando com Docker (recomendado)

Requer Docker Desktop.

1. Crie um arquivo `.env` na raiz com:

   ```
   MQTT_USER=autostep
   MQTT_PASSWORD=<senha do broker>
   AUTOSTEP_SECRET_KEY=<chave secreta para JWT>
   AUTOSTEP_ADMIN_USER=admin
   AUTOSTEP_ADMIN_PASSWORD=<senha do usuário gestor>
   ```

2. Suba os containers:

   ```
   docker compose up -d --build
   ```

3. Acesse:
   - Frontend: http://localhost:5173
   - Backend / Swagger: http://localhost:8000/docs

O usuário gestor (`AUTOSTEP_ADMIN_USER`/`AUTOSTEP_ADMIN_PASSWORD`) é criado automaticamente no primeiro start.

## Rodando sem Docker

```
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

```
cd frontend
npm install
npm run dev
```

Um broker MQTT (Mosquitto) precisa estar acessível em `MQTT_HOST:MQTT_PORT` (padrão `localhost:1883`).

## Gerando eventos (simulação)

Sem hardware físico ainda — três formas de gerar eventos MQTT:

- `python simulator/sensor_sim.py` — percorre todos os prismas configurados em `simulator/config.json` automaticamente, com delays aleatórios por etapa.
- `python simulator/rfid_bridge.py` — ponte serial para um leitor RFID físico (Arduino + PN532); cada leitura de cartão avança o veículo uma etapa. Config em `simulator/rfid_config.json`.
- Página `/simular` no frontend — controle manual (ENTRAR/SAIR) por um veículo por vez, pensada para uso no celular.

## Arquitetura de arquivos

```
backend/
  main.py            FastAPI app, seed inicial (admin + prismas), startup do subscriber MQTT
  models.py           Modelos SQLAlchemy: ServiceOrder, Prism, StageEvent, User
  database.py          Engine SQLite + sessão
  auth.py               JWT: hash/verificação de senha, criação/validação de token
  limiter.py             Rate limiting (slowapi)
  mqtt_client.py          Subscriber MQTT: grava StageEvent no banco a partir dos eventos publicados
  utils.py                 Serialização de datas em UTC + conversão para o fuso da oficina (UTC-3)
  routes/
    auth.py               POST /auth/login
    os.py                 CRUD de Ordens de Serviço + vínculo com prisma
    events.py             Registro/listagem de eventos de etapa (via HTTP, alternativa ao MQTT)
    metrics.py            Métricas agregadas: diário, gargalos, volume, tipo de serviço, pico, pontualidade
    prisms.py             Prismas disponíveis/ativos, status/etapa atual de um prisma

frontend/src/
  App.jsx              Rotas (react-router)
  api.js                Client HTTP para o backend
  sound.js               Sons de feedback (Web Audio API) ao trocar de etapa
  pages/
    Login.jsx
    Overview.jsx          Visão geral: métricas do dia + gráfico por etapa
    Analise.jsx            Análise: volume, tipo de serviço, pico, pontualidade
    Bottlenecks.jsx          Gargalos detectados
    History.jsx               Histórico de eventos + sessões em andamento (tempo real via polling)
    ServiceOrders.jsx          Cadastro/listagem de Ordens de Serviço
    Simular.jsx                 Controle manual de simulação (mobile)
  components/           Modais, sidebar, filtros de data, cards de estatística

simulator/
  sensor_sim.py        Simulador automático (percorre todos os prismas)
  rfid_bridge.py         Ponte serial RFID -> MQTT (hardware real)
  config.json / rfid_config.json    Configuração de delays e mapeamento de cartões

mosquitto/             Configuração do broker MQTT (Mosquitto)
docker-compose.yml      Serviços: mosquitto, backend, frontend
docker-compose.override.yml   Overrides de desenvolvimento (hot-reload, porta do broker exposta)
```

## Fluxo do veículo

Cada veículo passa por 6 etapas, publicadas como eventos MQTT (`enter`/`exit`) e persistidas como `StageEvent`:

```
waiting -> transit -> lift_up -> service -> lift_down -> outflow
```

`elevator_id` é obrigatório nas etapas de elevador (`transit`, `lift_up`, `service`, `lift_down`) e `null` nas etapas externas (`waiting`, `outflow`).
