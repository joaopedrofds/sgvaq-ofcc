import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventoForm } from '@/components/eventos/evento-form'
import { StatusBadge } from '@/components/eventos/status-badge'
import { StatusTransition } from '@/components/eventos/status-transition'
import Link from 'next/link'
import { Layers, Ticket, QrCode, Trophy } from 'lucide-react'
import type { EventoStatus } from '@/types'
import { mockEventos } from '@/lib/mock/data'

export default async function EventoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let evento: any

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    evento = mockEventos.find(e => e.id === id)
  } else {
    const supabase = await createClient()
    const { data } = await supabase.from('eventos').select('*').eq('id', id).single()
    evento = data
  }

  if (!evento) notFound()

  const actionLinks = [
    { href: `/eventos/${id}/modalidades`, label: 'Modalidades e Regras', icon: <Layers className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors" /> },
    { href: `/eventos/${id}/senhas`, label: 'Gestão de Senhas', icon: <Ticket className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors" /> },
    { href: `/eventos/${id}/checkin`, label: 'Controle de Check-in', icon: <QrCode className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors" /> },
    { href: `/eventos/${id}/ranking`, label: 'Visão do Ranking', icon: <Trophy className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors" /> },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800">
        <div className="space-y-4">
          <StatusBadge status={evento.status as EventoStatus} />
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{evento.nome}</h1>
          <p className="text-stone-400 font-mono text-sm tracking-widest uppercase">ID: {id.split('-')[0]}</p>
        </div>
        <div className="w-full md:w-auto p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col items-start md:items-end gap-2 shadow-xl">
          <p className="text-xs text-stone-500 font-semibold tracking-wide uppercase">Controle de Status</p>
          <StatusTransition eventoId={id} currentStatus={evento.status as EventoStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PARTE ESQUERDA - INFOS DA COMPUTAÇÃO */}
        <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-2 bg-amber-500 rounded-full" />
            <h2 className="text-xl font-bold text-white">Configurações Base</h2>
          </div>
          <EventoForm eventoId={id} defaultValues={evento as any} />
        </div>

        {/* PARTE DIREITA - AÇÕES RÁPIDAS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-stone-900/50 backdrop-blur-xl border border-stone-800 rounded-3xl p-6 shadow-2xl">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-800">
                <h2 className="text-lg font-bold text-white">Módulos Operacionais</h2>
             </div>
             
             <div className="space-y-3">
               {actionLinks.map(link => (
                 <Link
                   key={link.href}
                   href={link.href}
                   className="group relative flex items-center gap-4 w-full p-4 rounded-2xl bg-stone-950/50 border border-stone-800/80 hover:bg-stone-800 hover:border-amber-500/30 transition-all duration-300"
                 >
                   <div className="h-10 w-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shadow-inner group-hover:bg-[#111] transition-colors">
                     {link.icon}
                   </div>
                   <span className="font-semibold text-stone-300 group-hover:text-white transition-colors">{link.label}</span>
                 </Link>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
