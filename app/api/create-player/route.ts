import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não definida' }, { status: 500 })
    }
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL não definida' }, { status: 500 })
    }

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Tenta insert
    const { error: insertErr } = await supabaseAdmin.from('players').insert(body)

    if (insertErr) {
      if (insertErr.code === '23505') {
        const { error: updateErr } = await supabaseAdmin
          .from('players')
          .update({
            name: body.name,
            class: body.class,
            stats: body.stats,
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.id)
        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: insertErr.message, code: insertErr.code }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}