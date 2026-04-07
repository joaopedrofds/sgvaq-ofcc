'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/get-session'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'
import { mockFila, mockSenhas } from '@/lib/mock/data'

const qrSchema = z.object({
  senha_id: z.string().min(1),
  tenant_id: z.string().min(1),
})

export function parseQRCode(raw: string): { senha_id: string; tenant_id: string } | null {
  try {
    const result = qrSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export async function fazerCheckin(senhaId: string, tenantIdQR: string) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    return { success: true, competidor: 'Competidor Mock' }
  }
  const session = await getSession()
  requireRole(session, ['financeiro', 'organizador'])

  // Valida que o tenant do QR bate com o tenant do usuário
  if (session!.tenantId !== tenantIdQR) {
    return { error: 'QR Code não pertence a este evento' }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  // Busca a senha filtrando também pelo tenant_id — não confia só no QR
  const { data: senha } = await supabase
    .from('senhas')
    .select('status, modalidade_id, tenant_id, competidores(nome)')
    .eq('id', senhaId)
    .eq('tenant_id', session!.tenantId!)
    .single()

  if (!senha) return { error: 'Senha não encontrada neste evento' }
  if (senha.status === 'cancelada') return { error: 'Senha cancelada' }
  if (senha.status === 'checkin_feito') return { error: 'Check-in já realizado para esta senha' }
  if (senha.status === 'pendente') return { error: 'Senha pendente de aprovação' }

  const { error: updateError } = await supabase
    .from('senhas')
    .update({ status: 'checkin_feito' })
    .eq('id', senhaId)
    .eq('status', 'ativa') // otimista: só faz checkin se ainda estiver ativa

  if (updateError) return { error: updateError.message }

  const { error: filaError } = await admin.rpc('assign_fila_posicao', {
    p_modalidade_id: senha.modalidade_id,
    p_senha_id: senhaId,
  })

  if (filaError) return { error: filaError.message }

  revalidatePath('/eventos')
  return {
    success: true,
    competidor: (senha.competidores as any)?.nome,
  }
}

export async function checkinManual(numeroSenha: number, modalidadeId: string) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    return { success: true, competidor: 'Competidor Mock' }
  }
  // Auth primeiro — antes de qualquer query
  const session = await getSession()
  requireRole(session, ['financeiro', 'organizador'])


  const supabase = await createClient()

  // Filtra pelo tenant da sessão — previne acesso cross-tenant
  const { data: senha } = await supabase
    .from('senhas')
    .select('id, tenant_id')
    .eq('numero_senha', numeroSenha)
    .eq('modalidade_id', modalidadeId)
    .eq('tenant_id', session!.tenantId!)
    .eq('status', 'ativa')
    .single()

  if (!senha) return { error: 'Senha não encontrada ou já usada' }

  return fazerCheckin(senha.id, session!.tenantId!)
}

export async function getFila(modalidadeId: string) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    const data = mockFila.filter(f => f.modalidade_id === modalidadeId)
    return { data }
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fila_entrada')
    .select('*, senhas(numero_senha, competidores(nome, whatsapp))')
    .eq('modalidade_id', modalidadeId)
    .order('ordem_atual')

  if (error) return { error: error.message }
  return { data }
}

export async function avancarFila(filaId: string, novoStatus: 'chamado' | 'passou' | 'ausente') {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') return { success: true }
  const session = await getSession()
  requireRole(session, ['financeiro', 'organizador'])

  const supabase = await createClient()
  const updates: Record<string, any> = { status: novoStatus }

  if (novoStatus === 'chamado') updates.hora_chamada = new Date().toISOString()
  if (novoStatus === 'passou') updates.hora_entrada = new Date().toISOString()
  if (novoStatus === 'ausente') updates.hora_ausencia = new Date().toISOString()

  const { error } = await supabase
    .from('fila_entrada')
    .update(updates)
    .eq('id', filaId)

  if (error) return { error: error.message }
  revalidatePath('/eventos')
  return { success: true }
}
