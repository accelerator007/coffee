import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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

  // getClaims verifies the JWT locally (cached JWKS) on asymmetric-key
  // projects — no auth-server round trip per navigation, unlike getUser.
  // Expired tokens still refresh through the session and land in setAll.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const path = request.nextUrl.pathname

  // Role is set in the auth user's metadata at creation (and kept in sync on
  // update), so it rides inside the validated JWT — no profiles query needed.
  const role = (claims?.user_metadata as { role?: string } | undefined)?.role

  // Public routes
  if (path === '/login' || path === '/') {
    if (claims) {
      if (role === 'customer') return NextResponse.redirect(new URL('/dashboard', request.url))
      if (role === 'employee') return NextResponse.redirect(new URL('/scan', request.url))
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    }
    return supabaseResponse
  }

  // Protected routes — redirect to login if not authenticated
  if (!claims) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based redirects
  if (path.startsWith('/dashboard') && role !== 'customer') {
    if (role === 'employee') return NextResponse.redirect(new URL('/scan', request.url))
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (path.startsWith('/scan') && role === 'customer') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (path.startsWith('/admin') && role !== 'admin') {
    if (role === 'employee') return NextResponse.redirect(new URL('/scan', request.url))
    if (role === 'customer') return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
