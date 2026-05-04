import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertTriangle,
  ClockArrowUp,
  FileText,
  Gauge,
  BarChart2,
  Menu,
} from 'lucide-react'

const links = [
  { to: '/',         label: 'Visão Geral',       icon: LayoutDashboard },
  { to: '/analise',  label: 'Análise',            icon: BarChart2       },
  { to: '/gargalos', label: 'Gargalos',           icon: AlertTriangle   },
  { to: '/historico',label: 'Histórico',          icon: ClockArrowUp    },
  { to: '/ordens',   label: 'Ordens de Serviço',  icon: FileText        },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex h-screen flex-col bg-gray-900 text-white transition-all duration-200 overflow-hidden ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand + Toggle */}
      <div
        className={`flex items-center border-b border-white/20 py-5 ${
          collapsed ? 'justify-center px-3' : 'justify-between px-5'
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Gauge size={22} className="text-white shrink-0" />
            <div>
              <p className="text-sm font-bold leading-tight whitespace-nowrap">AutoStep</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">Oficina</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-white/70 hover:text-white transition-colors shrink-0"
          title="Toggle menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : 'gap-3'
              } ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/20 py-4 px-3">
        {!collapsed && (
          <p className="text-[11px] text-white/40 whitespace-nowrap">v0.1.0 · Simulação</p>
        )}
      </div>
    </aside>
  )
}
