'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CriterioForm } from './criterio-form'
import { atualizarCriterio, excluirCriterio, criarCriterio, reordenarCriterios } from '@/actions/criterios'
import type { CriterioPontuacao } from '@/actions/criterios'
import { Pencil, Trash2, Plus, GripVertical, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'

interface Props {
  tipoProva: 'vaquejada' | 'tambor'
  criterios: CriterioPontuacao[]
}

export function CriteriosList({ tipoProva, criterios: initial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleUpdate(id: string, data: Omit<CriterioPontuacao, 'id'>) {
    const result = await atualizarCriterio(id, data)
    if (!result.error) {
      setEditingId(null)
      refresh()
    }
    return result
  }

  async function handleCreate(data: Omit<CriterioPontuacao, 'id'>) {
    const result = await criarCriterio(data)
    if (!result.error) {
      setShowNew(false)
      refresh()
    }
    return { error: result.error }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este critério? Passadas existentes não serão afetadas.')) return
    setDeletingId(id)
    await excluirCriterio(id)
    setDeletingId(null)
    refresh()
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const idx = initial.findIndex(c => c.id === id)
    if (idx < 0) return
    const newOrder = [...initial.map(c => c.id)]
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= newOrder.length) return
    ;[newOrder[idx], newOrder[swap]] = [newOrder[swap], newOrder[idx]]
    await reordenarCriterios(newOrder)
    refresh()
  }

  return (
    <div className="space-y-2">
      {initial.length === 0 && !showNew && (
        <p className="text-sm text-gray-400 py-4 text-center">Nenhum critério cadastrado para {tipoProva}.</p>
      )}

      {initial.map((c, idx) => (
        <Card key={c.id} className="overflow-hidden">
          <CardContent className="p-0">
            {editingId === c.id ? (
              <div className="p-4">
                <CriterioForm
                  tipoProva={tipoProva}
                  defaultValues={c}
                  onSubmit={(data) => handleUpdate(c.id, data)}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Salvar alterações"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => handleMove(c.id, 'up')}
                    disabled={idx === 0 || isPending}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(c.id, 'down')}
                    disabled={idx === initial.length - 1 || isPending}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{c.nome_criterio}</span>
                    <Badge variant="outline" className="text-xs">peso {c.peso}×</Badge>
                    <span className="text-xs text-gray-400">{c.valor_minimo}–{c.valor_maximo}</span>
                  </div>
                  {c.descricao && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.descricao}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingId(c.id)}
                    disabled={isPending}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id || isPending}
                  >
                    {deletingId === c.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {showNew ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Novo critério — {tipoProva}</p>
            <CriterioForm
              tipoProva={tipoProva}
              onSubmit={handleCreate}
              onCancel={() => setShowNew(false)}
              submitLabel="Adicionar"
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNew(true)}
          className="w-full border-dashed"
          disabled={isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar critério
        </Button>
      )}
    </div>
  )
}
