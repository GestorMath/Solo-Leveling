'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Sword, ShoppingBag, Package, User,
  Trophy, Skull, Timer, Bell, Shield, Users, Settings, LogOut,
  BookOpen, Zap
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { useSystem, THEME_COLORS } from '../context/SystemContext'

export const ALL_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/Dashboard'      },
  { icon: Sword,           label: 'Missões',      href: '/quests'         },
  { icon: Shield,          label: 'Rank',         href: '/rank'           },
  { icon: ShoppingBag,     label: 'Loja',         href: '/shop'           },
  { icon: Package,         label: 'Inventário',   href: '/inventory'      },
  { icon: Skull,           label: 'Sombras',      href: '/shadow-army'    },
  { icon: Timer,           label: 'Dungeon',      href: '/dungeon'        },
  { icon: Users,           label: 'Guild',        href: '/guild'          },
  { icon: Trophy,          label: 'Ranking',      href: '/leaderboard'    },
  { icon: Bell,            label: 'Notificações', href: '/notifications'  },
  { icon: BookOpen,        label: 'Rotinas',      href: '/Dashboard/routines' }, // ADICIONADO
  { icon: User,            label: 'Perfil',       href: '/profile'        },
]

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
  const { rank, level, gold, playerName, colorTheme, avatarUrl } = useSystem()
  const rankColor  = getRankColor(rank)
  const themeColor = THEME_COLORS[colorTheme] ?? '#00ffff'

  async function handleLogout() {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    localStorage.clear()
    router.replace('/auth')
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-black border-r border-cyan-900/20 min-h-screen sticky top-0 z-40"
      style={{ borderRightColor: `${themeColor}20` }}>

      {/* Logo - PROJETO S */}
      <div className="px-4 py-5 border-b border-cyan-900/20 space-y-3" style={{ borderBottomColor: `${themeColor}20` }}>
        <div className="flex items-center gap-2">
          <svg width="22" height="20" viewBox="0 0 48 42">
            <polygon points="24,2 44,13 44,29 24,40 4,29 4,13"
              fill="none" stroke={themeColor} strokeWidth="2" opacity="0.8" />
            <text x="24" y="27" textAnchor="middle" fill={themeColor}
              fontSize="14" fontFamily="monospace" fontWeight="bold">S</text>
          </svg>
          <span className="text-white font-black text-[11px] uppercase tracking-[0.2em]">Projeto S</span>
        </div>

        {/* Mini status card */}
        <div className="bg-slate-950 border border-slate-900 px-3 py-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 overflow-hidden"
            style={{ background: `${rankColor}18`, border: `1px solid ${rankColor}60`, color: rankColor }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : rank}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-white truncate">{playerName || 'Caçador'}</p>
            <p className="text-[7px] text-slate-600 uppercase">Nv.{level} · {gold.toLocaleString()}G</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto custom-scrollbar">
        <div className="space-y-0.5">
          {ALL_NAV.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || (href !== '/Dashboard' && pathname.startsWith(href + '/'))
              || (href === '/Dashboard' && pathname === '/Dashboard')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                  active ? 'text-white bg-slate-900/50' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-900/30'
                }`}
                style={active ? { color: themeColor, borderLeft: `2px solid ${themeColor}`, paddingLeft: '10px' } : {}}>
                <Icon size={14} style={active ? { filter: `drop-shadow(0 0 4px ${themeColor}80)` } : {}} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 border-t border-cyan-900/10 pt-3 space-y-0.5">
        <Link href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
            pathname === '/settings' ? 'text-cyan-400 bg-cyan-950/30' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-900/30'
          }`}
          style={pathname === '/settings' ? { color: themeColor, borderLeft: `2px solid ${themeColor}`, paddingLeft: '10px' } : {}}>
          <Settings size={14} /> Configurações
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:text-red-500 hover:bg-red-950/10 transition-all">
          <LogOut size={14} /> Sair da Conta
        </button>
      </div>
    </aside>
  )
}