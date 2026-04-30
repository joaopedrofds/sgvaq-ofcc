'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function CadastroForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Demo Mode fallback for frontend demonstration
    if (email.includes('demo')) {
      setTimeout(() => {
        setSuccess(true)
        setLoading(false)
        setTimeout(() => router.push('/login'), 2000)
      }, 1000)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: nome, role: 'organizer' }
      }
    })
    
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    
    setSuccess(true)
    setLoading(false)
    
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center text-white">
        <div className="h-16 w-16 bg-amber-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold">Inscrição Solicitada!</h3>
        <p className="text-zinc-400 text-sm">
          Acesse a plataforma ou verifique seu e-mail para validar seu acesso ao SGVAQ.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 leading-tight">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-zinc-300">Nome da Organizadora / Haras</Label>
        <Input
          id="nome"
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Ex: Parque Rufina Borba"
          required
          className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500 h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-zinc-300">E-mail Setor Financeiro/Admin</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="contato@parque.com.br"
          required
          autoComplete="email"
          className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500 h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-300">Senha Segura</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500 h-11"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold h-11 mt-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
          </>
        ) : (
          'Solicitar Acesso Completo'
        )}
      </Button>
    </form>
  )
}
