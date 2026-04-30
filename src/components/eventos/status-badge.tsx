import { cn } from '@/lib/utils'
import type { EventoStatus } from '@/types'

const statusConfig: Record<EventoStatus, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-stone-500/10 text-stone-400 border border-stone-500/20' },
  aberto: { label: 'Aberto (Inscrições)', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
  em_andamento: { label: 'Prova em Andamento', className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' },
  encerrado: { label: 'Encerrado', className: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' },
}

export function StatusBadge({ status }: { status: EventoStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide uppercase', config.className)}>
      {config.label}
    </span>
  )
}
