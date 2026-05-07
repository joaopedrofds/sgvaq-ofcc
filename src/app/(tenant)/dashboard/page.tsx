import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/get-session'
import {
  Calendar, Ticket, Users, DollarSign, Clock, ArrowRight,
  Activity, Bell, TrendingUp, MapPin, ListChecks, Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  mockEventos, mockSenhas, mockCompetidores, mockTransacoes,
  mockModalidades, mockFila, mockRanking,
} from '@/lib/mock/data'

function formatBRL(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  aberto: 'Aberto',
  publicado: 'Publicado',
  em_andamento: 'Em Andamento',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
}

const statusColors: Record<string, string> = {
  rascunho: 'text-stone-400 bg-stone-900 border-stone-800',
  aberto: 'text-blue-400 bg-blue-950/30 border-blue-900/50',
  publicado: 'text-blue-400 bg-blue-950/30 border-blue-900/50',
  em_andamento: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50',
  encerrado: 'text-stone-300 bg-stone-800 border-stone-700',
  cancelado: 'text-rose-400 bg-rose-950/30 border-rose-900/50',
}

interface DashboardData {
  eventosAtivos: number
  eventosTotal: number
  senhasVendidas: number
  competidores: number
  receitaTotal: number
  ticketMedio: number
  taxaSgvaqTotal: number
  totalCancelamentos: number
  eventosRecentes: Array<{
    id: string
    nome: string
    status: string
    data_inicio: string
    cidade: string
    estado: string | null
  }>
  modalidadesAtivas: Array<{
    id: string
    nome: string
    eventoNome: string
    senhas_vendidas: number
    total_senhas: number
    valor_senha: number
  }>
  filaAguardando: number
  filaChamados: number
  topRanking: Array<{ nome: string; total_pontos: number; posicao: number }>
}

/** Carrega dados do mock diretamente — usado quando NEXT_PUBLIC_MOCK=true */
function loadMockDashboardData(): DashboardData {
  const ativos = ['aberto', 'publicado', 'em_andamento']
  const eventosNaoCancelados = mockEventos.filter(e => e.status !== 'cancelado')
  const eventosAtivosLista = mockEventos.filter(e => e.status === 'em_andamento')

  // Senhas "ativas" inclui ativa + checkin_feito (já confirmadas)
  const senhasAtivas = mockSenhas.filter(s => s.status === 'ativa' || s.status === 'checkin_feito')

  const vendas = mockTransacoes.filter(t => t.tipo === 'venda')
  const cancelamentos = mockTransacoes.filter(t => t.tipo === 'cancelamento')
  const receitaTotal = mockTransacoes.reduce((acc, t) => acc + t.valor, 0)
  const taxaSgvaqTotal = mockTransacoes.reduce((acc, t) => acc + (t.taxa_sgvaq ?? 0), 0)
  const ticketMedio = vendas.length > 0
    ? vendas.reduce((acc, t) => acc + t.valor, 0) / vendas.length
    : 0

  const eventosRecentes = [...eventosNaoCancelados]
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      nome: e.nome,
      status: e.status,
      data_inicio: e.data_inicio,
      cidade: e.cidade,
      estado: e.estado,
    }))

  // Modalidades ativas dos eventos em andamento
  const eventosAtivosIds = new Set(eventosAtivosLista.map(e => e.id))
  const modalidadesAtivas = mockModalidades
    .filter(m => eventosAtivosIds.has(m.evento_id))
    .map(m => {
      const evento = mockEventos.find(e => e.id === m.evento_id)
      return {
        id: m.id,
        nome: m.nome,
        eventoNome: evento?.nome ?? '—',
        senhas_vendidas: m.senhas_vendidas,
        total_senhas: m.total_senhas,
        valor_senha: m.valor_senha,
      }
    })
    .sort((a, b) => b.senhas_vendidas - a.senhas_vendidas)
    .slice(0, 4)

  const filaAguardando = mockFila.filter(f => f.status === 'aguardando').length
  const filaChamados = mockFila.filter(f => f.status === 'chamado').length

  const topRanking = [...mockRanking]
    .sort((a, b) => a.posicao - b.posicao)
    .slice(0, 3)
    .map(r => ({
      nome: r.competidores?.nome ?? '—',
      total_pontos: r.total_pontos,
      posicao: r.posicao,
    }))

  return {
    eventosAtivos: eventosAtivosLista.length,
    eventosTotal: eventosNaoCancelados.length,
    senhasVendidas: senhasAtivas.length,
    competidores: mockCompetidores.length,
    receitaTotal,
    ticketMedio,
    taxaSgvaqTotal,
    totalCancelamentos: cancelamentos.length,
    eventosRecentes,
    modalidadesAtivas,
    filaAguardando,
    filaChamados,
    topRanking,
  }
}

/** Carrega dados via Supabase real — produção */
async function loadSupabaseDashboardData(): Promise<DashboardData> {
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
    supabase.from('senhas').select('*', { count: 'exact', head: true }).in('status', ['ativa', 'checkin_feito']),
    supabase.from('competidores').select('*', { count: 'exact', head: true }),
    supabase.from('financeiro_transacoes').select('valor, taxa_sgvaq, tipo'),
    supabase.from('eventos')
      .select('id, nome, status, data_inicio, cidade, estado')
      .not('status', 'eq', 'cancelado')
      .order('data_inicio', { ascending: false })
      .limit(5),
  ])

  const txs = (receitaData ?? []) as Array<{ valor: number; taxa_sgvaq: number | null; tipo: string }>
  const vendas = txs.filter(t => t.tipo === 'venda')
  const cancelamentos = txs.filter(t => t.tipo === 'cancelamento')
  const receitaTotal = txs.reduce((acc, t) => acc + (t.valor ?? 0), 0)
  const taxaSgvaqTotal = txs.reduce((acc, t) => acc + (t.taxa_sgvaq ?? 0), 0)
  const ticketMedio = vendas.length > 0
    ? vendas.reduce((acc, t) => acc + t.valor, 0) / vendas.length
    : 0

  return {
    eventosAtivos: eventosAtivos ?? 0,
    eventosTotal: eventosTotal ?? 0,
    senhasVendidas: senhasVendidas ?? 0,
    competidores: competidores ?? 0,
    receitaTotal,
    ticketMedio,
    taxaSgvaqTotal,
    totalCancelamentos: cancelamentos.length,
    eventosRecentes: (eventosRecentes ?? []) as DashboardData['eventosRecentes'],
    modalidadesAtivas: [],
    filaAguardando: 0,
    filaChamados: 0,
    topRanking: [],
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  const isMock = process.env.NEXT_PUBLIC_MOCK === 'true'

  const data = isMock ? loadMockDashboardData() : await loadSupabaseDashboardData()

  const stats = [
    {
      label: 'Eventos em Andamento',
      value: data.eventosAtivos,
      icon: Activity,
      color: 'text-orange-500',
      glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Senhas Ativas',
      value: data.senhasVendidas,
      icon: Ticket,
      color: 'text-amber-500',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Competidores',
      value: data.competidores,
      icon: Users,
      color: 'text-stone-300',
      glow: 'shadow-[0_0_15px_rgba(214,211,209,0.1)]',
      bg: 'bg-stone-500/10',
    },
    {
      label: 'Total de Eventos',
      value: data.eventosTotal,
      icon: Calendar,
      color: 'text-red-700',
      glow: 'shadow-[0_0_15px_rgba(185,28,28,0.2)]',
      bg: 'bg-red-700/10',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
          <p className="text-stone-400 text-sm mt-1 flex items-center gap-2">
            Verificando métricas de <span className="text-amber-500 font-medium">{session?.email}</span>
            {isMock && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                Modo Demo
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-10 w-10 relative flex items-center justify-center rounded-xl bg-[#1A1410] border border-[#2d2218] text-orange-400/80 hover:text-orange-400 hover:border-orange-500/30 transition-all shadow-inner">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-[#1A1410]" />
          </button>
          <Link
            href="/eventos/novo"
            className="h-10 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-stone-950 font-bold text-sm transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.4)] border border-orange-400/50"
          >
            <Calendar className="h-4 w-4" />
            Novo Evento
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl bg-stone-900/50 border border-stone-800/50 backdrop-blur-xl p-6 transition-all hover:bg-stone-900/80 hover:border-stone-700"
            >
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

      {/* Receita + Ações rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-[#130E0B] border border-[#2d2218] p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-black uppercase tracking-widest mb-4 font-serif">
                <Clock className="w-3 h-3" />
                Receita em Tempo Real
              </div>
              <p className="text-5xl font-black text-white tracking-tighter drop-shadow-sm font-serif">
                {formatBRL(data.receitaTotal)}
              </p>
              <p className="text-stone-500 text-sm mt-3 font-medium">
                Acumulado de todas as senhas e inscrições ativas
              </p>
            </div>

            <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 items-center justify-center rotate-6 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          {/* Mini-stats financeiros */}
          <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#2d2218]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Ticket Médio</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{formatBRL(data.ticketMedio)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Taxa SGVAQ</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{formatBRL(data.taxaSgvaqTotal)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Cancelamentos</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">{data.totalCancelamentos}</p>
            </div>
          </div>
        </div>

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
                <span className={cn('w-6 h-6 rounded-lg border flex items-center justify-center transition-colors bg-black/20', link.color)}>
                  <ArrowRight className="w-3 h-3 current-color" />
                </span>
              </div>
              <span className="text-stone-500/80 text-xs mt-1.5 font-medium">{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Modalidades ativas + Fila/Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modalidades em andamento */}
        <div className="lg:col-span-2 rounded-3xl bg-stone-900 border border-stone-800 overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-stone-800/60 flex items-center justify-between bg-stone-950/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h2 className="text-lg font-bold text-white">Modalidades em Andamento</h2>
            </div>
            <Link
              href="/eventos"
              className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
            >
              Ver eventos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-2">
            {data.modalidadesAtivas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListChecks className="w-10 h-10 text-stone-700 mb-2" />
                <p className="text-stone-500 text-sm">Nenhuma modalidade em andamento</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {data.modalidadesAtivas.map(m => {
                  const pct = m.total_senhas > 0 ? (m.senhas_vendidas / m.total_senhas) * 100 : 0
                  return (
                    <div
                      key={m.id}
                      className="p-4 px-6 border-b border-stone-800/40 last:border-b-0 hover:bg-stone-800/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-stone-100">{m.nome}</p>
                          <p className="text-xs text-stone-500 mt-0.5">{m.eventoNome} • {formatBRL(m.valor_senha)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white tabular-nums">
                            {m.senhas_vendidas}<span className="text-stone-500">/{m.total_senhas}</span>
                          </p>
                          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                            {pct.toFixed(0)}% vendido
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Fila + Top ranking */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-[#130E0B] border border-[#2d2218] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300">Fila ao Vivo</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-black text-white tabular-nums">{data.filaAguardando}</p>
                <p className="text-xs text-stone-500 font-medium mt-1">Aguardando</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400 tabular-nums">{data.filaChamados}</p>
                <p className="text-xs text-stone-500 font-medium mt-1">Chamados</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300">Top Ranking</h3>
            </div>
            {data.topRanking.length === 0 ? (
              <p className="text-stone-500 text-xs">Sem dados de ranking</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.topRanking.map(r => (
                  <div
                    key={r.posicao}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black tabular-nums',
                          r.posicao === 1 && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                          r.posicao === 2 && 'bg-stone-400/20 text-stone-300 border border-stone-400/30',
                          r.posicao === 3 && 'bg-orange-700/20 text-orange-500 border border-orange-700/30',
                        )}
                      >
                        {r.posicao}º
                      </span>
                      <span className="text-sm font-semibold text-stone-100">{r.nome}</span>
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums">{r.total_pontos.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Eventos recentes */}
      <div className="rounded-3xl bg-stone-900 border border-stone-800 overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-stone-800/60 flex items-center justify-between bg-stone-950/50">
          <h2 className="text-lg font-bold text-white">Eventos Recentes</h2>
          <Link
            href="/eventos"
            className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
          >
            Ver catálogo completo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-2">
          {!data.eventosRecentes.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-stone-600" />
              </div>
              <h3 className="text-stone-300 font-medium text-lg">Nenhum evento registrado</h3>
              <p className="text-stone-500 text-sm mt-1 max-w-sm">
                Comece criando o seu primeiro evento de vaquejada para gerenciar competidores e lucros.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {data.eventosRecentes.map(ev => (
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
                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ev.cidade}{ev.estado ? `, ${ev.estado}` : ''}
                        <span className="mx-1.5 opacity-50">•</span>
                        {new Date(ev.data_inicio).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
                      statusColors[ev.status] ?? 'text-stone-400 bg-stone-900 border-stone-800',
                    )}
                  >
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
