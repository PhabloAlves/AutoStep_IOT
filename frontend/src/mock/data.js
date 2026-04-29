export const STAGE_LABELS = {
  waiting:   'Espera',
  transit:   'Deslocamento',
  lift_up:   'Inspeção',
  service:   'Serviço',
  lift_down: 'Descida',
  outflow:   'Entrega',
}

export const mockDailyMetrics = [
  { stage: 'waiting',   avg_duration_sec: 2340, count: 8 },
  { stage: 'transit',   avg_duration_sec: 180,  count: 8 },
  { stage: 'lift_up',   avg_duration_sec: 540,  count: 8 },
  { stage: 'service',   avg_duration_sec: 3120, count: 8 },
  { stage: 'lift_down', avg_duration_sec: 210,  count: 8 },
  { stage: 'outflow',   avg_duration_sec: 1860, count: 8 },
]

export const mockBottlenecks = [
  {
    stage: 'waiting',
    today_avg_sec: 2340,
    historical_avg_sec: 1500,
    excess_pct: 56,
  },
  {
    stage: 'service',
    today_avg_sec: 3120,
    historical_avg_sec: 2400,
    excess_pct: 30,
  },
]

export const mockHistory = [
  { prism_code: 'PRISMA_01', stage: 'service',   elevator_id: 1, entered_at: '2026-04-29T08:10:00Z', exited_at: '2026-04-29T09:02:00Z', duration_sec: 3120 },
  { prism_code: 'PRISMA_01', stage: 'lift_up',   elevator_id: 1, entered_at: '2026-04-29T08:02:00Z', exited_at: '2026-04-29T08:10:00Z', duration_sec: 480  },
  { prism_code: 'PRISMA_01', stage: 'transit',   elevator_id: 1, entered_at: '2026-04-29T07:59:00Z', exited_at: '2026-04-29T08:02:00Z', duration_sec: 180  },
  { prism_code: 'PRISMA_01', stage: 'waiting',   elevator_id: null, entered_at: '2026-04-29T07:20:00Z', exited_at: '2026-04-29T07:59:00Z', duration_sec: 2340 },
  { prism_code: 'PRISMA_02', stage: 'outflow',   elevator_id: null, entered_at: '2026-04-29T10:45:00Z', exited_at: null, duration_sec: null },
  { prism_code: 'PRISMA_02', stage: 'lift_down', elevator_id: 2, entered_at: '2026-04-29T10:40:00Z', exited_at: '2026-04-29T10:45:00Z', duration_sec: 300  },
  { prism_code: 'PRISMA_03', stage: 'waiting',   elevator_id: null, entered_at: '2026-04-29T11:00:00Z', exited_at: null, duration_sec: null },
]

export const mockOrders = [
  { id: 1, os_number: 'OS-2042', plate: 'ABC-1234', service_type: 'Revisão completa',         mechanic: 'Carlos Silva',  opened_at: '2026-04-29T07:00:00Z', prism_code: 'PRISMA_01' },
  { id: 2, os_number: 'OS-2043', plate: 'DEF-5678', service_type: 'Troca de pneus',           mechanic: 'Ricardo Souza', opened_at: '2026-04-29T08:30:00Z', prism_code: 'PRISMA_02' },
  { id: 3, os_number: 'OS-2044', plate: 'GHI-9012', service_type: 'Alinhamento/Balanceamento', mechanic: 'Marcos Lima',   opened_at: '2026-04-29T09:15:00Z', prism_code: null },
  { id: 4, os_number: 'OS-2045', plate: 'JKL-3456', service_type: 'Suspensão',                mechanic: 'Carlos Silva',  opened_at: '2026-04-29T10:00:00Z', prism_code: null },
  { id: 5, os_number: 'OS-2046', plate: 'MNO-7890', service_type: 'Troca de freios',          mechanic: 'Ricardo Souza', opened_at: '2026-04-29T11:00:00Z', prism_code: null },
]

export const mockActivePrisms = [
  { prism_code: 'PRISMA_03', waiting_since: '2026-04-29T11:00:00Z' },
  { prism_code: 'PRISMA_04', waiting_since: '2026-04-29T11:32:00Z' },
  { prism_code: 'PRISMA_05', waiting_since: '2026-04-29T12:05:00Z' },
]
