'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useSystem } from '@/app/context/SystemContext'
import { MASTER_ITEM_DATABASE } from '@/data/items'
import { Coins, Clock, Zap, Lock, CheckCircle, Filter, ShoppingCart } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

const RARITY_COLORS: Record<string, string> = {
  E: '#888888', D: '#ffaa44', C: '#44ff88',
  B: '#4488ff', A: '#9944ff', S: '#00ffff',
  SS: '#ff8844', SSS: '#ff4466',
}

const RARITY_LABELS: Record<string, string> = {
  E: 'Rank E', D: 'Rank D', C: 'Rank C', B: 'Rank B',
  A: 'Rank A', S: 'Rank S', SS: 'Rank SS', SSS: 'Rank SSS',
}

const TYPE_LABELS: Record<string, string> = {
  all: 'Todos', boost: 'Boosts', consumable: 'Consumíveis', special: 'Especiais',
}

/** 
 * Chave da rotação atual (muda a cada hora).
 * Formato: "shop_purchased_YYYY-MM-DD-HH"
 */
function getRotationKey(): string {
  const now = new Date()
  return `shop_purchased_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
}

/** IDs comprados na rotação ATUAL (não no inventário total, por rotação) */
function getPurchasedThisRotation(): Set<string> {
  try {
    const key = getRotationKey()
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

function addPurchasedThisRotation(itemId: string) {
  try {
    const key = getRotationKey()
    const current = getPurchasedThisRotation()
    current.add(itemId)
    localStorage.setItem(key, JSON.stringify([...current]))

    // Limpa chaves de rotações antigas (mantém só a atual + anterior)
    const prevKey = (() => {
      const d = new Date(Date.now() - 3600000)
      return `shop_purchased_${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
    })()
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('shop_purchased_') && k !== key && k !== prevKey) {
        localStorage.removeItem(k)
      }
    }
  } catch { /* silêncio */ }
}

export default function ShopPage() {
  const { buyItem, gold, showAlert } = useSystem()
  const [timeLeft, setTimeLeft] = useState('')
  const [filter, setFilter] = useState<'all' | 'boost' | 'consumable' | 'special'>('all')
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  // Carrega compras desta rotação
  useEffect(() => {
    setPurchasedIds(getPurchasedThisRotation())
  }, [])

  // Detecta virada de hora (nova rotação) — recarrega itens e limpa compras da hora anterior
  useEffect(() => {
    const tick = setInterval(() => {
      const h = new Date().getHours()
      if (h !== currentHour) {
        setCurrentHour(h)
        setPurchasedIds(new Set()) // nova rotação = zera comprados
      }

      // Timer de reset
      const now = new Date()
      const mins = String(59 - now.getMinutes()).padStart(2, '0')
      const secs = String(59 - now.getSeconds()).padStart(2, '0')
      setTimeLeft(`${mins}m ${secs}s`)
    }, 1000)
    return () => clearInterval(tick)
  }, [currentHour])

  // 12 itens por rotação horária (seed determinístico)
  const allVisible = useMemo(() => {
    const hourSeed = Math.floor(Date.now() / 3600000)
    return [...MASTER_ITEM_DATABASE]
      .sort((a, b) =>
        Math.sin(hourSeed * 9301 + a.price * 49297) -
        Math.sin(hourSeed * 9301 + b.price * 49297)
      )
      .slice(0, 12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHour]) // recalcula quando hora muda

  const visibleItems = filter === 'all'
    ? allVisible
    : allVisible.filter(i => i.type === filter)

  function handleBuy(item: typeof MASTER_ITEM_DATABASE[0]) {
    // 1. Verificar gold
    if (gold < item.price) {
      showAlert(`❌ Gold insuficiente — você tem ${gold.toLocaleString()}G`, 'critical')
      return
    }
    // 2. Verificar se já comprou nesta rotação
    if (purchasedIds.has(item.id)) {
      showAlert(`⚠ ${item.name} — aguarde a próxima rotação`, 'info')
      return
    }
    // 3. Comprar
    buyItem(item)
    // 4. Registrar como comprado nesta rotação
    addPurchasedThisRotation(item.id)
    setPurchasedIds(prev => new Set([...prev, item.id]))
  }

  return (
    <div className="p-4 md:p-6 font-mono min-h-screen bg-black text-white pb-32">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-5 border-b border-cyan-900/30 gap-3">
        <div>
          <p className="text-cyan-500 text-[10px] font-black tracking-[0.4em] uppercase mb-1 flex items-center gap-1.5">
            <Zap size={10} className="animate-pulse" /> Mercado Rotativo — Nova remessa em:{' '}
            <span className="text-cyan-400">{timeLeft}</span>
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Loja <span className="text-cyan-500 font-light text-lg">S-Rank</span>
          </h1>
          <p className="text-[8px] text-slate-600 mt-1 uppercase tracking-widest">
            // Itens comprados nesta rotação ficam indisponíveis até a próxima
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Saldo</p>
          <div className="bg-cyan-950/30 px-4 py-2 border border-cyan-500/40 flex items-center gap-2">
            <Coins className="text-yellow-500" size={16} />
            <span className="text-cyan-400 font-black text-lg tabular-nums">
              {gold.toLocaleString()}<span className="text-xs opacity-50 ml-1">G</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-5">
        <span className="flex items-center text-slate-600 text-[9px] uppercase tracking-widest mr-1">
          <Filter size={10} className="mr-1" /> Filtrar:
        </span>
        {(['all', 'boost', 'consumable', 'special'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
              filter === f
                ? 'bg-cyan-500 text-black border-cyan-500'
                : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {TYPE_LABELS[f]}
          </button>
        ))}
        <span className="ml-auto text-[8px] text-slate-700 self-center uppercase tracking-wide">
          {visibleItems.length} itens nesta rotação
        </span>
      </div>

      {/* Grid de itens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleItems.map(item => {
          const rarityColor  = RARITY_COLORS[item.rarity] ?? '#888'
          const boughtNow    = purchasedIds.has(item.id)
          const canAfford    = gold >= item.price

          return (
            <div
              key={item.id}
              className={`relative flex flex-col p-3 border transition-all duration-200 ${
                boughtNow
                  ? 'border-slate-800/60 bg-slate-950/50 opacity-50'
                  : canAfford
                    ? 'border-cyan-900/30 bg-slate-900/40 hover:border-cyan-500/50'
                    : 'border-slate-900/30 bg-slate-900/20 opacity-60'
              }`}
            >
              {/* Raridade badge */}
              <div className="absolute top-2 right-2">
                <span
                  className="text-[7px] font-black px-1.5 py-0.5 border"
                  style={{ color: rarityColor, borderColor: `${rarityColor}44`, background: `${rarityColor}12` }}
                >
                  {RARITY_LABELS[item.rarity] ?? item.rarity}
                </span>
              </div>

              {/* Ícone */}
              <div className="text-3xl mb-2 mt-1">{item.icon}</div>

              {/* Nome */}
              <h3 className="font-bold uppercase text-[10px] tracking-tight mb-1 leading-tight min-h-[28px] flex items-start">
                {item.name}
              </h3>

              {/* Duração */}
              {item.duration && (
                <p className="text-[8px] text-slate-600 mb-1 flex items-center gap-1">
                  <Clock size={7} /> {item.duration}min
                </p>
              )}

              {/* Descrição */}
              <p className="text-[8px] text-slate-500 leading-tight mb-3 flex-1 line-clamp-3">
                {item.description}
              </p>

              {/* Botão */}
              {boughtNow ? (
                <div className="flex items-center justify-center gap-1 py-2 border border-slate-700/40 text-slate-600">
                  <CheckCircle size={10} />
                  <span className="text-[8px] font-black uppercase">Comprado</span>
                </div>
              ) : (
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  className={`py-2 font-black text-[9px] uppercase tracking-wider border transition-all flex items-center justify-center gap-1 ${
                    canAfford
                      ? 'border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-black'
                      : 'border-slate-800 text-slate-700 cursor-not-allowed'
                  }`}
                >
                  {!canAfford && <Lock size={8} />}
                  <ShoppingCart size={8} />
                  {item.price === 0 ? 'Grátis' : `${item.price.toLocaleString()}G`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}