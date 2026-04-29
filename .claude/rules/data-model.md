# Modelo de Dados (SQLite + SQLAlchemy)

## Tabelas e Campos

### `service_orders` (Ordens de Serviço)
| Campo         | Tipo         | Notas                              |
|---------------|--------------|------------------------------------|
| id            | INTEGER PK   | Auto-incremento                    |
| os_number     | TEXT UNIQUE  | Número da OS extraído do PDF       |
| plate         | TEXT         | Placa do veículo                   |
| service_type  | TEXT         | Tipo de manutenção                 |
| mechanic      | TEXT         | Nome do mecânico responsável       |
| opened_at     | DATETIME     | Data de abertura extraída do PDF   |
| created_at    | DATETIME     | Quando foi feito o upload no sistema |

### `prisms` (Prismas)
| Campo         | Tipo         | Notas                              |
|---------------|--------------|------------------------------------|
| id            | INTEGER PK   |                                    |
| prism_code    | TEXT UNIQUE  | Ex: "PRISMA_01", "PRISMA_05"       |
| os_id         | INTEGER FK   | FK → service_orders.id (nullable)  |
| is_active     | BOOLEAN      | True se vinculado a uma OS ativa   |

### `stage_events` (Eventos de Etapa)
| Campo         | Tipo         | Notas                                          |
|---------------|--------------|------------------------------------------------|
| id            | INTEGER PK   |                                                |
| prism_id      | INTEGER FK   | FK → prisms.id                                 |
| elevator_id   | INTEGER      | 1 ou 2 — **nullable**: NULL para `waiting` e `outflow` (etapas externas sem elevador) |
| stage         | TEXT         | Enum: waiting, transit, lift_up, service, lift_down, outflow |
| entered_at    | DATETIME     | Timestamp de entrada na etapa                  |
| exited_at     | DATETIME     | Timestamp de saída (NULL enquanto na etapa)    |
| duration_sec  | INTEGER      | Calculado: exited_at - entered_at em segundos  |

### `users` (Autenticação)
| Campo         | Tipo         | Notas                              |
|---------------|--------------|------------------------------------|
| id            | INTEGER PK   |                                    |
| username      | TEXT UNIQUE  |                                    |
| password_hash | TEXT         | bcrypt                             |

## Regras do Schema
- Nunca usar `id` como nome de campo de negócio — usar nomes descritivos (`os_number`, `prism_code`)
- `elevator_id` é **obrigatório** nas etapas de elevador (`transit`, `lift_up`, `service`, `lift_down`) e **NULL** nas etapas externas (`waiting`, `outflow`)
- `duration_sec` é calculado e persistido no momento do `exited_at` (não calcular on-the-fly)
- Datas sempre em UTC, armazenadas como ISO8601 no SQLite

## Enum de Stages (ordem obrigatória)
```python
class Stage(str, Enum):
    WAITING   = "waiting"
    TRANSIT   = "transit"
    LIFT_UP   = "lift_up"
    SERVICE   = "service"
    LIFT_DOWN = "lift_down"
    OUTFLOW   = "outflow"
```
