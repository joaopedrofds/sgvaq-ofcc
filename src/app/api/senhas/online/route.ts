import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  modalidade_id: z.string().uuid('modalidade_id inválido'),
  nome: z.string().min(2, 'Nome obrigatório').max(120),
  cpf: z.string().min(11).max(14),
  whatsapp: z.string().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { modalidade_id, nome, whatsapp } = parsed.data
  const cpfClean = parsed.data.cpf.replace(/\D/g, '')

  if (cpfClean.length !== 11) {
    return NextResponse.json({ error: 'CPF deve ter 11 dígitos' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Upsert competidor pelo CPF
  const { data: competidor, error: compErr } = await supabase
    .from('competidores')
    .upsert(
      { cpf: cpfClean, nome, whatsapp: whatsapp?.replace(/\D/g, '') },
      { onConflict: 'cpf', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (compErr || !competidor) {
    return NextResponse.json({ error: compErr?.message ?? 'Erro ao cadastrar competidor' }, { status: 422 })
  }

  // Buscar valor da senha antes de chamar o RPC
  const { data: modalidade } = await supabase
    .from('modalidades')
    .select('valor_senha')
    .eq('id', modalidade_id)
    .single()

  if (!modalidade) {
    return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 404 })
  }

  // RPC atômica: verifica estoque + gera numero_senha + insere — sem race condition
  const { data: result, error: rpcErr } = await supabase.rpc('criar_senha_atomica' as any, {
    p_modalidade_id: modalidade_id,
    p_competidor_id: competidor.id,
    p_canal: 'online',
    p_status: 'pendente',
    p_valor_pago: modalidade.valor_senha,
  })

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 422 })
  }

  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  return NextResponse.json({ senha_id: result.senha_id })
}
