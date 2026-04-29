# Contrato MQTT

## Broker
- Software: Mosquitto
- Host: localhost (fase de simulação)
- Porta: 1883

## Formato de Tópico
Tópico unificado — o `elevator_id` fica no payload, não na URL, pois etapas externas (`waiting`, `outflow`) não têm elevador.

```
autostep/prisma/{prism_code}/{event_type}
```

Exemplos:
```
autostep/prisma/PRISMA_03/enter
autostep/prisma/PRISMA_01/exit
```

## Payload JSON

### Etapas externas — `waiting` e `outflow` (sem elevador)
```json
{
  "stage": "waiting",
  "timestamp": "2026-04-29T14:00:00Z",
  "prism_code": "PRISMA_03",
  "elevator_id": null
}
```

### Etapas de elevador — `transit`, `lift_up`, `service`, `lift_down`
```json
{
  "stage": "lift_up",
  "timestamp": "2026-04-29T14:32:00Z",
  "prism_code": "PRISMA_03",
  "elevator_id": 1
}
```

## Regras do Contrato
- `timestamp` sempre em formato ISO 8601 UTC (com `Z` no final)
- `stage` deve ser um dos valores do Enum de Stage definido em `data-model.md`
- `elevator_id` é **obrigatório** (não nulo) para: `transit`, `lift_up`, `service`, `lift_down`
- `elevator_id` é **null** para: `waiting`, `outflow`
- O backend subscreve o tópico wildcard: `autostep/#`
- O simulador publica com QoS 1 (pelo menos uma entrega)
- Quando o hardware ESP32 for instalado, apenas a origem da publicação muda — o payload permanece idêntico

## Tópico de Status do Simulador
```
autostep/simulator/status
```
Payload: `{"running": true, "prism_code": "PRISMA_03", "current_stage": "transit"}`
