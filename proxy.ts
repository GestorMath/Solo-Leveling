import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ALTERADO: de "export async function middleware" para "export async function proxy"
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Obtém o usuário (sessão do navegador)
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 2. Definição de Rotas (Ajustado: '/' adicionado para permitir redirecionamento da intro)
  const isPublicRoute = ['/', '/intro', '/auth', '/auth/callback', '/callback'].some(r => pathname === r || pathname.startsWith(r + '/'))
  const isOnboardingRoute = pathname === '/onboarding'

  // ── LOGICA DE REDIRECIONAMENTO ──

  // A. Se NÃO estiver logado:
  if (!user) {
    // Se tentar acessar algo que não seja público (Dashboard, Onboarding, etc) -> LOGIN
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    // Se já estiver em rota pública, permite o acesso
    return response
  }

  // B. Se ESTIVER logado:
  if (user) {
    // Buscamos o player no banco
    const { data: player } = await supabase
      .from('players')
      .select('class')
      .eq('id', user.id)
      .single()

    // CASO 1: Logado mas NÃO tem classe
    if (!player?.class) {
      // Se não estiver no onboarding e nem tentando deslogar -> Força Onboarding
      if (!isOnboardingRoute && !isPublicRoute) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return response
    }

    // CASO 2: Logado e JÁ TEM classe
    if (player?.class) {
      // Se tentar ir para Onboarding ou Auth -> Dashboard
      if (isOnboardingRoute || isPublicRoute) {
        if (pathname !== '/auth/callback') { // evita quebrar o login
            return NextResponse.redirect(new URL('/Dashboard', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}