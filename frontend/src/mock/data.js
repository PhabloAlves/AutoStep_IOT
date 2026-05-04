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

export const mockVolumeByDay = [
  { date: '28/04', count: 6 },
  { date: '29/04', count: 8 },
  { date: '30/04', count: 5 },
  { date: '01/05', count: 7 },
  { date: '02/05', count: 9 },
  { date: '03/05', count: 4 },
  { date: '04/05', count: 3 },
]

export const mockServiceTypeStats = [
  { service_type: 'Revisão Completa',          avg_total_sec: 8400, avg_service_sec: 3600, count: 12 },
  { service_type: 'Troca de Freios',           avg_total_sec: 6300, avg_service_sec: 2700, count: 8  },
  { service_type: 'Suspensão',                 avg_total_sec: 7200, avg_service_sec: 3200, count: 5  },
  { service_type: 'Alinhamento/Balanceamento', avg_total_sec: 4800, avg_service_sec: 1800, count: 14 },
  { service_type: 'Troca de Pneus',            avg_total_sec: 3600, avg_service_sec: 1200, count: 10 },
]

export const mockPeakHours = [
  { hour: '07h', count: 1 },
  { hour: '08h', count: 3 },
  { hour: '09h', count: 5 },
  { hour: '10h', count: 4 },
  { hour: '11h', count: 2 },
  { hour: '12h', count: 1 },
  { hour: '13h', count: 0 },
  { hour: '14h', count: 3 },
  { hour: '15h', count: 4 },
  { hour: '16h', count: 2 },
  { hour: '17h', count: 1 },
]

export const mockPunctualityStats = [
  { service_type: 'Revisão Completa',          on_time: 7,  total: 12 },
  { service_type: 'Troca de Freios',           on_time: 6,  total: 8  },
  { service_type: 'Suspensão',                 on_time: 3,  total: 5  },
  { service_type: 'Alinhamento/Balanceamento', on_time: 13, total: 14 },
  { service_type: 'Troca de Pneus',            on_time: 9,  total: 10 },
]

export const mockOutflowWait = [
  { date: '28/04', avg_min: 45 },
  { date: '29/04', avg_min: 62 },
  { date: '30/04', avg_min: 38 },
  { date: '01/05', avg_min: 55 },
  { date: '02/05', avg_min: 71 },
  { date: '03/05', avg_min: 40 },
  { date: '04/05', avg_min: 28 },
]
