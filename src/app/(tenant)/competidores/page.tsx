import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/get-session'
import { requireRole } from '@/lib/auth/require-role'
import { mockCompetidores } from '@/lib/mock/data'
import { Users, Phone, CreditCard, Search, X } from 'lucide-react'

function formatCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return phone
}

export default async function CompetidoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams;
  const session = await getSession()
  requireRole(session, ['organizador', 'financeiro'])

  const q = params.q?.trim() ?? ''
  const page = Math.max(0, Number(params.page ?? 0))
  const PAGE_SIZE = 50

  let competidores: any[] = []
  let total = 0

  const isMock = true

  if (isMock) {
    // Deduplica por id para evitar registros repetidos de hot-reload
    const unique = mockCompetidores.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
    let filtered = [...unique]
    if (q) {
      const cpfClean = q.replace(/\D/g, '')
      const term = q.toLowerCase()
      filtered = filtered.filter(c =>
        c.nome.toLowerCase().includes(term) ||
        c.cpf.includes(cpfClean)
      )
    }
    filtered.sort((a, b) => a.nome.localeCompare(b.nome))
    total = filtered.length
    competidores = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  } else {
    const supabase = await createClient()
    let query = supabase
      .from('competidores')
      .select('id, nome, cpf, whatsapp, created_at', { count: 'exact' })
      .order('nome')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (q) {
      query = query.or(`nome.ilike.%${q}%,cpf.ilike.%${q.replace(/\D/g, '')}%`) as any
    }

    const result = await query
    competidores = result.data ?? []
    total = result.count ?? 0
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Competidores</h1>
          <p className="text-stone-400 text-sm mt-1">Base de dados unificada com {total} atletas registrados na plataforma</p>
        </div>
      </div>

      {/* BUSCA E FILTROS */}
      <form method="GET" className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar competidor por Nome ou CPF..."
          className="flex-1 h-12 bg-stone-900 border border-stone-800 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-stone-600 shadow-inner"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="h-12 px-6 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          >
            Pesquisar
          </button>
          {q && (
            <a
              href="/competidores"
              className="h-12 w-12 flex items-center justify-center bg-stone-900 border border-stone-800 text-stone-400 rounded-xl hover:bg-stone-800 hover:text-white transition-all"
              title="Limpar filtros"
            >
              <X className="w-5 h-5" />
            </a>
          )}
        </div>
      </form>

      {/* GRID DE RESULTADOS */}
      {!competidores?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-stone-800 bg-stone-900/20">
          <div className="w-16 h-16 rounded-full bg-stone-800/50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-stone-500" />
          </div>
          <p className="text-stone-300 font-medium text-lg">{q ? 'Nenhum atleta encontrado com essa busca.' : 'Base de dados vazia.'}</p>
          <p className="text-stone-500 text-sm mt-1 max-w-md">Competidores são registrados automaticamente pelo sistema ao comprarem a primeira senha em qualquer evento seu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competidores.map((c: any) => (
            <div key={c.id} className="group relative flex flex-col p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-[#111] hover:border-amber-500/30 transition-all duration-300 overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity rounded-full -mr-6 -mt-6 pointer-events-none" />
              
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">{c.nome}</h3>
                <span className="text-xs font-mono text-stone-600 bg-stone-950 px-2 py-1 rounded-md border border-stone-800">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-800/50">
                <div className="flex items-center gap-2 text-stone-400 text-sm">
                  <CreditCard className="w-4 h-4 text-emerald-500/80" />
                  <span className="font-medium">{formatCPF(c.cpf)}</span>
                </div>
                {c.whatsapp && (
                  <div className="flex items-center gap-2 text-stone-400 text-sm">
                    <Phone className="w-4 h-4 text-emerald-500/80" />
                    <span className="font-medium">{formatPhone(c.whatsapp)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINAÇÃO */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-6 border-t border-stone-800 text-sm">
          <span className="text-stone-500 font-medium">
            Exibindo {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de <strong className="text-white">{total}</strong>
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <a
                href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
                className="h-10 px-4 flex items-center justify-center bg-stone-900 border border-stone-800 rounded-lg text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
              >
                Anterior
              </a>
            )}
            {(page + 1) * PAGE_SIZE < total && (
              <a
                href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
                className="h-10 px-4 flex items-center justify-center bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                Próxima Página
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
