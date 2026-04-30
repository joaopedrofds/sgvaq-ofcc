import { getEventos } from '@/actions/eventos'
import { EventoCard } from '@/components/eventos/evento-card'
import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'
import type { EventoStatus } from '@/types'

export default async function EventosPage() {
  const result = await getEventos()

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Catálogo de Eventos</h1>
          <p className="text-stone-400 text-sm mt-1">Gerencie competições de Vaquejada e Tambor</p>
        </div>
        
        <Link
          href="/eventos/novo"
          className="h-10 px-5 inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Cadastrar Evento
        </Link>
      </div>

      {'error' in (result ?? {}) ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          {(result as any).error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data?.map((evento: any) => (
            <EventoCard
              key={evento.id}
              id={evento.id}
              nome={evento.nome}
              tipo={evento.tipo}
              data_inicio={evento.data_inicio}
              data_fim={evento.data_fim}
              cidade={evento.cidade ?? ''}
              estado={evento.estado ?? ''}
              status={evento.status as EventoStatus}
              modalidadesCount={evento.modalidades?.[0]?.count}
            />
          ))}
          {result.data?.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-stone-800 bg-stone-900/20">
              <div className="w-16 h-16 rounded-full bg-stone-800/50 flex items-center justify-center mb-4">
                <CalendarDays className="w-8 h-8 text-stone-500" />
              </div>
              <h3 className="text-stone-300 font-medium text-lg">Nenhum evento registrado</h3>
              <p className="text-stone-500 text-sm mt-1 max-w-sm">Comece criando o seu primeiro evento de vaquejada clicando em Cadastrar Evento no topo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
