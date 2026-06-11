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

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes
  if (path === '/login' || path === '/') {
    if (user) {
      // Get role and redirect to appropriate page
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role
      if (role === 'customer') return NextResponse.redirect(new URL('/dashboard', request.url))
      if (role === 'employee') return NextResponse.redirect(new URL('/scan', request.url))
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    }
    return supabaseResponse
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get role for protected routes
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

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
