import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'
import { Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen w-full flex bg-black">
      {/* Left side - Visual/Brand */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden bg-stone-950 border-r border-white/5">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-20%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
          
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 w-max">
            <Trophy className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold tracking-tighter text-white">SGVAQ</span>
          </Link>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium text-white leading-snug">
              &ldquo;A gestão eficiente de uma vaquejada não é um luxo, é a garantia de respeito aos competidores e lucro para a organizadora.&rdquo;
            </p>
            <footer className="text-sm text-stone-400">
              Ambiente de Sistema Profissional
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-[400px] flex flex-col items-center lg:items-start">
          <Link href="/" className="flex items-center gap-2 mb-12 lg:hidden">
            <Trophy className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold tracking-tighter text-white">SGVAQ</span>
          </Link>

          <div className="w-full text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo(a) de volta</h1>
            <p className="text-stone-400">Insira suas credenciais para acessar o painel.</p>
          </div>
          
          <div className="w-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
            <LoginForm />
          </div>
          
          <p className="mt-8 text-center lg:text-left text-sm text-stone-400 w-full">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="text-amber-500 font-medium hover:text-amber-400 hover:underline">
              Cadastrar Organizadora
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
