import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Calendar, DollarSign, Bell, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

function formatBRL(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)
}

async function getDashboardData() {
  // Modo mock: nao chama Supabase, retorna dados de src/lib/mock/data.ts
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    const { mockTenant, mockEventos, mockNotificacoes, mockCobrancas } = await import('@/lib/mock/data')

    const totalTenants = 1
    const tenantsAtivos = mockTenant.ativo ? 1 : 0
    const eventosTotal = mockEventos.length
    const notifFalhas = mockNotificacoes.filter(n => n.status === 'falhou').length

    // A pagina espera "total_cobranca" e "mes"; o mock usa "valor_devido" e "mes_referencia".
    // Mapeamos para manter o JSX original intocado.
    const cobrancasData = mockCobrancas.map(c => ({ total_cobranca: c.valor_devido }))
    const cobrancasPendentes = mockCobrancas
      .filter(c => c.status === 'pendente')
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia))
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        tenant: { nome: c.tenant?.nome ?? mockTenant.nome },
        mes: c.mes_referencia,
        total_cobranca: c.valor_devido,
        status: c.status,
      }))

    return { totalTenants, tenantsAtivos, eventosTotal, notifFalhas, cobrancasData, cobrancasPendentes }
  }

  // Modo real: usa Supabase admin client (import dinamico para nao carregar em mock)
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = await createAdminClient()

  const [
    { count: totalTenants },
    { count: tenantsAtivos },
    { count: eventosTotal },
    { count: notifFalhas },
    { data: cobrancasData },
    { data: cobrancasPendentes },
  ] = await Promise.all([
    admin.from('tenants').select('*', { count: 'exact', head: true }),
    admin.from('tenants').select('*', { count: 'exact', head: true }).eq('ativo', true),
    admin.from('eventos').select('*', { count: 'exact', head: true }),
    admin.from('notificacoes_fila').select('*', { count: 'exact', head: true }).eq('status', 'falhou'),
    admin.from('cobrancas_sgvaq').select('total_cobranca'),
    admin.from('cobrancas_sgvaq').select('id, tenant:tenants(nome), mes, total_cobranca, status')
      .eq('status', 'pendente')
      .order('mes', { ascending: false })
      .limit(5),
  ])

  return {
    totalTenants: totalTenants ?? 0,
    tenantsAtivos: tenantsAtivos ?? 0,
    eventosTotal: eventosTotal ?? 0,
    notifFalhas: notifFalhas ?? 0,
    cobrancasData: cobrancasData ?? [],
    cobrancasPendentes: cobrancasPendentes ?? [],
  }
}

export default async function AdminDashboardPage() {
  const {
    totalTenants,
    tenantsAtivos,
    eventosTotal,
    notifFalhas,
    cobrancasData,
    cobrancasPendentes,
  } = await getDashboardData()

  const receitaTotal = (cobrancasData ?? []).reduce((acc: number, c: any) => acc + c.total_cobranca, 0)

  const stats = [
    { label: 'Organizadoras ativas', value: tenantsAtivos, total: totalTenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/tenants' },
    { label: 'Eventos cadastrados', value: eventosTotal, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', href: null },
    { label: 'Notif. com falha', value: notifFalhas, icon: Bell, color: 'text-red-600', bg: 'bg-red-50', href: '/admin/notificacoes' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da plataforma SGVAQ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          const inner = (
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-full ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {s.value}
                  {'total' in s && s.total !== s.value && (
                    <span className="text-base font-normal text-gray-400 ml-1">/ {s.total}</span>
                  )}
                </p>
              </div>
            </CardContent>
          )
          return (
            <Card key={s.label} className={s.href ? 'hover:border-gray-300 transition-colors' : ''}>
              {s.href ? <Link href={s.href}>{inner}</Link> : inner}
            </Card>
          )
        })}
      </div>

      {/* Receita SGVAQ acumulada */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-50">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Receita SGVAQ acumulada (taxas)</p>
            <p className="text-3xl font-bold text-emerald-700">{formatBRL(receitaTotal)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cobranças pendentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Cobranças pendentes
          </CardTitle>
          <Link href="/admin/cobrancas" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Ver todas →
          </Link>
        </CardHeader>
        <CardContent>
          {!cobrancasPendentes?.length ? (
            <p className="text-sm text-gray-400 py-2 text-center">Nenhuma cobrança pendente.</p>
          ) : (
            <div className="divide-y">
              {cobrancasPendentes.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/admin/cobrancas/${c.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{(c.tenant as any)?.nome}</p>
                    <p className="text-xs text-gray-400">{c.mes}</p>
                  </div>
                  <p className="text-sm font-bold text-amber-700">{formatBRL(c.total_cobranca)}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}