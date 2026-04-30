import Link from 'next/link'
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type { EventoStatus } from '@/types'
import { cn } from '@/lib/utils'

interface EventoCardProps {
  id: string
  nome: string
  tipo: string
  data_inicio: string
  data_fim: string
  cidade: string
  estado: string
  status: EventoStatus
  modalidadesCount?: number
}

export function EventoCard({ id, nome, tipo, data_inicio, data_fim, cidade, estado, status, modalidadesCount }: EventoCardProps) {
  return (
    <Link href={`/eventos/${id}`} className="group relative block overflow-hidden rounded-3xl bg-stone-900 border border-stone-800 p-6 transition-all duration-300 hover:bg-[#111] hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.05)]">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 rounded-full bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
      
      <div className="flex items-start justify-between relative z-10">
        <StatusBadge status={status} />
        <div className="h-8 w-8 rounded-full bg-stone-800 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
          <ChevronRight className="w-4 h-4 text-amber-500" />
        </div>
      </div>
      
      <div className="mt-6 relative z-10">
        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">
          {nome}
        </h3>
        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-stone-800 text-xs text-stone-400 uppercase tracking-widest font-semibold font-mono">
          {tipo}
        </span>
      </div>

      <div className="mt-8 space-y-3 relative z-10">
        <div className="flex items-center gap-3 text-sm text-stone-400">
          <div className="w-8 h-8 rounded-lg bg-stone-800/80 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-amber-500/80" />
          </div>
          <span className="font-medium text-stone-300">
            {new Date(data_inicio).toLocaleDateString('pt-BR')} 
            <span className="opacity-40 mx-2">até</span> 
            {new Date(data_fim).toLocaleDateString('pt-BR')}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-stone-400">
          <div className="w-8 h-8 rounded-lg bg-stone-800/80 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-emerald-500/80" />
          </div>
          <span className="font-medium text-stone-300">
            {cidade} <span className="opacity-40">-</span> {estado}
          </span>
        </div>

        {modalidadesCount !== undefined && (
          <div className="flex items-center gap-3 text-sm text-stone-400">
            <div className="w-8 h-8 rounded-lg bg-stone-800/80 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500/80" />
            </div>
            <span className="font-medium text-stone-300">
              {modalidadesCount} modalidade{modalidadesCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
