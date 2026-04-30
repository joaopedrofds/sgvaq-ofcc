'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { transitionEventoStatus } from '@/actions/eventos'
import type { EventoStatus } from '@/types'
import { Play, CheckCircle2, Lock } from 'lucide-react'

const transitions: Record<EventoStatus, { to: EventoStatus; label: string; icon: React.ReactNode; btnClass: string } | null> = {
  rascunho: { to: 'aberto', label: 'Abrir Vendas', icon: <Lock className="w-4 h-4 mr-2" />, btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold' },
  aberto: { to: 'em_andamento', label: 'Iniciar Prova', icon: <Play className="w-4 h-4 mr-2 fill-current" />, btnClass: 'bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold' },
  em_andamento: { to: 'encerrado', label: 'Encerrar Evento', icon: <CheckCircle2 className="w-4 h-4 mr-2" />, btnClass: 'bg-rose-500 hover:bg-rose-400 text-white font-bold tracking-wide' },
  encerrado: null,
}

export function StatusTransition({ eventoId, currentStatus }: { eventoId: string; currentStatus: EventoStatus }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const transition = transitions[currentStatus]

  if (!transition) return <p className="text-sm text-stone-500 font-medium px-4 py-2 bg-stone-900 rounded-lg border border-stone-800">Evento Encerrado</p>

  async function handleTransition() {
    if (!confirm(`Confirma que deseja: ${transition!.label}?`)) return
    setLoading(true)
    const result = await transitionEventoStatus(eventoId, transition!.to)
    if ('error' in result) setError(result.error ?? 'Erro crítico na transição.')
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleTransition}
        disabled={loading}
        className={`h-10 px-6 rounded-full transition-all shadow-lg ${transition.btnClass}`}
      >
        {loading ? 'Processando transição...' : (
          <span className="flex items-center">
            {transition.icon}
            {transition.label}
          </span>
        )}
      </Button>
      {error && <p className="text-xs text-rose-500 font-medium bg-rose-500/10 px-2 py-1 rounded">{error}</p>}
    </div>
  )
}
