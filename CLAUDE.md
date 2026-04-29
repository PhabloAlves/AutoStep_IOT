# AutoStep - Rastreamento IoT para Oficina Mecânica

## Visão Geral do Projeto
Sistema IoT para rastrear as etapas de veículos em uma oficina mecânica real usando ESP32 e identificação por NFC ou QR Code. A fase atual é de **simulação**: o hardware real (ESP32/NFC) ainda não está em uso — um script Python envia os eventos MQTT no lugar dos sensores físicos.

## Stack Técnica
- **Backend:** FastAPI (Python)
- **Frontend:** React
- **Comunicação IoT:** MQTT (Mosquitto)
- **Banco de Dados:** SQLite (via SQLAlchemy) — migrar para PostgreSQL quando escalar
- **ORM:** SQLAlchemy
- **Parse de PDF:** pdfplumber
- **Autenticação:** JWT (usuário único: gestor)
- **Hardware (fase futura):** ESP32 com leitor NFC RC522 ou ESP32-CAM

## Decisões de Arquitetura

### Integração com Ordem de Serviço (OS)
- A OS é um **arquivo PDF gerado digitalmente** (texto selecionável, não escaneado)
- O backend expõe `POST /os/upload` que recebe o PDF, extrai os dados com `pdfplumber` e salva no banco
- Campos esperados da OS: número da OS, placa do veículo, tipo de serviço, mecânico, data de abertura

### Banco de Dados
- **SQLite** para o piloto — arquivo local, zero configuração
- Já modelar suporte a **múltiplos elevadores** desde o início (`elevator_id` em todas as tabelas relevantes)
- A oficina piloto tem **2 elevadores**

### Dashboard
- Foco em **histórico e métricas agregadas**: tempo médio por etapa, gargalos do dia
- Sem tempo real (sem WebSocket) — REST puro
- Alertas quando o tempo de uma etapa excede a média esperada

### Autenticação
- Login simples com JWT
- Um único usuário gestor (sem múltiplos perfis no MVP)

### Simulador
- Script Python que simula **um veículo por vez**, do início ao fim do fluxo
- Delays configuráveis por etapa via arquivo de configuração
- Publica eventos MQTT idênticos ao que o ESP32 físico publicaria
- Quando o hardware real for instalado, apenas a origem da mensagem muda — o backend não precisa ser alterado

### Implantação
- Não definido — pode ser local (notebook/PC da oficina) ou nuvem (VPS)

## Fluxo de Trabalho do Veículo
```
Espera (fora) -> Deslocamento -> Subida + Inspeção -> Serviço -> Descida -> Entrega (fora, prisma no carro)
```
- Etapas externas (`waiting`, `outflow`): `elevator_id = null`
- Etapas de elevador (`transit`, `lift_up`, `service`, `lift_down`): `elevator_id` obrigatório
- `lift_up` engloba subida + inspeção do veículo (não são etapas separadas)
- O prisma fica no carro até o cliente buscar — só então `is_active = False`

## Estrutura de Pastas (esperada)
```
autostep/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── models.py        # SQLAlchemy models
│   ├── routes/
│   │   ├── os.py        # Upload e parse de PDF
│   │   ├── events.py    # Receber eventos MQTT -> banco
│   │   └── metrics.py   # Endpoints do dashboard
│   └── mqtt_client.py   # Subscriber MQTT
├── simulator/
│   ├── sensor_sim.py    # Simulador principal
│   └── config.json      # Delays por etapa
├── frontend/            # React
└── docker-compose.yml   # Mosquitto + backend

```

## Comandos Úteis
- Build do ambiente: `make build`
- Rodar Simulador: `python simulator/sensor_sim.py`
- Rodar Backend: `uvicorn backend.main:app --reload`
