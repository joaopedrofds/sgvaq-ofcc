'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/get-session'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadComprovante(senhaId: string, file: File) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') return { success: true }
  // Autenticação: apenas o próprio competidor (via flow público) ou operadores
  // A validação de ownership é feita via RLS — o Supabase client usa o cookie do usuário
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Tipo de arquivo não permitido. Use JPG, PNG ou PDF.' }
  }
  if (file.size > MAX_SIZE) {
    return { error: 'Arquivo muito grande. Máximo 5MB.' }
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') ?? 'bin'
  const path = `${senhaId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('comprovantes')
    .upload(path, file, { contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  // Atualiza apenas se a senha ainda estiver em status 'pendente'
  const { error, count } = await supabase
    .from('senhas')
    .update({
      comprovante_url: path,
      comprovante_status: 'pendente',
    })
    .eq('id', senhaId)
    .eq('status', 'pendente') // garante que só senhas ainda pendentes recebem comprovante

  if (error) return { error: error.message }
  if (count === 0) return { error: 'Senha não encontrada ou já processada' }

  return { success: true }
}

export async function getComprovanteUrl(senhaId: string) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    return { url: '/mock/comprovante.pdf' }
  }
  const session = await getSession()
  requireRole(session, ['financeiro', 'organizador'])

  const supabase = await createClient()
  const { data: senha } = await supabase
    .from('senhas')
    .select('comprovante_url')
    .eq('id', senhaId)
    .single()

  if (!senha?.comprovante_url) return { error: 'Sem comprovante' }

  const { data } = await supabase.storage
    .from('comprovantes')
    .createSignedUrl(senha.comprovante_url, 3600)

  return { url: data?.signedUrl }
}

export async function aprovarComprovante(senhaId: string) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') return { success: true }
  const session = await getSession()
  requireRole(session, ['financeiro', 'organizador'])

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: senha } = await supabase
    .from('senhas')
    .select('modalidade_id, valor_pago, competidor_id, comprovante_status, status')
    .eq('id', senhaId)
    .single()

  if (!senha) return { error: 'Senha não encontrada' }
  if (senha.comprovante_status !== 'pendente') return { error: 'Comprovante não está pendente' }
  if (senha.status === 'ativa') return { error: 'Senha já está ativa' }

  // Verifica estoque via RPC atômica — previne double-approval e TOCTOU
  const { data: result, error: rpcErr } = await admin.rpc('aprovar_senha_atomica', {
    p_senha_id: senhaId,
    p_modalidade_id: senha.modalidade_id,
  })

  if (rpcErr) return { error: rpcErr.message }
  if (result?.error) return { error: result.error }

  await supabase.from('financeiro_transacoes').insert({
    tenant_id: session!.tenantId,
    senha_id: senhaId,
    tipo: 'venda',
    valor: senha.valor_pago,
    canal: 'online',
    user_id: session!.id,
  })

  await supabase.from('notificacoes_fila').insert({
    idempotency_key: `comprovante_aprovado:${senhaId}`,
    competidor_id: senha.competidor_id,
    tipo: 'comprovante_aprovado',
    mensagem: 'Seu comprovante foi aprovado! Sua senha está ativa.',
  }).onConflict('idempotency_key').ignore()

  revalidatePath('/financeiro')
  return { success: true }
}

export async function rejeitarComprovante(senhaId: string, motivo: string) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') return { success: true }
  const session = await getSession()
  requireRole(session, ['financeiro', 'organizador'])

  if (!motivo.trim()) return { error: 'Motivo de rejeição é obrigatório' }

  const supabase = await createClient()
  const { data: senha } = await supabase
    .from('senhas')
    .select('competidor_id, comprovante_status')
    .eq('id', senhaId)
    .single()

  if (!senha) return { error: 'Senha não encontrada' }
  if (senha.comprovante_status !== 'pendente') return { error: 'Comprovante não está pendente' }

  // Atualização otimista: só atualiza se comprovante_status ainda for 'pendente'
  const { error, count } = await supabase
    .from('senhas')
    .update({
      comprovante_status: 'rejeitado',
      comprovante_rejeicao_motivo: motivo,
    })
    .eq('id', senhaId)
    .eq('comprovante_status', 'pendente')

  if (error) return { error: error.message }
  if (count === 0) return { error: 'Comprovante já foi processado por outro operador' }

  await supabase.from('notificacoes_fila').insert({
    idempotency_key: `comprovante_rejeitado:${senhaId}`,
    competidor_id: senha.competidor_id,
    tipo: 'comprovante_rejeitado',
    mensagem: `Seu comprovante foi rejeitado. Motivo: ${motivo}`,
  }).onConflict('idempotency_key').ignore()

  revalidatePath('/financeiro')
  return { success: true }
}
