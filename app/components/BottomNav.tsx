'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sword, ShoppingBag, Package, User,
  Trophy, Skull, Timer, Bell, Shield, Users, BookOpen,
} from 'lucide-react'
import { useSystem, THEME_COLORS } from '../context/SystemContext'

const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/Dashboard'  },
  { icon: Sword,           label: 'Missões',   href: '/quests'     },
  { icon: ShoppingBag,     label: 'Shop',      href: '/shop'       },
  { icon: Package,         label: 'Inventário',href: '/inventory'  },
  { icon: User,            label: 'Perfil',    href: '/profile'    },
]

export const ALL_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/Dashboard'          },
  { icon: Sword,           label: 'Missões',      href: '/quests'             },
  { icon: Shield,          label: 'Rank',         href: '/rank'               },
  { icon: ShoppingBag,     label: 'Loja',         href: '/shop'               },
  { icon: Package,         label: 'Inventário',   href: '/inventory'          },
  { icon: Skull,           label: 'Sombras',      href: '/shadow-army'        },
  { icon: Timer,           label: 'Dungeon',      href: '/dungeon'            },
  { icon: Users,           label: 'Guild',        href: '/guild'              },
  { icon: Trophy,          label: 'Ranking',      href: '/leaderboard'        },
  { icon: Bell,            label: 'Notificações', href: '/notifications'      },
  { icon: BookOpen,        label: 'Rotinas',      href: '/Dashboard/routines' }, // ADICIONADO
  { icon: User,            label: 'Perfil',       href: '/profile'            },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { colorTheme } = useSystem()
  const themeColor = THEME_COLORS[colorTheme] ?? '#00ffff'

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/95 border-t z-[100] backdrop-blur-md flex items-center justify-around px-2 md:hidden"
      style={{ borderTopColor: `${themeColor}30` }}>
      {PRIMARY_NAV.map(({ icon: Icon, label, href }) => {
        const active = pathname === href || (href !== '/Dashboard' && pathname.startsWith(href + '/'))
          || (href === '/Dashboard' && pathname === '/Dashboard')
        return (
          <Link key={href} href={href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative transition-all duration-200`}
            style={{ color: active ? themeColor : '#4b5563' }}>
            <Icon size={20} style={active ? { filter: `drop-shadow(0 0 6px ${themeColor}80)` } : {}} />
            <span className="text-[7px] uppercase font-black tracking-tight leading-none">{label}</span>
            {active && (
              <div className="absolute bottom-0 w-6 h-[2px]" style={{ background: themeColor, boxShadow: `0 0 8px ${themeColor}` }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}