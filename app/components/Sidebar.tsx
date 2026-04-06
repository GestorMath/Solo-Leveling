'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ALL_NAV } from './BottomNav'
import { Settings, LogOut } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { useSystem } from '../context/SystemContext'

function getRankColor(rank: string): string {
  if (rank.startsWith('SS')) return '#ff4466'
  if (rank.startsWith('S'))  return '#00ffff'
  if (rank.startsWith('A'))  return '#9944ff'
  if (rank.startsWith('B'))  return '#4488ff'
  if (rank.startsWith('C'))  return '#44ff88'
  if (rank.startsWith('D'))  return '#ffaa44'
  return '#888888'
}

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { rank, level, gold, playerName } = useSystem()
  const rankColor = getRankColor(rank)

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch { /* ignora erro de rede */ }
    localStorage.clear()
    router.replace('/auth')
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-black border-r border-cyan-900/20 min-h-screen sticky top-0 z-40">

      {/* Logo + mini card do player */}
      <div className="px-4 py-5 border-b border-cyan-900/20 space-y-3">
        <div className="flex items-center gap-2">
          <svg width="20" height="18" viewBox="0 0 48 42">
            <polygon points="24,2 44,13 44,29 24,40 4,29 4,13"
              fill="none" stroke="rgba(0,255,255,0.7)" strokeWidth="2" />
            <text x="24" y="27" textAnchor="middle" fill="rgba(0,255,255,0.8)"
              fontSize="14" fontFamily="monospace" fontWeight="bold">S</text>
          </svg>
          <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Solo Leveling</span>
        </div>

        {/* Mini status card */}
        <div className="bg-slate-950 border border-slate-900 px-3 py-2 flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0"
            style={{ background: `${rankColor}18`, border: `1px solid ${rankColor}60`, color: rankColor }}
          >
            {rank}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-white truncate">{playerName || 'Jogador'}</p>
            <p className="text-[7px] text-slate-600 uppercase">Nv.{level} · {gold.toLocaleString()}G</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto custom-scrollbar">
        <div className="space-y-0.5">
          {ALL_NAV.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                  active
                    ? 'text-cyan-400 bg-cyan-950/30 border-l-2 border-cyan-500'
                    : 'text-slate-600 hover:text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                <Icon size={14} className={active ? 'drop-shadow-[0_0_4px_rgba(0,255,255,0.6)]' : ''} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer: Settings + Logout */}
      <div className="px-2 pb-4 border-t border-cyan-900/10 pt-3 space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
            pathname === '/settings'
              ? 'text-cyan-400 bg-cyan-950/30 border-l-2 border-cyan-500'
              : 'text-slate-600 hover:text-slate-300 hover:bg-slate-900/30'
          }`}
        >
          <Settings size={14} /> Configurações
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:text-red-500 hover:bg-red-950/10 transition-all"
        >
          <LogOut size={14} /> Sair da Conta
        </button>
      </div>
    </aside>
  )
}