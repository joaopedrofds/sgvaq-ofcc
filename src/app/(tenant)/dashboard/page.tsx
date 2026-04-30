import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/get-session'
import { Calendar, Ticket, Users, DollarSign, Clock, ArrowRight, Activity, Bell } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function formatBRL(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)
}

export default async function DashboardPage() {
  const session = await getSession()
  const supabase = await createClient()

  const [
    { count: eventosAtivos },
    { count: eventosTotal },
    { count: senhasVendidas },
    { count: competidores },
    { data: receitaData },
    { data: eventosRecentes },
  ] = await Promise.all([
    supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase.from('eventos').select('*', { count: 'exact', head: true }).not('status', 'eq', 'cancelado'),
    supabase.from('senhas').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
    supabase.from('competidores').select('*', { count: 'exact', head: true }),
    supabase.from('financeiro_transacoes').select('valor').eq('tipo', 'venda'),
    supabase.from('eventos')
      .select('id, nome, status, data_inicio, cidade, estado')
      .not('status', 'eq', 'cancelado')
      .order('data_inicio', { ascending: false })
      .limit(5),
  ])

  const receitaTotal = (receitaData ?? []).reduce((acc: number, t: any) => acc + t.valor, 0)

  const stats = [
    { label: 'Eventos em Andamento', value: eventosAtivos ?? 0, icon: Activity, color: 'text-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]', bg: 'bg-orange-500/10' },
    { label: 'Senhas Ativas', value: senhasVendidas ?? 0, icon: Ticket, color: 'text-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]', bg: 'bg-amber-500/10' },
    { label: 'Competidores', value: competidores ?? 0, icon: Users, color: 'text-stone-300', glow: 'shadow-[0_0_15px_rgba(214,211,209,0.1)]', bg: 'bg-stone-500/10' },
    { label: 'Total de Eventos', value: eventosTotal ?? 0, icon: Calendar, color: 'text-red-700', glow: 'shadow-[0_0_15px_rgba(185,28,28,0.2)]', bg: 'bg-red-700/10' },
  ]

  const statusLabels: Record<string, string> = {
    rascunho: 'Rascunho',
    publicado: 'Publicado',
    em_andamento: 'Em Andamento',
    encerrado: 'Encerrado',
    cancelado: 'Cancelado',
  }

  const statusColors: Record<string, string> = {
    rascunho: 'text-stone-400 bg-stone-900 border-stone-800',
    publicado: 'text-blue-400 bg-blue-950/30 border-blue-900/50',
    em_andamento: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50',
    encerrado: 'text-stone-300 bg-stone-800 border-stone-700',
    cancelado: 'text-rose-400 bg-rose-950/30 border-rose-900/50',
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
          <p className="text-stone-400 text-sm mt-1 flex items-center gap-2">
            Verificando métricas de <span className="text-amber-500 font-medium">{session?.email}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-[#1A1410] border border-[#2d2218] text-orange-400/80 hover:text-orange-400 hover:border-orange-500/30 transition-all shadow-inner">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-[#1A1410]" />
          </button>
          <Link href="/eventos/novo" className="h-10 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-stone-950 font-bold text-sm transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.4)] border border-orange-400/50">
            <Calendar className="h-4 w-4" />
            Novo Evento
          </Link>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-stone-900/50 border border-stone-800/50 backdrop-blur-xl p-6 transition-all hover:bg-stone-900/80 hover:border-stone-700">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl delay-75" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500">{s.label}</p>
                  <p className="text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">{s.value}</p>
                </div>
                <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110', s.bg, s.glow)}>
                  <Icon className={cn('h-5 w-5', s.color)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Card - Takes 2 cols on Large screens */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-[#130E0B] border border-[#2d2218] p-8 shadow-2xl">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-black uppercase tracking-widest mb-4 font-serif">
                <Clock className="w-3 h-3" />
                Receita em Tempo Real
              </div>
              <p className="text-5xl font-black text-white tracking-tighter drop-shadow-sm font-serif">
                {formatBRL(receitaTotal)}
              </p>
              <p className="text-stone-500 text-sm mt-3 font-medium">Acumulado de todas as senhas e inscrições ativas</p>
            </div>
            
            <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 items-center justify-center rotate-6 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions Array */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-white mb-2 px-1 font-serif tracking-wide">Acesso Rápido</h2>
          {[
            { label: 'Gestão Financeira', href: '/financeiro', desc: 'Controle de caixa e repasses', color: 'border-orange-500/30 group-hover:border-orange-500/60 text-orange-500' },
            { label: 'Painel de Competidores', href: '/competidores', desc: 'Ranking e inscrições', color: 'border-stone-500/40 group-hover:border-stone-500/70 text-stone-400' },
            { label: 'Controle de Escala', href: '/equipe', desc: 'Juízes, locutores e org', color: 'border-amber-600/30 group-hover:border-amber-600/60 text-amber-600' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col justify-center p-4 rounded-2xl bg-[#1A1410] border border-[#2d2218] hover:bg-[#201813] hover:border-[#3d2f23] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-stone-100 font-bold tracking-wide text-sm">{link.label}</span>
                <span className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-colors bg-black/20", link.color)}>
                  <ArrowRight className="w-3 h-3 current-color" />
                </span>
              </div>
              <span className="text-stone-500/80 text-xs mt-1.5 font-medium">{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Events Section */}
      <div className="rounded-3xl bg-stone-900 border border-stone-800 overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-stone-800/60 flex items-center justify-between bg-stone-950/50">
          <h2 className="text-lg font-bold text-white">Eventos Recentes</h2>
          <Link href="/eventos" className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors inline-flex items-center gap-1">
            Ver catálogo completo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="p-2">
          {!eventosRecentes?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-stone-600" />
              </div>
              <h3 className="text-stone-300 font-medium text-lg">Nenhum evento registrado</h3>
              <p className="text-stone-500 text-sm mt-1 max-w-sm">Comece criando o seu primeiro evento de vaquejada para gerenciar competidores e lucros.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {eventosRecentes.map((ev: any) => (
                <Link
                  key={ev.id}
                  href={`/eventos/${ev.id}`}
                  className="group flex items-center justify-between p-4 px-6 rounded-2xl hover:bg-stone-800/50 transition-all border border-transparent hover:border-stone-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center border border-stone-700 group-hover:border-stone-600 transition-colors">
                      <Calendar className="w-5 h-5 text-stone-400 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-100 group-hover:text-white transition-colors">{ev.nome}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {ev.cidade}{ev.estado ? `, ${ev.estado}` : ''} <span className="mx-1.5 opacity-50">•</span>
                        {new Date(ev.data_inicio).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
                    statusColors[ev.status] ?? 'text-stone-400 bg-stone-900 border-stone-800'
                  )}>
                    {statusLabels[ev.status] ?? ev.status}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
