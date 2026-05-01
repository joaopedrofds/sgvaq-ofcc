import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { extractSlugFromHost, isPublicRoute, isAdminRoute } from '@/lib/utils/routing'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  // Early return no modo mock — pula toda lógica de autenticação Supabase
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  const hasDemoBypass = request.cookies.get('demo_bypass')?.value === 'true'

  if (isPublicRoute(pathname)) {
    return response
  }

  if (isAdminRoute(pathname)) {
    if (!user || user.app_metadata?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  const slug = extractSlugFromHost(host, APP_DOMAIN)
  if (slug) {
    if (!user && !hasDemoBypass) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    response.headers.set('x-tenant-slug', slug)
    return response
  }

  // Also prevent root redirect inside dashboard if no slug but protected route
  if (!user && !hasDemoBypass && !pathname.startsWith('/login') && !pathname.startsWith('/cadastro')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
