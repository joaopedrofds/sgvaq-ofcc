import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/get-session'
import { requireRole } from '@/lib/auth/require-role'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface Conflito {
  competidor_nome: string
  cpf: string
  modalidades: { nome: string; evento_nome: string; data_inicio: string }[]
}

export default async function ConflitosPage() {
  const session = await getSession()
  requireRole(session, ['organizador'])

  const supabase = await createClient()

  const { data: senhas } = await supabase
    .from('senhas')
    .select(`
      competidor_id,
      competidores(nome, cpf),
      modalidades(nome, eventos(nome, data_inicio, data_fim, status))
    `)
    .eq('status', 'ativa')
    .not('modalidades.eventos.status', 'eq', 'cancelado')

  const porCompetidor = new Map<string, Conflito>()

  for (const s of senhas ?? []) {
    const comp = s.competidores as any
    const mod = s.modalidades as any
    const ev = mod?.eventos

    if (!comp || !mod || !ev) continue

    const key = s.competidor_id
    if (!porCompetidor.has(key)) {
      porCompetidor.set(key, {
        competidor_nome: comp.nome,
        cpf: comp.cpf,
        modalidades: [],
      })
    }

    porCompetidor.get(key)!.modalidades.push({
      nome: mod.nome,
      evento_nome: ev.nome,
      data_inicio: ev.data_inicio,
    })
  }

  const conflitos: Conflito[] = []
  for (const [, c] of porCompetidor) {
    if (c.modalidades.length > 1) conflitos.push(c)
  }

  conflitos.sort((a, b) => b.modalidades.length - a.modalidades.length)

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Análise de Malha</h1>
          <p className="text-stone-400 text-sm mt-1">
            Mapeamento automático de sobreposição de senhas (competidores inscritos em múltiplas baterias/eventos).
          </p>
        </div>
      </div>

      {conflitos.length === 0 ? (
        <div className="p-12 text-center bg-stone-900 border border-emerald-500/20 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.05)]">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-2">Malha Sistêmica Limpa</h2>
          <p className="text-stone-400 max-w-md mx-auto">
            A inteligência do SGVAQ detectou taxa zero de conflitos de horário. Todos os atletas farão suas senhas sequencialmente sem choques.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
            <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center shrink-0">
               <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>
             <div>
                <h3 className="font-bold text-rose-500 text-lg">Alerta Operacional</h3>
                <p className="text-sm">Encontramos <strong className="text-white">{conflitos.length} competidor{conflitos.length > 1 ? 'es' : ''}</strong> com risco de sobreposição de batidas na pista de prova.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {conflitos.map(c => (
              <div key={c.cpf} className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl group">
                <div className="p-6 border-b border-stone-800/50 flex flex-col items-start gap-1">
                   <div className="flex items-center justify-between w-full mb-3">
                     <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold tracking-widest uppercase">
                       {c.modalidades.length} Entradas
                     </span>
                     <span className="text-xs font-mono text-stone-500">
                       CPF {c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                     </span>
                   </div>
                   <h4 className="text-xl font-bold text-white">{c.competidor_nome}</h4>
                </div>
                
                <div className="p-2 space-y-1 bg-stone-950/50">
                  {c.modalidades.map((m, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-stone-900/50 rounded-2xl border border-stone-800/40 hover:bg-stone-800 transition-colors">
                      <div>
                        <p className="font-bold text-stone-200">{m.nome}</p>
                        <p className="text-sm text-stone-500">{m.evento_nome}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-amber-500/80 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10">
                         <Clock className="w-3.5 h-3.5" />
                         {new Date(m.data_inicio).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
