'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/get-session'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

export interface CriterioPontuacao {
  id: string
  tipo_prova: 'vaquejada' | 'tambor'
  nome_criterio: string
  peso: number
  valor_minimo: number
  valor_maximo: number
  descricao: string | null
  ordem: number
}

const criterioSchema = z.object({
  tipo_prova: z.enum(['vaquejada', 'tambor']),
  nome_criterio: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(80),
  peso: z.number().positive('Peso deve ser positivo').max(10),
  valor_minimo: z.number().min(0),
  valor_maximo: z.number().min(0),
  descricao: z.string().max(255).optional(),
  ordem: z.number().int().min(0).optional(),
}).refine(d => d.valor_maximo >= d.valor_minimo, {
  message: 'Valor máximo deve ser maior ou igual ao mínimo',
  path: ['valor_maximo'],
})

export async function listarCriterios(): Promise<CriterioPontuacao[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('criterios_pontuacao')
    .select('*')
    .order('tipo_prova')
    .order('ordem')
  if (error) throw new Error(error.message)
  return data as CriterioPontuacao[]
}

export async function criarCriterio(input: unknown): Promise<{ data?: CriterioPontuacao; error?: string }> {
  const session = await getSession()
  requireRole(session, ['organizador']) // super_admin tem role organizador no JWT ou ajustar conforme necessário

  const parsed = criterioSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Calcula próxima ordem para o tipo_prova
  const supabase = await createClient()
  const { data: existentes } = await supabase
    .from('criterios_pontuacao')
    .select('ordem')
    .eq('tipo_prova', parsed.data.tipo_prova)
    .order('ordem', { ascending: false })
    .limit(1)

  const proximaOrdem = parsed.data.ordem ?? ((existentes?.[0]?.ordem ?? 0) + 1)

  const { data, error } = await supabase
    .from('criterios_pontuacao')
    .insert({ ...parsed.data, ordem: proximaOrdem })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/configuracoes/criterios')
  return { data: data as CriterioPontuacao }
}

export async function atualizarCriterio(
  id: string,
  input: unknown
): Promise<{ error?: string }> {
  const session = await getSession()
  requireRole(session, ['organizador'])

  const parsed = criterioSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('criterios_pontuacao')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/configuracoes/criterios')
  return {}
}

export async function excluirCriterio(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  requireRole(session, ['organizador'])

  const supabase = await createClient()
  const { error } = await (supabase
    .from('criterios_pontuacao')
    .delete()
    .eq('id', id) as any)

  if (error) return { error: error.message }
  revalidatePath('/admin/configuracoes/criterios')
  return {}
}

export async function reordenarCriterios(
  ids: string[] // ordem desejada, do primeiro ao último
): Promise<{ error?: string }> {
  const session = await getSession()
  requireRole(session, ['organizador'])

  const supabase = await createClient()
  const updates = ids.map((id, idx) =>
    supabase.from('criterios_pontuacao').update({ ordem: idx + 1 }).eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/admin/configuracoes/criterios')
  return {}
}
