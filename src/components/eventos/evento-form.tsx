'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { eventoSchema } from '@/lib/eventos/schema'
import { createEvento, updateEvento } from '@/actions/eventos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FormData = z.infer<typeof eventoSchema>

interface EventoFormProps {
  eventoId?: string
  defaultValues?: Partial<FormData>
}

export function EventoForm({ eventoId, defaultValues }: EventoFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(eventoSchema as any),
    defaultValues,
  })
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(data: FormData) {
    setLoading(true)
    setServerError(null)
    const result = eventoId
      ? await updateEvento(eventoId, data)
      : await createEvento(data)

    if ('error' in result) {
      setServerError(result.error ?? 'Erro desconhecido')
      setLoading(false)
      return
    }
    router.push('/eventos')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-stone-400">Nome do evento</Label>
        <Input {...register('nome')} placeholder="Ex: 3ª Grande Vaquejada Parque Show" className="bg-stone-950/50 border-stone-800 text-white focus-visible:ring-amber-500" />
        {errors.nome && <p className="text-xs text-rose-500 font-medium mt-1">{errors.nome.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-stone-400">Tipo da Competição</Label>
        <Select onValueChange={v => setValue('tipo', v as 'vaquejada' | 'tambor')}
          defaultValue={defaultValues?.tipo}>
          <SelectTrigger className="bg-stone-950/50 border-stone-800 text-white focus:ring-amber-500">
            <SelectValue placeholder="Selecione a modalidade base" />
          </SelectTrigger>
          <SelectContent className="bg-stone-900 border-stone-800 text-stone-100">
            <SelectItem value="vaquejada" className="focus:bg-stone-800 focus:text-white">Vaquejada</SelectItem>
            <SelectItem value="tambor" className="focus:bg-stone-800 focus:text-white">Prova de Tambor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-stone-400">Data de Início</Label>
          <Input type="date" {...register('data_inicio')} className="bg-stone-950/50 border-stone-800 text-white color-scheme-dark focus-visible:ring-amber-500" />
          {errors.data_inicio && <p className="text-xs text-rose-500 font-medium mt-1">{errors.data_inicio.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-stone-400">Data de Encerramento</Label>
          <Input type="date" {...register('data_fim')} className="bg-stone-950/50 border-stone-800 text-white color-scheme-dark focus-visible:ring-amber-500" />
          {errors.data_fim && <p className="text-xs text-rose-500 font-medium mt-1">{errors.data_fim.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-stone-400">Cidade Base</Label>
          <Input {...register('cidade')} placeholder="Ex: Campina Grande" className="bg-stone-950/50 border-stone-800 text-white focus-visible:ring-amber-500" />
        </div>
        <div className="space-y-2">
          <Label className="text-stone-400">Estado (UF)</Label>
          <Input {...register('estado')} maxLength={2} placeholder="Ex: PB" className="bg-stone-950/50 border-stone-800 text-white uppercase focus-visible:ring-amber-500" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-stone-400">Nome do Local (Opcional)</Label>
        <Input {...register('local')} placeholder="Ex: Parque de Vaquejada Haras Brasil" className="bg-stone-950/50 border-stone-800 text-white focus-visible:ring-amber-500" />
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          {serverError}
        </div>
      )}

      <div className="pt-4 border-t border-stone-800">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Processando dados...' : eventoId ? 'Salvar Alterações' : 'Criar Evento no Sistema'}
        </Button>
      </div>
    </form>
  )
}
