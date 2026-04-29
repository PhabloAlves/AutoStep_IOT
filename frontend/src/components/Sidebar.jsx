import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertTriangle,
  ClockArrowUp,
  FileText,
  Gauge,
} from 'lucide-react'

const links = [
  { to: '/',              label: 'Visão Geral',       icon: LayoutDashboard },
  { to: '/gargalos',      label: 'Gargalos',          icon: AlertTriangle   },
  { to: '/historico',     label: 'Histórico',         icon: ClockArrowUp    },
  { to: '/ordens',        label: 'Ordens de Serviço', icon: FileText        },
]

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col bg-gray-900 text-white">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-6 border-b border-white/20">
        <Gauge size={26} className="text-white" />
        <div>
          <p className="text-lg font-bold leading-tight">AutoStep</p>
          <p className="text-[10px] text-white/60 uppercase tracking-widest">Oficina</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/20">
        <p className="text-[11px] text-white/40">v0.1.0 · Simulação</p>
      </div>
    </aside>
  )
}
