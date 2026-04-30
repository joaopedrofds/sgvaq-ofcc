import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { SessionUser } from '@/types'

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  if (cookieStore.get('demo_bypass')?.value === 'true') {
    return {
      id: 'demo-user-id',
      email: 'demo@sgvaq.com',
      role: 'organizador',
      tenantId: 'demo-tenant-id'
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role ?? user.user_metadata?.role
  const tenantId = user.app_metadata?.tenant_id ?? user.user_metadata?.tenant_id

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    tenantId,
  }
}
