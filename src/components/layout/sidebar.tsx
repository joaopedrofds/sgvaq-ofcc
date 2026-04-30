'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import {
  LayoutDashboard, Calendar, Ticket, Users, UserCheck,
  DollarSign, AlertTriangle, Flame
} from 'lucide-react'

const navItems: Record<string, { href: string; icon: React.ElementType; label: string }[]> = {
  organizador: [
    { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/eventos',     icon: Calendar,        label: 'Eventos' },
    { href: '/competidores',icon: Users,           label: 'Competidores' },
    { href: '/financeiro',  icon: DollarSign,      label: 'Financeiro' },
    { href: '/equipe',      icon: UserCheck,       label: 'Gestão de Autonomia' },
    { href: '/conflitos',   icon: AlertTriangle,   label: 'Malha de Prova' },
  ],
  financeiro: [
    { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/financeiro',  icon: DollarSign,      label: 'Caixa' },
    { href: '/eventos',     icon: Calendar,        label: 'Eventos' },
  ],
  juiz: [
    { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/eventos',     icon: Calendar,        label: 'Eventos' },
  ],
  locutor: [
    { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/eventos',     icon: Calendar,        label: 'Eventos' },
  ],
}

interface SidebarProps {
  role: UserRole
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const items = navItems[role] ?? navItems.organizador

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-[#110C08] border-r border-[#2C1F16] text-stone-300 min-h-screen flex flex-col relative z-10 shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-orange-600/10 to-transparent pointer-events-none" />
      
      <div className="p-6 border-b border-[#2C1F16] relative">
        <div className="flex flex-col items-center justify-center gap-2 mt-4 mb-2">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#1E1712] shadow-[0_4px_20px_rgba(217,119,6,0.2)] border border-orange-500/20 flex items-center justify-center">
            <img src="/sgvaq-logo.png" alt="SGVAQ Logo" className="w-full h-full object-cover scale-[1.15]" />
          </div>
          <div className="text-center">
            <p className="text-[11px] uppercase font-bold tracking-widest text-orange-400/90">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 relative group',
                active
                  ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20'
                  : 'text-stone-400 hover:bg-[#1A1410] hover:text-stone-200 border border-transparent'
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-orange-500" : "text-stone-500 group-hover:text-stone-300")} />
              {item.label}
              
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4">
        <div className="bg-[#18120e] border border-[#2C1F16] rounded-xl p-4 shadow-inner">
          <p className="text-xs text-stone-500 font-medium tracking-wide">Plataforma Padrão Vaquejada</p>
          <p className="text-[10px] text-stone-600 mt-1 uppercase font-bold">Premium Edition</p>
        </div>
      </div>
    </aside>
  )
}
