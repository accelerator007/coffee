import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

type AppRole = 'admin' | 'employee' | 'customer'

function isRole(value: unknown): value is AppRole {
  return value === 'admin' || value === 'employee' || value === 'customer'
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        }
      }
    }
  )

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const path = request.nextUrl.pathname

  if (!claims) {
    if (path === '/login' || path === '/') return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // app_metadata is controlled by trusted server-side code. Never authorize
  // from user_metadata, because users can update that field themselves.
  let role: AppRole | null = null
  const metadataRole = (claims.app_metadata as { role?: unknown } | undefined)?.role
  if (isRole(metadataRole)) role = metadataRole

  // Backwards-compatible fallback for existing accounts that predate the move
  // to app_metadata. RLS must allow a signed-in user to read their own profile.
  if (!role && typeof claims.sub === 'string') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', claims.sub)
      .maybeSingle()

    if (isRole(profile?.role)) role = profile.role
  }

  // A signed-in account without a trusted role is treated as unauthorized.
  if (!role) {
    await supabase.auth.signOut()
    const response = NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return response
  }

  if (path === '/login' || path === '/') {
    if (role === 'customer') return NextResponse.redirect(new URL('/dashboard', request.url))
    if (role === 'employee') return NextResponse.redirect(new URL('/scan', request.url))
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (path.startsWith('/dashboard') && role !== 'customer') {
    return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/scan', request.url))
  }

  if (path.startsWith('/scan') && role === 'customer') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(role === 'employee' ? '/scan' : '/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
