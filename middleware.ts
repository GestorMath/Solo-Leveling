import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── MIDDLEWARE CORRIGIDO ──────────────────────────────────────────────────────
// BUGS CORRIGIDOS:
// 1. Arquivo renomeado de proxy.ts → middleware.ts (Next.js ignorava completamente)
// 2. Função renomeada de "proxy" → "middleware" (export obrigatório)
// 3. Tratamento de erro no getUser() (evita redirect loop em falha de rede)
// 4. Lógica simplificada com early return (elimina if aninhados desnecessários)
// 5. Tipagem corrigida: usa CookieOptions do @supabase/ssr (compatível com Next.js 16)
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Next.js 16: cookies são imutáveis no request — aplicamos só no response
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Rotas públicas (não requerem autenticação)
  const isPublicRoute = ['/', '/intro', '/auth', '/auth/callback', '/callback'].some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
  const isOnboardingRoute = pathname === '/onboarding'

  // Obtém usuário com tratamento de erro (evita redirect loop em falha de rede)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Falha de infraestrutura: não bloqueia o usuário, apenas passa
  if (authError && authError.message !== 'Auth session missing!') {
    console.error('[Middleware] Auth error:', authError.message)
    return response
  }

  // ── USUÁRIO NÃO AUTENTICADO ──────────────────────────────────────────────────
  if (!user) {
    if (!isPublicRoute && !isOnboardingRoute) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return response
  }

  // ── USUÁRIO AUTENTICADO ──────────────────────────────────────────────────────

  // Cache do player_class em cookie para evitar N+1 queries por request
  let playerClass = request.cookies.get('player_class')?.value

  if (!playerClass) {
    const { data: player } = await supabase
      .from('players')
      .select('class')
      .eq('id', user.id)
      .single()

    playerClass = player?.class ?? undefined

    if (playerClass) {
      response.cookies.set('player_class', playerClass, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      })
    }
  }

  const hasClass = Boolean(playerClass)

  // Sem classe → força onboarding (exceto se já estiver nele ou em rota pública)
  if (!hasClass) {
    if (!isOnboardingRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return response
  }

  // Com classe → redireciona rotas públicas/onboarding para dashboard
  const isCallbackRoute = pathname === '/auth/callback'
  if ((isOnboardingRoute || isPublicRoute) && !isCallbackRoute) {
    return NextResponse.redirect(new URL('/Dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}