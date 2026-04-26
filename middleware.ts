import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_CLASSES = [
  'executor', 'arquiteto', 'infiltrador', 'alquimista',
  'sentinela', 'oraculo', 'ferreiro', 'monarca', 'vagabundo',
]

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

  const isPublicRoute = ['/', '/intro', '/auth', '/auth/callback', '/callback'].some(
    r => pathname === r || pathname.startsWith(r + '/')
  )
  const isOnboardingRoute = pathname === '/onboarding'

  // SEMPRE usar getUser() — valida sessão no servidor, não confia em cookie JWT local
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError && authError.message !== 'Auth session missing!') {
    console.error('[Middleware] Auth error:', authError.message)
    return response
  }

  // ── USUÁRIO NÃO AUTENTICADO ────────────────────────────────────────────────
  if (!user) {
    if (!isPublicRoute && !isOnboardingRoute) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return response
  }

  // ── USUÁRIO AUTENTICADO ────────────────────────────────────────────────────

  // SEC-03: Validar o cookie de classe contra lista de valores permitidos.
  // Cookie não-validado ou com valor desconhecido é descartado e o banco é consultado.
  const cachedClass = request.cookies.get('player_class')?.value
  const cacheIsValid = !!cachedClass && VALID_CLASSES.includes(cachedClass)

  let playerClass = cacheIsValid ? cachedClass : null

  if (!playerClass) {
    const { data: player } = await supabase
      .from('players')
      .select('class')
      .eq('id', user.id)
      .single()

    playerClass = player?.class ?? null

    if (playerClass && VALID_CLASSES.includes(playerClass)) {
      response.cookies.set('player_class', playerClass, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24h
      })
    }
  }

  const hasClass = Boolean(playerClass)

  // Sem classe → forçar onboarding
  if (!hasClass) {
    if (!isOnboardingRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return response
  }

  // Com classe → redirecionar rotas públicas/onboarding para dashboard
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