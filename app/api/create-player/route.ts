import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Verificar sessão do usuário
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Garantir que o id bate com o usuário logado
    if (body.id !== user.id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 403 })
    }

    // Usar service role para inserir (bypassa PostgREST cache issue)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Tenta insert
    const { error: insertErr } = await supabaseAdmin.from('players').insert(body)

    if (insertErr) {
      if (insertErr.code === '23505') {
        // Já existe, faz update
        const { error: updateErr } = await supabaseAdmin
          .from('players')
          .update({
            name: body.name,
            class: body.class,
            stats: body.stats,
            updated_at: body.updated_at,
          })
          .eq('id', user.id)

        if (updateErr) throw new Error(updateErr.message)
      } else {
        throw new Error(`${insertErr.code}: ${insertErr.message}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}