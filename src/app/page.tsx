import Link from 'next/link'
import { ArrowRight, Trophy, Calendar, Users, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black overflow-hidden selection:bg-amber-500/30">
      
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <header className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <span className="text-xl font-bold tracking-tighter text-white">SGVAQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-stone-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link 
              href="/cadastro" 
              className="px-4 py-2 text-sm font-medium text-black bg-amber-500 hover:bg-amber-400 rounded-full transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              Começar Agora
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center max-w-5xl mx-auto min-h-[70vh]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-medium mb-8 uppercase tracking-wider backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            A Revolução na Vaquejada
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
            Gestão Profissional para <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
              Vaquejadas de Alto Nível
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-stone-400 max-w-2xl mb-12 leading-relaxed">
            O primeiro sistema de gestão end-to-end do Brasil desenhado exclusivamente para organizadores rigorosos. Do caixa ao telão com precisão absoluta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link
              href="/cadastro"
              className="flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-amber-500 text-black hover:bg-amber-400 hover:-translate-y-1 transition-all shadow-[0_0_30px_rgba(245,158,11,0.25)]"
            >
              Cadastrar Organizadora <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center px-8 py-4 rounded-full text-base font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:-translate-y-1 transition-all backdrop-blur-sm"
            >
              Já tenho uma conta
            </Link>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-20 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-500/50 transition-colors">
              <Calendar className="h-8 w-8 text-amber-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Gestão de Bate-Senha</h3>
              <p className="text-stone-400">Automatize o sorteio e fluxo das senhas com precisão cirúrgica e transparência total para os locutores e competidores.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-500/50 transition-colors">
              <Users className="h-8 w-8 text-amber-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Painel de Competidores</h3>
              <p className="text-stone-400">Tenha um cadastro rico dos atletas, cavalos e equipes com histórico de pontuação em tempo real ao longo do campeonato.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-amber-500/50 transition-colors">
              <TrendingUp className="h-8 w-8 text-amber-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Auditoria Visual (Telão)</h3>
              <p className="text-stone-400">Transmissão profissional dos resultados instantâneos, conflitos e julgamentos direto para as telas da sua arena.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
