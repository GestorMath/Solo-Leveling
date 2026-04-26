import { createBrowserClient } from '@supabase/ssr'

// Singleton — uma única instância para todo o app.
// Nunca chame createBrowserClient() diretamente em pages/components.
// Importe sempre este módulo: import { supabase } from '@/app/lib/supabase'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)