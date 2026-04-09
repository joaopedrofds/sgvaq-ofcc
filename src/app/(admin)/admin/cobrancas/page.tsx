import { listarCobrancas } from '@/actions/cobrancas'
import { CobrancaStatusBadge } from '@/components/financeiro/CobrancaStatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

function formatBRL(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(centavos / 100)
}

export default async function CobrancasPage() {
  const cobrancas = await listarCobrancas()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cobranças SGVAQ</h1>
      <div className="space-y-3">
        {cobrancas.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Nenhuma cobrança registrada.</p>
        )}
        {cobrancas.map(c => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{(c.tenant as any)?.nome ?? c.tenant_id}</p>
                <p className="text-sm text-muted-foreground">{c.mes_referencia}</p>
              </div>
              <div className="flex items-center gap-4">
                <CobrancaStatusBadge status={c.status as any} />
                <p className="font-bold text-lg">{formatBRL(c.total_vendas)}</p>
                <Link
                  href={`/admin/cobrancas/${c.id}`}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-7 px-2.5 border border-border bg-background hover:bg-muted transition-colors"
                >
                  Detalhes
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
