'use client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { FinanceiroTransacao } from '@/actions/financeiro'

function formatBRL(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(centavos / 100)
}

interface Props {
  transacoes: FinanceiroTransacao[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function TransacaoTable({ transacoes, total, page, pageSize, onPageChange }: Props) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader className="bg-[#130E0B] border-b border-[#2d2218]">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-stone-400 font-semibold h-12">Data/Hora</TableHead>
            <TableHead className="text-stone-400 font-semibold h-12">Tipo</TableHead>
            <TableHead className="text-stone-400 font-semibold h-12">Descrição</TableHead>
            <TableHead className="text-right text-stone-400 font-semibold h-12">Valor</TableHead>
            <TableHead className="text-right text-stone-400 font-semibold h-12">Taxa SGVAQ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transacoes.length === 0 && (
            <TableRow className="border-none hover:bg-transparent">
              <TableCell colSpan={5} className="text-center text-stone-500 py-12">
                Nenhuma transação registrada
              </TableCell>
            </TableRow>
          )}
          {transacoes.map(t => (
            <TableRow key={t.id} className={`border-b border-[#2d2218] hover:bg-[#201813] transition-colors ${t.tipo === 'cancelamento' ? 'opacity-60' : ''}`}>
              <TableCell className="text-sm text-stone-300">
                {new Date(t.created_at).toLocaleString('pt-BR')}
              </TableCell>
              <TableCell>
                <div className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  t.tipo === 'cancelamento' ? 'bg-red-950/50 text-red-500 border border-red-900/50' : 'bg-emerald-950/50 text-emerald-500 border border-emerald-900/50'
                }`}>
                  {t.tipo === 'cancelamento' ? 'Cancelamento' : 'Venda'}
                </div>
              </TableCell>
              <TableCell className="text-sm text-stone-400">{t.descricao ?? '—'}</TableCell>
              <TableCell className={`text-right font-mono ${t.valor < 0 ? 'text-red-400' : 'text-stone-200'}`}>
                {formatBRL(t.valor)}
              </TableCell>
              <TableCell className={`text-right font-mono text-sm ${t.taxa_sgvaq < 0 ? 'text-red-500/70' : 'text-orange-500'}`}>
                {formatBRL(t.taxa_sgvaq)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 pb-4">
          <span className="text-sm text-stone-500">
            {total} transações — página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-[#130E0B] border-[#2d2218] text-stone-300 hover:text-white hover:bg-[#201813]" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" className="bg-[#130E0B] border-[#2d2218] text-stone-300 hover:text-white hover:bg-[#201813]" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

