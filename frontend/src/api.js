const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('autostep_token')
}

async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('autostep_token')
    window.location.href = '/login'
    return null
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login(username, password) {
    const body = new URLSearchParams({ username, password })
    return fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    })
  },

  logout() {
    localStorage.removeItem('autostep_token')
    window.location.href = '/login'
  },

  // ── Métricas existentes ───────────────────────────────────────────────────
  dailyMetrics(targetDate) {
    const qs = targetDate ? `?target_date=${targetDate}` : ''
    return apiFetch(`/metrics/daily${qs}`)
  },

  bottlenecks() {
    return apiFetch('/metrics/bottlenecks')
  },

  vehicleHistory(prismCode) {
    return apiFetch(`/metrics/vehicles/${prismCode}/history`)
  },

  // ── Novos endpoints de análise ────────────────────────────────────────────
  volumeByDay(days = 7) {
    return apiFetch(`/metrics/volume-by-day?days=${days}`)
  },

  serviceTypeStats() {
    return apiFetch('/metrics/service-type-stats')
  },

  peakHours(targetDate) {
    const qs = targetDate ? `?target_date=${targetDate}` : ''
    return apiFetch(`/metrics/peak-hours${qs}`)
  },

  outflowWait(days = 7) {
    return apiFetch(`/metrics/outflow-wait?days=${days}`)
  },

  punctuality() {
    return apiFetch('/metrics/punctuality')
  },

  // ── Eventos ───────────────────────────────────────────────────────────────
  events(start, end) {
    const qs = new URLSearchParams()
    if (start) qs.set('start', start)
    if (end)   qs.set('end', end)
    return apiFetch(`/events?${qs}`)
  },

  registerEvent(payload) {
    return apiFetch('/events/', { method: 'POST', body: JSON.stringify(payload) })
  },

  // ── Ordens de Serviço ─────────────────────────────────────────────────────
  listOrders() {
    return apiFetch('/os/')
  },

  createOrder(data) {
    return apiFetch('/os/', { method: 'POST', body: JSON.stringify(data) })
  },

  linkPrism(osId, prismCode) {
    return apiFetch(`/os/${osId}/link-prism`, {
      method: 'POST',
      body: JSON.stringify({ prism_code: prismCode }),
    })
  },

  // ── Prismas ───────────────────────────────────────────────────────────────
  availablePrisms() {
    return apiFetch('/prisms/available')
  },

  prismStatus(prismCode) {
    return apiFetch(`/prisms/${prismCode}/status`)
  },
}
