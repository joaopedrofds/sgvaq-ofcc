'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Building2, DollarSign, Bell, Settings } from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard',                 icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/tenants',                   icon: Building2,       label: 'Tenants' },
  { href: '/admin/cobrancas',                 icon: DollarSign,      label: 'Cobranças' },
  { href: '/admin/notificacoes',              icon: Bell,            label: 'Notificações' },
  { href: '/admin/configuracoes/criterios',   icon: Settings,        label: 'Critérios' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">SGVAQ Admin</h1>
        <p className="text-xs text-gray-400 mt-0.5">Super Admin</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">SGVAQ v1.0</p>
      </div>
    </aside>
  )
}
