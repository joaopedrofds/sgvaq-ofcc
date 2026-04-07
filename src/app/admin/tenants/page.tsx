import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Calendar, Ticket } from 'lucide-react'

const planoLabels: Record<string, string> = {
  basico: 'Básico',
  profissional: 'Profissional',
  enterprise: 'Enterprise',
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const admin = createAdminClient()
  const q = searchParams.q?.trim() ?? ''

  let query = admin
    .from('tenants')
    .select(`
      id, nome, slug, plano, ativo, created_at,
      eventos(count),
      tenant_users(count)
    `)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('nome', `%${q}%`) as any
  }

  const { data: tenants } = await query

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenants</h1>
        <p className="text-sm text-gray-500 mt-0.5">{tenants?.length ?? 0} organizadoras cadastradas</p>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome…"
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors">
          Buscar
        </button>
        {q && (
          <a href="/admin/tenants" className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50 transition-colors">
            Limpar
          </a>
        )}
      </form>

      <div className="space-y-3">
        {!tenants?.length && (
          <p className="text-center text-gray-400 py-12">Nenhuma organizadora encontrada.</p>
        )}
        {tenants?.map((t: any) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <p className="font-semibold text-gray-900">{t.nome}</p>
                  {!t.ativo && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                </div>
                <p className="text-xs text-gray-400">
                  <span className="font-mono">{t.slug}</span>
                  {' · '}
                  Desde {new Date(t.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {(t.eventos?.[0]?.count ?? 0)} eventos
                </span>
                <span className="flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5" />
                  {(t.tenant_users?.[0]?.count ?? 0)} membros
                </span>
                <Badge variant="outline">{planoLabels[t.plano] ?? t.plano}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
