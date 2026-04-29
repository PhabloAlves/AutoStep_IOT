# Fluxo do Veículo na Oficina

## Jornada Completa

```
[CHEGADA EXTERNA] → Espera (lado de fora) → Trânsito até elevador → Subida + Inspeção → Serviço → Descida → Espera Externa (entrega)
```

Cada seta representa uma transição de etapa — o momento em que o sistema registra um `exited_at` na etapa anterior e um `entered_at` na próxima.

**Importante:** O prisma fica sobre o veículo durante todo o ciclo, inclusive na espera de entrega. Só é retirado quando o cliente busca o carro.

---

## Etapas Detalhadas

### 1. `waiting` — Espera Externa (lado de fora)
- **Localização:** Área externa da oficina
- **O que acontece:** O veículo chega, a OS é aberta e o prisma numerado é colocado sobre o carro do lado de fora. O carro aguarda ser chamado para o elevador.
- **Início:** Prisma colocado no veículo + OS vinculada → evento MQTT `enter/waiting`
- **Fim:** Carro é chamado e inicia o trajeto até o elevador → evento MQTT `exit/waiting`
- **Gargalo comum:** Espera longa do lado de fora. Alerta se `duration_sec` > média histórica de `waiting`
- **Tabelas envolvidas:** `service_orders` (criada), `prisms` (vinculado à OS, `is_active = True`), `stage_events` (stage=waiting)

---

### 2. `transit` — Deslocamento até o Elevador
- **Localização:** Trajeto externo → interior da oficina
- **O que acontece:** O veículo percorre ~4-5 metros da área externa até se posicionar sobre o elevador.
- **Início:** Carro sai da espera externa → evento MQTT `enter/transit`
- **Fim:** Veículo posicionado sobre o elevador → evento MQTT `exit/transit`
- **Nota:** Etapa curta (segundos a poucos minutos). Serve para rastrear disponibilidade do elevador.
- **Tabelas envolvidas:** `stage_events` (stage=transit, `elevator_id` obrigatório)

---

### 3. `lift_up` — Subida do Elevador + Inspeção
- **Localização:** Sobre o elevador
- **O que acontece:** O elevador sobe com o veículo. Assim que atinge a posição de trabalho, o mecânico faz a **inspeção/verificação** do carro antes de iniciar o serviço. Esta etapa engloba subida + checagem.
- **Início:** Elevador começa a subir → evento MQTT `enter/lift_up`
- **Fim:** Inspeção concluída, serviço prestes a começar → evento MQTT `exit/lift_up`
- **Tabelas envolvidas:** `stage_events` (stage=lift_up, `elevator_id` obrigatório)

---

### 4. `service` — Realização do Serviço
- **Localização:** Carro elevado
- **O que acontece:** O mecânico executa a manutenção propriamente dita. É a etapa de maior duração esperada.
- **Início:** Inspeção aprovada, serviço começa → evento MQTT `enter/service`
- **Fim:** Serviço concluído, mecânico aciona a descida → evento MQTT `exit/service`
- **Cruzamento com OS:** O `service_type` da `service_orders` descreve o que foi feito nesta etapa
- **Gargalo comum:** Serviço mais longo que o previsto para o tipo de manutenção
- **Tabelas envolvidas:** `stage_events` (stage=service), `service_orders` (consultada para contexto)

---

### 5. `lift_down` — Descida do Elevador
- **Localização:** Sobre o elevador
- **O que acontece:** O elevador desce após a conclusão do serviço. Detectado pelo sensor magnético no hardware real.
- **Início:** Elevador começa a descer → evento MQTT `enter/lift_down`
- **Fim:** Elevador no nível do piso, carro pode sair → evento MQTT `exit/lift_down`
- **Tabelas envolvidas:** `stage_events` (stage=lift_down, `elevator_id` obrigatório)

---

### 6. `outflow` — Área Externa (aguardando entrega)
- **Localização:** Área externa da oficina
- **O que acontece:** O veículo retorna para o lado de fora e aguarda o cliente. **O prisma permanece sobre o carro** durante toda esta espera. O prisma só é retirado e marcado como inativo quando o cliente busca o veículo.
- **Início:** Carro sai do elevador e vai para fora → evento MQTT `enter/outflow`
- **Fim:** Cliente busca o carro, prisma retirado → evento MQTT `exit/outflow`
- **Encerramento:** Ao registrar `exit/outflow`, o sistema marca `prisms.is_active = False` e libera o prisma para o próximo veículo
- **Gargalo possível:** Carro pronto mas cliente demora a buscar — não é gargalo da oficina, mas pode ser monitorado
- **Tabelas envolvidas:** `stage_events` (stage=outflow), `prisms` (`is_active → False` apenas no `exit/outflow`)

---

## Como as Tabelas se Conectam

```
service_orders          prisms                  stage_events
──────────────          ──────                  ────────────
id ◄──────────────────  os_id (FK)              id
os_number               id ◄──────────────────  prism_id (FK)
plate                   prism_code              elevator_id
service_type            is_active               stage
mechanic                                        entered_at
opened_at                                       exited_at
created_at                                      duration_sec
```

## Ciclo de Vida do Prisma

```
Prisma físico livre (lado de fora)
    │ OS aberta + prisma colocado sobre o carro
    ▼
prisms.is_active = True
    │
    ▼
waiting → transit → lift_up → service → lift_down → outflow
                                                        │
                                         prisma continua no carro
                                         enquanto aguarda cliente
                                                        │ cliente busca o carro
                                                        ▼
prisms.is_active = False  ──→  Prisma físico disponível para próximo veículo
```

**Regra importante:** `is_active = False` só ocorre no `exit/outflow` — não na entrada da área externa.

## Invariantes que o Backend deve garantir
- Um prisma não pode ter duas etapas abertas simultaneamente (dois `entered_at` sem `exited_at`)
- A sequência de `stage` deve respeitar a ordem: waiting → transit → lift_up → service → lift_down → outflow
- `elevator_id` é obrigatório a partir da etapa `transit` — não existe trânsito sem destino definido
- O prisma permanece ativo (`is_active = True`) durante toda a etapa `outflow` até o `exit/outflow`
