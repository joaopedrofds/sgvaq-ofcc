import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const passadaSchema = z.object({
  uuid_local: z.string().uuid('uuid_local inválido'),
  senha_id: z.string().uuid('senha_id inválido'),
  modalidade_id: z.string().uuid('modalidade_id inválido'),
  numero_passada: z.number().int().positive(),
  juiz_id: z.string().uuid('juiz_id inválido'),
  pontuacao_total: z.number().min(0).max(9999),
  detalhes_json: z.record(z.string(), z.unknown()).optional(),
  penalidade: z.number().min(0).max(999).optional(),
  penalidade_motivo: z.string().max(255).optional(),
  created_at_local: z.string().datetime(),
})

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabaseAuth = await createClient()
  const { data: { user } } = await (supabaseAuth as any).auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = passadaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const payload = parsed.data
  const admin = await createAdminClient()

  // Verifica que juiz_id bate com o usuário autenticado e obtém o tenant_id
  const { data: tenantUser } = await admin
    .from('tenant_users')
    .select('id, role, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser || tenantUser.role !== 'juiz') {
    return NextResponse.json({ error: 'Apenas juízes podem sincronizar passadas' }, { status: 403 })
  }

  if (payload.juiz_id !== tenantUser.id) {
    return NextResponse.json({ error: 'juiz_id não bate com usuário autenticado' }, { status: 403 })
  }

  // Verifica que a senha e modalidade pertencem ao tenant do juiz (isolamento de tenant)
  const { data: senha } = await (admin
    .from('senhas')
    .select('id, tenant_id, modalidade_id')
    .eq('id', payload.senha_id)
    .eq('tenant_id' as any, tenantUser.tenant_id)
    .single() as any)

  if (!senha) {
    return NextResponse.json({ error: 'Senha não encontrada ou não pertence a este tenant' }, { status: 403 })
  }

  if ((senha as any).modalidade_id !== payload.modalidade_id) {
    return NextResponse.json({ error: 'modalidade_id não corresponde à senha informada' }, { status: 400 })
  }

  const { error } = await admin.from('passadas').insert({
    uuid_local: payload.uuid_local,
    senha_id: payload.senha_id,
    modalidade_id: payload.modalidade_id,
    numero_passada: payload.numero_passada,
    juiz_id: payload.juiz_id,
    pontuacao_total: payload.pontuacao_total,
    detalhes_json: (payload.detalhes_json ?? null) as any,
    penalidade: payload.penalidade ?? 0,
    penalidade_motivo: payload.penalidade_motivo ?? null,
    created_at_local: payload.created_at_local,
    sincronizado: false,
    origem: 'offline',
  } as any)

  if (error) {
    if (error.code === '23505') return NextResponse.json({ status: 'already_synced' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 422 })
  }

  await admin.from('passadas').update({ sincronizado: true }).eq('uuid_local', payload.uuid_local)

  return NextResponse.json({ status: 'synced' })
}
