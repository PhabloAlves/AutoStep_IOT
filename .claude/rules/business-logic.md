# Regras de Negócio da Oficina

## Veículo e Prisma
- **Vínculo de Prisma:** Um ID de Prisma é único e só pode estar associado a uma Ordem de Serviço (OS) ativa por vez
- **Identificação atual:** Simulada via script Python — o prisma físico (NFC/QR) será introduzido na fase de hardware

## Etapas e Timestamps
- **Registro de Timestamps:** Cada transição de etapa deve registrar o horário exato de entrada e saída (`entered_at`, `exited_at`)
- **Cálculo de Duração:** `duration = exited_at - entered_at` para cada etapa
- **Ordem obrigatória:** Espera → Deslocamento → Subida Elevador → Realização do Serviço → Descida Elevador → Área Externa
- Um veículo não pode pular etapas — validar a sequência no backend ao receber eventos MQTT

## Elevadores
- A oficina piloto tem **2 elevadores** — sempre usar `elevator_id` nas tabelas e no payload MQTT
- `elevator_id` é obrigatório para etapas de elevador (`transit`, `lift_up`, `service`, `lift_down`) e NULL para etapas externas (`waiting`, `outflow`)
- Tópico MQTT: `autostep/prisma/{prism_code}/{event_type}` — o `elevator_id` vai no payload, não na URL

## Ordem de Serviço (OS)
- A OS chega como **PDF gerado digitalmente** via `POST /os/upload`
- Usar `pdfplumber` para extrair os dados — não usar OCR (o PDF tem texto selecionável)
- Após o upload, o backend vincula a OS ao prisma correspondente pelo número da OS ou placa

## Gargalos
- O sistema deve sinalizar se um veículo exceder o tempo médio previsto por etapa
- O dashboard exibe métricas agregadas (tempo médio, total do dia) — sem tempo real no MVP
- Gargalo = tempo da etapa > média histórica daquela etapa (calcular no endpoint de métricas)

## Ambiente Piloto
- 2 elevadores, ~5 veículos simultâneos no fluxo
- SQLite como banco de dados — não usar PostgreSQL no MVP
- Autenticação JWT com usuário único (gestor) — sem sistema de múltiplos perfis
