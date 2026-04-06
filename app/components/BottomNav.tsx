'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sword, ShoppingBag, Package, User,
  Trophy, Skull, Timer, Bell, Shield, Users,
} from 'lucide-react'

// Navegação primária mobile (5 itens visíveis)
const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'Status',    href: '/Dashboard'    },
  { icon: Sword,           label: 'Missões',   href: '/quests'       },
  { icon: ShoppingBag,     label: 'Shop',      href: '/shop'         },
  { icon: Package,         label: 'Inventário',href: '/inventory'    },
  { icon: User,            label: 'Perfil',    href: '/profile'      },
]

// Navegação completa para sidebar desktop
export const ALL_NAV = [
  { icon: LayoutDashboard, label: 'Status',       href: '/Dashboard'    },
  { icon: Sword,           label: 'Missões',      href: '/quests'       },
  { icon: Shield,          label: 'Rank',         href: '/rank'         },
  { icon: ShoppingBag,     label: 'Loja',         href: '/shop'         },
  { icon: Package,         label: 'Inventário',   href: '/inventory'    },
  { icon: Skull,           label: 'Sombras',      href: '/shadow-army'  },
  { icon: Timer,           label: 'Dungeon',      href: '/dungeon'      },
  { icon: Users,           label: 'Guild',        href: '/guild'        },
  { icon: Trophy,          label: 'Ranking',      href: '/leaderboard'  },
  { icon: Bell,            label: 'Notificações', href: '/notifications'},
  { icon: User,            label: 'Perfil',       href: '/profile'      },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/95 border-t border-cyan-900/40 z-[100] backdrop-blur-md flex items-center justify-around px-2 md:hidden">
      {PRIMARY_NAV.map(({ icon: Icon, label, href }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative transition-all duration-200 ${
              active ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Icon size={20} className={active ? 'drop-shadow-[0_0_6px_rgba(0,255,255,0.8)]' : ''} />
            <span className="text-[7px] uppercase font-black tracking-tight leading-none">{label}</span>
            {active && (
              <div className="absolute bottom-0 w-6 h-[2px] bg-cyan-400" style={{ boxShadow: '0 0 8px rgba(0,255,255,0.8)' }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}