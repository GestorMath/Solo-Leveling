'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sword, ShoppingBag, Package, User,
  Trophy, Skull, Timer, Bell, Shield, Users, BookOpen, Settings,
} from 'lucide-react'
import { useSystem, THEME_COLORS } from '../context/SystemContext'

const ALL_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/Dashboard'          },
  { icon: Sword,           label: 'Missões',      href: '/quests'             },
  { icon: Shield,          label: 'Rank',         href: '/rank'               },
  { icon: ShoppingBag,     label: 'Shop',         href: '/shop'               },
  { icon: Package,         label: 'Inventário',   href: '/inventory'          },
  { icon: Skull,           label: 'Sombras',      href: '/shadow-army'        },
  { icon: Timer,           label: 'Dungeon',      href: '/dungeon'            },
  { icon: Users,           label: 'Guild',        href: '/guild'              },
  { icon: Trophy,          label: 'Ranking',      href: '/leaderboard'        },
  { icon: Bell,            label: 'Notificações', href: '/notifications'      },
  { icon: BookOpen,        label: 'Rotinas',      href: '/Dashboard/routines' },
  { icon: User,            label: 'Perfil',       href: '/profile'            },
  { icon: Settings,        label: 'Config',       href: '/settings'           },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { colorTheme } = useSystem()
  const themeColor = THEME_COLORS[colorTheme] ?? '#00ffff'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-black/95 border-t z-[100] backdrop-blur-md md:hidden"
      style={{ borderTopColor: `${themeColor}30` }}
    >
      <div className="flex items-center h-full overflow-x-auto no-scrollbar px-1">
        {ALL_NAV.map(({ icon: Icon, label, href }) => {
          const active =
            pathname === href ||
            (href !== '/Dashboard' && pathname.startsWith(href + '/')) ||
            (href === '/Dashboard' && pathname === '/Dashboard')

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-shrink-0 h-full gap-0.5 px-3 relative transition-all duration-200"
              style={{ color: active ? themeColor : '#4b5563', minWidth: '60px' }}
            >
              <Icon
                size={20}
                style={active ? { filter: `drop-shadow(0 0 6px ${themeColor}80)` } : {}}
              />
              <span className="text-[7px] uppercase font-black tracking-tight leading-none whitespace-nowrap">
                {label}
              </span>
              {active && (
                <div
                  className="absolute bottom-0 w-6 h-[2px]"
                  style={{ background: themeColor, boxShadow: `0 0 8px ${themeColor}` }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}