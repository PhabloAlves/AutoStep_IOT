export const STAGE_LABELS = {
  waiting:   'Espera',
  transit:   'Deslocamento',
  lift_up:   'Inspeção',
  service:   'Serviço',
  lift_down: 'Descida',
  outflow:   'Entrega',
}

export const mockDailyMetrics = [
  { stage: 'waiting',   avg_duration_sec: 2340, count: 1 },
  { stage: 'transit',   avg_duration_sec: 180,  count: 1 },
  { stage: 'lift_up',   avg_duration_sec: 480,  count: 1 },
  { stage: 'service',   avg_duration_sec: 3600, count: 1 },
  { stage: 'lift_down', avg_duration_sec: 420,  count: 1 },
  { stage: 'outflow',   avg_duration_sec: 5700, count: 1 },
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
  { prism_code: 'PRISMA_01', stage: 'outflow',   elevator_id: null, entered_at: '2026-04-29T09:17:00Z', exited_at: '2026-04-29T10:52:00Z', duration_sec: 5700 },
  { prism_code: 'PRISMA_01', stage: 'lift_down', elevator_id: 1,    entered_at: '2026-04-29T09:10:00Z', exited_at: '2026-04-29T09:17:00Z', duration_sec: 420  },
  { prism_code: 'PRISMA_01', stage: 'service',   elevator_id: 1,    entered_at: '2026-04-29T08:10:00Z', exited_at: '2026-04-29T09:10:00Z', duration_sec: 3600 },
  { prism_code: 'PRISMA_01', stage: 'lift_up',   elevator_id: 1,    entered_at: '2026-04-29T08:02:00Z', exited_at: '2026-04-29T08:10:00Z', duration_sec: 480  },
  { prism_code: 'PRISMA_01', stage: 'transit',   elevator_id: 1,    entered_at: '2026-04-29T07:59:00Z', exited_at: '2026-04-29T08:02:00Z', duration_sec: 180  },
  { prism_code: 'PRISMA_01', stage: 'waiting',   elevator_id: null, entered_at: '2026-04-29T07:20:00Z', exited_at: '2026-04-29T07:59:00Z', duration_sec: 2340 },
]

export const mockOrders = [
  { id: 1, os_number: 'OS-2042', plate: 'ABC-1234', service_type: 'Revisão completa', mechanic: 'Carlos Silva', opened_at: '2026-04-29T07:00:00Z', prism_code: 'PRISMA_01' },
]

export const mockActivePrisms = [
  { prism_code: 'PRISMA_01', waiting_since: '2026-04-29T13:30:00Z' },
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
