import { getEquipe } from '@/actions/equipe'
import { ConviteForm } from '@/components/equipe/convite-form'
import { Shield, Mail, UserX, UserCheck } from 'lucide-react'

const roleLabels: Record<string, string> = {
  organizador: 'Fundador/Organizador',
  financeiro: 'Analista Financeiro',
  juiz: 'Juiz de Pista',
  locutor: 'Locutor Oficial',
}

const roleColors: Record<string, string> = {
  organizador: 'bg-amber-500/10 text-amber-500 border border-amber-500/30',
  financeiro: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  juiz: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  locutor: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
}

export default async function EquipePage() {
  const result = await getEquipe()

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestão de Autonomia</h1>
          <p className="text-stone-400 text-sm mt-1">Controle quem pode acessar, faturar ou julgar no seu sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LISTA DE MEMBROS */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Membros Adicionados</h2>
          
          <div className="space-y-3">
            {result.data?.map(u => (
              <div key={u.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-2xl p-5 transition-all shadow-xl">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-12 h-12 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center flex-shrink-0">
                    {u.ativo ? <UserCheck className="w-5 h-5 text-stone-500 group-hover:text-amber-500 transition-colors" /> : <UserX className="w-5 h-5 text-rose-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-white tracking-wide">{u.nome}</p>
                    <div className="flex items-center gap-2 text-sm text-stone-500 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {u.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${roleColors[u.role] ?? 'bg-stone-800 text-stone-300'}`}>
                    {roleLabels[u.role] ?? u.role}
                  </span>
                  {!u.ativo && (
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {result.data?.length === 0 && (
              <div className="p-8 text-center bg-stone-900/50 border border-dashed border-stone-800 rounded-3xl">
                <Shield className="w-12 h-12 text-stone-600 mx-auto mb-4 opacity-50" />
                <p className="text-stone-400">Nenhum membro convidado ainda. Sua equipe terá acesso exclusivo aos privilégios atribuídos.</p>
              </div>
            )}
          </div>
        </div>

        {/* FORMS */}
        <div className="lg:col-span-4">
          <div className="bg-stone-900/50 backdrop-blur-xl border border-stone-800 rounded-3xl p-6 shadow-2xl sticky top-8">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-800">
                <h2 className="text-lg font-bold text-white">Convite Estratégico</h2>
             </div>
             
             <ConviteForm />
             
             <div className="mt-8 pt-6 border-t border-stone-800/50 text-xs text-stone-500 leading-relaxed">
               <strong className="text-amber-500/80 block mb-1">Nota de Segurança:</strong>
               Membros adicionados como "Financeiro" e "Organizador" têm acesso ao fluxo de caixa total. Juízes têm poder restrito apenas para medição de pontos na pista.
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
