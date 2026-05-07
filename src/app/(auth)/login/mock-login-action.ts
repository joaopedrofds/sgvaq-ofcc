'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const MOCK_LOGIN_EMAIL = 'admin@vaquejada.com'
const MOCK_LOGIN_PASSWORD = '123456789Aa@'

export async function loginMockAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (email !== MOCK_LOGIN_EMAIL || password !== MOCK_LOGIN_PASSWORD) {
    return { error: 'Email ou senha incorretos.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('__sgvaq_mock_auth', 'true', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  redirect('/dashboard')
}

export async function logoutMockAction() {
  const cookieStore = await cookies()
  cookieStore.delete('__sgvaq_mock_auth')
  cookieStore.delete('demo_bypass')
  redirect('/login')
}
