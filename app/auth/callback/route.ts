// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/Dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch {
              // silencioso em Server Components
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch {
              // silencioso
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Verifica se já completou onboarding (tem classe definida)
      const { data: player } = await supabase
        .from('players')
        .select('class')
        .eq('id', data.user.id)
        .maybeSingle()

      // Se não tem player ou não tem classe, vai para onboarding
      const targetPath = player?.class ? next : '/onboarding'
      return NextResponse.redirect(`${origin}${targetPath}`)
    }
  }

  // Erro no código ou sessão
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
}