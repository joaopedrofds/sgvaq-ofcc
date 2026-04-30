import { createClient } from '@/lib/supabase/server'
import { ComprovanteReview } from '@/components/senhas/comprovante-review'
import { TransacaoTable } from '@/components/financeiro/TransacaoTable'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileDown, DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatBRL(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(centavos / 100)
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { evento_id?: string; page?: string }
}) {
  const supabase = await createClient()

  // Comprovantes pendentes (always shown)
  const { data: pendentes } = await supabase
    .from('senhas')
    .select('*, competidores(nome, whatsapp), modalidades(nome, eventos(nome))')
    .eq('canal', 'online')
    .eq('comprovante_status', 'pendente')
    .order('created_at')

  const eventoId = searchParams.evento_id
  const page = Number(searchParams.page ?? 0)

  let transacoes: any[] = []
  let count = 0
  let resumo = { totalBruto: 0, totalTaxaSgvaq: 0, quantidadeVendas: 0, quantidadeCancelamentos: 0 }

  if (eventoId) {
    const { data: txData, count: txCount } = await supabase
      .from('financeiro_transacoes')
      .select('*', { count: 'exact' })
      .eq('evento_id' as any, eventoId)
      .order('created_at', { ascending: false })
      .range(page * 50, page * 50 + 49)

    transacoes = txData ?? []
    count = txCount ?? 0
    resumo = {
      totalBruto: transacoes.reduce((a: number, t: any) => a + t.valor, 0),
      totalTaxaSgvaq: transacoes.reduce((a: number, t: any) => a + (t.taxa_sgvaq ?? 0), 0),
      quantidadeVendas: transacoes.filter((t: any) => t.tipo === 'venda').length,
      quantidadeCancelamentos: transacoes.filter((t: any) => t.tipo === 'cancelamento').length,
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight font-serif">Financeiro</h1>
      </div>

      {/* Comprovantes pendentes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-amber-500 rounded-full" />
          <h2 className="text-xl font-bold text-white font-serif">Aprovações Pendentes</h2>
        </div>
        {!pendentes?.length ? (
          <div className="flex flex-col items-center justify-center py-10 bg-[#130E0B] border border-[#2d2218] rounded-2xl">
            <Receipt className="w-10 h-10 text-stone-600 mb-3" />
            <p className="text-stone-400 font-medium">Nenhum comprovante pendente no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendentes.map(s => <ComprovanteReview key={s.id} senha={s} />)}
          </div>
        )}
      </section>

      {/* Transações */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-orange-600 rounded-full" />
            <h2 className="text-xl font-bold text-white font-serif">Movimentações</h2>
          </div>
          {eventoId && (
            <Link href={`/financeiro/relatorio?evento_id=${eventoId}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border bg-[#1A1410] border-[#2d2218] text-amber-500 hover:text-amber-400 hover:bg-[#201813]">
              <FileDown className="w-4 h-4 mr-1.5" /> Relatório PDF
            </Link>
          )}
        </div>

        {!eventoId ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[#130E0B] border border-[#2d2218] rounded-3xl">
            <DollarSign className="w-12 h-12 text-stone-600 mb-4" />
            <h3 className="text-stone-300 font-bold mb-1">Cofre de Eventos</h3>
            <p className="text-stone-500 text-sm max-w-sm text-center">
              Acesse pelo fluxo de um evento específico (via URL `?evento_id=`) para ver o relatório de transações.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#130E0B] border border-[#2d2218] p-5 rounded-2xl relative overflow-hidden group hover:border-[#382b20] transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-16 h-16 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-stone-400">Receita Bruta</p>
                <p className="text-3xl font-black text-white mt-1 font-serif tracking-tight">{formatBRL(resumo.totalBruto)}</p>
              </div>
              
              <div className="bg-[#130E0B] border border-[#2d2218] p-5 rounded-2xl relative overflow-hidden group hover:border-[#382b20] transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-16 h-16 text-orange-500" />
                </div>
                <p className="text-sm font-medium text-stone-400">Taxa SGVAQ</p>
                <p className="text-3xl font-black text-stone-300 mt-1 font-serif tracking-tight">{formatBRL(resumo.totalTaxaSgvaq)}</p>
              </div>
              
              <div className="bg-[#130E0B] border border-[#2d2218] p-5 rounded-2xl relative overflow-hidden group hover:border-[#382b20] transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Receipt className="w-16 h-16 text-white" />
                </div>
                <p className="text-sm font-medium text-stone-400">Vendas (Qtd)</p>
                <p className="text-3xl font-black text-white mt-1 font-serif tracking-tight">{resumo.quantidadeVendas}</p>
              </div>

              <div className="bg-[#130E0B] border border-red-900/30 p-5 rounded-2xl relative overflow-hidden group hover:border-red-900/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 flex">
                  <TrendingDown className="w-16 h-16 text-red-500" />
                </div>
                <p className="text-sm font-medium text-red-400/80">Cancelamentos</p>
                <p className="text-3xl font-black text-red-500 mt-1 font-serif tracking-tight">{resumo.quantidadeCancelamentos}</p>
              </div>
            </div>

            {/* Table wrapper */}
            <div className="bg-[#1A1410] border border-[#2d2218] rounded-2xl overflow-hidden shadow-xl">
              <TransacaoTable
                transacoes={transacoes}
                total={count}
                page={page}
                pageSize={50}
                onPageChange={() => {}}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

