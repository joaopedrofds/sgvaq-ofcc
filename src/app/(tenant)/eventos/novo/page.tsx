import { EventoForm } from '@/components/eventos/evento-form'
import { CalendarDays } from 'lucide-react'

export default function NovoEventoPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4 border-b border-stone-800 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <CalendarDays className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Novo Evento</h1>
          <p className="text-stone-400 text-sm mt-1">Configure as informações base da sua competição.</p>
        </div>
      </div>
      
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <EventoForm />
      </div>
    </div>
  )
}
