'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // For demonstration, if no DB configured or user wants to see frontend easily:
    if (email === 'demo@sgvaq.com' && password === 'demo123') {
       document.cookie = "demo_bypass=true; path=/";
       setTimeout(() => {
         router.push('/dashboard')
       }, 800)
       return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciais inválidas. Tente "demo@sgvaq.com" com senha "demo123" para testar o painel visual.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
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
        <Label htmlFor="email" className="text-zinc-300">E-mail Corporativo</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="voce@organizadora.com.br"
          required
          autoComplete="email"
          className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500 h-11"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-zinc-300">Senha Segura</Label>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando no cofre...
          </>
        ) : (
          'Acessar Painel SGVAQ'
        )}
      </Button>
    </form>
  )
}
