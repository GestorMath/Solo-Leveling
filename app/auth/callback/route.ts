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
            } catch (error) {
              // Se o Route Handler for chamado de um Server Component, 
              // a mutação de cookie pode falhar silenciosamente aqui.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Tratamento de erro silencioso para evitar crash no callback
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Verificação de registro no banco (Onboarding)
      const { data: player } = await supabase
        .from('players')
        .select('name')
        .eq('id', data.user.id)
        .maybeSingle()

      const targetPath = player?.name ? next : '/onboarding'
      return NextResponse.redirect(`${origin}${targetPath}`)
    }
  }

  // Retorno em caso de erro no código ou na sessão
  return NextResponse.redirect(`${origin}/auth`)
}