'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// ... resto do código
import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Check, CheckCheck, Trash2, Filter, Zap, Sword, Settings, AlertTriangle } from 'lucide-react'

type NotifType = 'quest' | 'sistema' | 'rank' | 'shop' | 'dungeon'
type FilterTab = 'todas' | 'nao-lidas' | 'quests' | 'sistema'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  read: boolean
  createdAt: number
}

const STORAGE_KEY = 'sl_notifications'
const MAX_NOTIFS = 200

function loadNotifs(): Notif[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotifs(notifs: Notif[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFS)))
  } catch { /* silêncio */ }
}

/** Chamada de fora para inserir notificação */
export function pushNotification(n: Omit<Notif, 'id' | 'read' | 'createdAt'>) {
  const notifs = loadNotifs()
  const newN: Notif = {
    ...n,
    id: Math.random().toString(36).substr(2, 9),
    read: false,
    createdAt: Date.now(),
  }
  saveNotifs([newN, ...notifs])
  window.dispatchEvent(new Event('sl_new_notification'))
}

const TYPE_ICONS: Record<NotifType, React.ReactNode> = {
  quest:   <Sword   size={14} className="text-yellow-400" />,
  sistema: <Zap     size={14} className="text-cyan-400"   />,
  rank:    <AlertTriangle size={14} className="text-purple-400" />,
  shop:    <Filter  size={14} className="text-green-400"  />,
  dungeon: <Bell    size={14} className="text-red-400"    />,
}

const TYPE_LABELS: Record<NotifType, string> = {
  quest: 'Missão', sistema: 'Sistema', rank: 'Rank', shop: 'Loja', dungeon: 'Dungeon',
}

const TYPE_COLORS: Record<NotifType, string> = {
  quest: '#eab308', sistema: '#00ffff', rank: '#a855f7', shop: '#44ff88', dungeon: '#ff4466',
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(diff / 3600000)
  const d    = Math.floor(diff / 86400000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min atrás`
  if (h < 24)   return `${h}h atrás`
  if (d < 30)   return `${d}d atrás`
  return new Date(ts).toLocaleDateString('pt-BR')
}

const SEED_NOTIFS: Omit<Notif, 'id' | 'read' | 'createdAt'>[] = [
  { type: 'sistema', title: 'Bem-vindo ao Sistema',         body: 'Seu perfil foi criado. Complete o onboarding e comece a evoluir.' },
  { type: 'quest',   title: 'Missões diárias disponíveis',  body: 'Novas missões foram carregadas. Complete para ganhar XP e Gold.' },
  { type: 'rank',    title: 'Sistema de Rank ativo',        body: 'Você está no Rank F. Evolua completando missões diariamente.' },
  { type: 'shop',    title: 'Loja S-Rank aberta',           body: 'A loja rotativa tem novos itens disponíveis a cada hora.' },
]

export default function NotificationCenterPage() {
  const [mounted, setMounted]   = useState(false)
  const [notifs, setNotifs]     = useState<Notif[]>([])
  const [filter, setFilter]     = useState<FilterTab>('todas')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const refresh = useCallback(() => {
    setNotifs(loadNotifs())
  }, [])

  useEffect(() => {
    setMounted(true)

    // Carrega notifs salvas
    const saved = loadNotifs()

    // Se não há nenhuma (primeira vez), semeia com notificações de boas-vindas
    if (saved.length === 0) {
      const seeded: Notif[] = SEED_NOTIFS.map((n, i) => ({
        ...n,
        id: `seed_${i}`,
        read: false,
        createdAt: Date.now() - i * 3600000,
      }))
      saveNotifs(seeded)
      setNotifs(seeded)
    } else {
      setNotifs(saved)
    }

    // Escuta novas notifs inseridas externamente
    window.addEventListener('sl_new_notification', refresh)
    return () => window.removeEventListener('sl_new_notification', refresh)
  }, [refresh])

  if (!mounted) return null

  // ── Filtros ──────────────────────────────────────────────────────────────
  const filtered = notifs.filter(n => {
    if (filter === 'nao-lidas') return !n.read
    if (filter === 'quests')   return n.type === 'quest'
    if (filter === 'sistema')  return n.type === 'sistema' || n.type === 'rank'
    return true
  })

  const unreadCount = notifs.filter(n => !n.read).length

  // ── Ações ─────────────────────────────────────────────────────────────────
  function markRead(id: string) {
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifs(updated); saveNotifs(updated)
  }

  function markAllRead() {
    const updated = notifs.map(n => ({ ...n, read: true }))
    setNotifs(updated); saveNotifs(updated)
    setSelected(new Set())
  }

  function deleteNotif(id: string) {
    const updated = notifs.filter(n => n.id !== id)
    setNotifs(updated); saveNotifs(updated)
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  function deleteSelected() {
    const updated = notifs.filter(n => !selected.has(n.id))
    setNotifs(updated); saveNotifs(updated)
    setSelected(new Set())
  }

  function clearAll() {
    setNotifs([]); saveNotifs([])
    setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(n => n.id)))
    }
  }

  const FILTER_TABS: { id: FilterTab; label: string }[] = [
    { id: 'todas',     label: 'Todas' },
    { id: 'nao-lidas', label: `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { id: 'quests',    label: 'Missões' },
    { id: 'sistema',   label: 'Sistema' },
  ]

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">

      {/* Header */}
      <header className="mb-8 border-b border-cyan-900/30 pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Tela 10 — Central de Notificações</p>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
            Notificações
            {unreadCount > 0 && (
              <span className="ml-3 text-sm font-black bg-cyan-500 text-black px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </h1>
        </div>

        {/* Ações em massa */}
        <div className="flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 border border-cyan-900/40 text-cyan-600 font-bold text-[9px] uppercase tracking-widest hover:border-cyan-500 hover:text-cyan-400 transition-all"
            >
              <CheckCheck size={12} /> Marcar todas lidas
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-900/40 text-red-500 font-bold text-[9px] uppercase tracking-widest hover:bg-red-950/20 transition-all"
            >
              <Trash2 size={12} /> Excluir ({selected.size})
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-800 text-slate-600 font-bold text-[9px] uppercase tracking-widest hover:border-slate-600 hover:text-slate-400 transition-all"
            >
              <Trash2 size={12} /> Limpar tudo
            </button>
          )}
        </div>
      </header>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest border transition-all ${
              filter === tab.id
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista vazia */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <BellOff size={40} className="text-slate-800" />
          <p className="text-[10px] text-slate-700 uppercase tracking-widest font-black">
            {filter === 'nao-lidas' ? '// Nenhuma notificação não lida' : '// Nenhuma notificação'}
          </p>
        </div>
      )}

      {/* Seleção em massa */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-900">
          <button
            onClick={toggleSelectAll}
            className="text-[8px] text-slate-600 hover:text-slate-400 font-bold uppercase tracking-widest transition-colors"
          >
            {selected.size === filtered.length && filtered.length > 0
              ? 'Desmarcar todas'
              : 'Selecionar todas'}
          </button>
          {selected.size > 0 && (
            <span className="text-[8px] text-slate-700">{selected.size} selecionadas</span>
          )}
        </div>
      )}

      {/* Notificações */}
      <div className="space-y-2">
        {filtered.map(n => {
          const color     = TYPE_COLORS[n.type]
          const isSelected = selected.has(n.id)

          return (
            <div
              key={n.id}
              onClick={() => { if (!n.read) markRead(n.id) }}
              className={`relative flex items-start gap-3 p-4 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-500/40 bg-cyan-950/10'
                  : !n.read
                    ? 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600'
                    : 'border-slate-900/60 bg-slate-950/20 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={e => { e.stopPropagation(); toggleSelect(n.id) }}
                className={`mt-0.5 flex-shrink-0 w-4 h-4 border flex items-center justify-center transition-all ${
                  isSelected ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                {isSelected && <Check size={10} className="text-cyan-400" />}
              </button>

              {/* Indicador não lido */}
              {!n.read && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                />
              )}

              {/* Ícone do tipo */}
              <div className="flex-shrink-0 mt-0.5">
                {TYPE_ICONS[n.type]}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className={`font-black text-sm leading-tight ${!n.read ? 'text-white' : 'text-slate-500'}`}>
                    {n.title}
                  </p>
                  <span className="text-[8px] text-slate-700 flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">{n.body}</p>
                <span
                  className="inline-block text-[7px] font-black px-1.5 py-0.5 border mt-2 uppercase tracking-wider"
                  style={{ color, borderColor: `${color}40`, background: `${color}10` }}
                >
                  {TYPE_LABELS[n.type]}
                </span>
              </div>

              {/* Deletar */}
              <button
                onClick={e => { e.stopPropagation(); deleteNotif(n.id) }}
                className="flex-shrink-0 text-slate-800 hover:text-red-500 transition-colors mt-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}