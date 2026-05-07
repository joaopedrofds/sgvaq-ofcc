import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { SessionUser } from '@/types'
import { mockSession } from '@/lib/mock/data'

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()

  // Sessão simulada via login mock (admin@vaquejada.com / 123456789Aa@)
  if (cookieStore.get('__sgvaq_mock_auth')?.value === 'true') {
    return {
      id: mockSession.id,
      email: mockSession.email,
      role: mockSession.role,
      tenantId: mockSession.tenantId,
    }
  }

  // Atalho legado de demo
  if (cookieStore.get('demo_bypass')?.value === 'true') {
    return {
      id: 'demo-user-id',
      email: 'demo@sgvaq.com',
      role: 'organizador',
      tenantId: 'demo-tenant-id',
    }
  }

  // Em modo mock sem cookie, força fluxo de login
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    return null
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role ?? (user.user_metadata as any)?.role
  const tenantId = user.app_metadata?.tenant_id ?? (user.user_metadata as any)?.tenant_id

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    tenantId,
  }
}
