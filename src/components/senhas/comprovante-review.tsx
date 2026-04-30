'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { aprovarComprovante, rejeitarComprovante, getComprovanteUrl } from '@/actions/comprovantes'
import { useRouter } from 'next/navigation'

export function ComprovanteReview({ senha }: { senha: any }) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleVerComprovante() {
    const res = await getComprovanteUrl(senha.id)
    if (res.url) window.open(res.url, '_blank')
  }

  async function handleAprovar() {
    setLoading(true)
    await aprovarComprovante(senha.id)
    router.refresh()
  }

  async function handleRejeitar() {
    if (!motivo.trim()) { alert('Informe o motivo da rejeição'); return }
    setLoading(true)
    await rejeitarComprovante(senha.id, motivo)
    router.refresh()
  }

  return (
    <div className="bg-[#1A1410] border border-[#2d2218] rounded-2xl p-5 space-y-4 shadow-lg hover:border-[#382b20] transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-stone-100 text-lg">{senha.competidores?.nome}</p>
          <div className="flex items-center gap-2 mt-1 mb-2">
            <span className="px-2 py-0.5 rounded bg-orange-950/40 text-orange-400 text-xs font-bold uppercase tracking-wider border border-orange-900/30">
              {senha.modalidades?.eventos?.nome}
            </span>
            <span className="text-stone-500 text-xs font-medium">
              {senha.modalidades?.nome}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Enviado em {new Date(senha.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleVerComprovante} className="bg-[#201813] border-[#2d2218] text-stone-300 hover:text-white hover:bg-[#2d2218]">
          Ver comprovante
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap sm:flex-nowrap pt-2 border-t border-[#2d2218]/50">
        <Button onClick={handleAprovar} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold w-full sm:w-auto">
          Aprovar
        </Button>
        <div className="flex-1 flex gap-2 w-full sm:w-auto">
          <Input
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Motivo da rejeição..."
            className="text-sm bg-[#130E0B] border-[#2d2218] text-stone-300 placeholder:text-stone-600 focus-visible:ring-orange-500/30"
          />
          <Button onClick={handleRejeitar} disabled={loading} size="sm" variant="destructive" className="bg-red-900/80 hover:bg-red-800 text-red-100">
            Rejeitar
          </Button>
        </div>
      </div>
    </div>
  )
}

