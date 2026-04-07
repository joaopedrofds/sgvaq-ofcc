'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { CriterioPontuacao } from '@/actions/criterios'

interface Props {
  tipoProva: 'vaquejada' | 'tambor'
  defaultValues?: Partial<CriterioPontuacao>
  onSubmit: (data: Omit<CriterioPontuacao, 'id'>) => Promise<{ error?: string }>
  onCancel?: () => void
  submitLabel?: string
}

export function CriterioForm({ tipoProva, defaultValues, onSubmit, onCancel, submitLabel = 'Salvar' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const data = {
      tipo_prova: tipoProva,
      nome_criterio: String(fd.get('nome_criterio') ?? '').trim(),
      peso: parseFloat(String(fd.get('peso') ?? '1')),
      valor_minimo: parseFloat(String(fd.get('valor_minimo') ?? '0')),
      valor_maximo: parseFloat(String(fd.get('valor_maximo') ?? '10')),
      descricao: String(fd.get('descricao') ?? '').trim() || null,
      ordem: defaultValues?.ordem ?? 0,
    }

    setLoading(true)
    const result = await onSubmit(data as Omit<CriterioPontuacao, 'id'>)
    setLoading(false)

    if (result.error) setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="nome_criterio">Nome do critério</Label>
          <Input
            id="nome_criterio"
            name="nome_criterio"
            defaultValue={defaultValues?.nome_criterio ?? ''}
            placeholder="Ex: Derrubada"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="peso">Peso</Label>
          <Input
            id="peso"
            name="peso"
            type="number"
            step="0.01"
            min="0.01"
            max="10"
            defaultValue={defaultValues?.peso ?? 1}
            required
          />
          <p className="text-xs text-gray-400">Multiplicador da pontuação (ex: 2.0)</p>
        </div>

        <div className="space-y-1.5">
          <Label>Faixa de valores</Label>
          <div className="flex items-center gap-2">
            <Input
              name="valor_minimo"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.valor_minimo ?? 0}
              placeholder="Mín"
              className="w-24"
              required
            />
            <span className="text-gray-400 text-sm">até</span>
            <Input
              name="valor_maximo"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.valor_maximo ?? 10}
              placeholder="Máx"
              className="w-24"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="descricao">Descrição <span className="text-gray-400">(opcional)</span></Label>
          <Input
            id="descricao"
            name="descricao"
            defaultValue={defaultValues?.descricao ?? ''}
            placeholder="Explique o que este critério avalia…"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
