'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { useSystem } from '@/app/context/SystemContext'
import { Package, Play, Filter, Zap, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

// ─── Config visual por raridade ───────────────────────────────────────────────

const RARITY_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  E:   { label: 'Comum',    color: '#94a3b8', border: 'border-slate-600/40' },
  D:   { label: 'Raro',     color: '#3b82f6', border: 'border-blue-500/30'  },
  C:   { label: 'Épico',    color: '#9944ff', border: 'border-purple-500/30' },
  B:   { label: 'Lendário', color: '#f59e0b', border: 'border-amber-500/30'  },
  A:   { label: 'Mítico',   color: '#ec4899', border: 'border-pink-500/30'   },
  S:   { label: 'S-Rank',   color: '#00ffff', border: 'border-cyan-500/30'   },
  SS:  { label: 'SS-Rank',  color: '#ff8844', border: 'border-orange-500/30' },
  SSS: { label: 'SSS-Rank', color: '#ff4466', border: 'border-red-500/30'    },
  common:    { label: 'Comum',    color: '#94a3b8', border: 'border-slate-600/40' },
  rare:      { label: 'Raro',     color: '#3b82f6', border: 'border-blue-500/30'  },
  epic:      { label: 'Épico',    color: '#9944ff', border: 'border-purple-500/30' },
  legendary: { label: 'Lendário', color: '#fbbf24', border: 'border-yellow-500/30' },
}

const DEFAULT_RARITY = { label: 'Item', color: '#888', border: 'border-slate-800' }

type FilterType = 'todos' | 'boost' | 'consumable' | 'special'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const system = useSystem()
  const [filter,       setFilter]       = useState<FilterType>('todos')
  const [confirmItem,  setConfirmItem]  = useState<string | null>(null)

  if (!system) {
    return (
      <div className="p-8 font-mono bg-black text-white min-h-screen flex items-center justify-center italic uppercase tracking-widest animate-pulse">
        [ERRO_DE_SINCRONIA]: Sistema de Contexto não detectado...
      </div>
    )
  }

  const { inventory, useItem, activeBoosts } = system

  // Filtrar por tipo
  const filtered = useMemo(() => {
    if (filter === 'todos') return inventory
    return inventory.filter(i => i.type === filter)
  }, [inventory, filter])

  // Contadores por tipo
  const counts = useMemo(() => ({
    todos:      inventory.length,
    boost:      inventory.filter(i => i.type === 'boost').length,
    consumable: inventory.filter(i => i.type === 'consumable').length,
    special:    inventory.filter(i => i.type === 'special').length,
  }), [inventory])

  function handleUseItem(id: string) {
    useItem(id)
    setConfirmItem(null)
  }

  const FILTER_TABS: { id: FilterType; label: string }[] = [
    { id: 'todos',      label: `Todos (${counts.todos})`           },
    { id: 'boost',      label: `Boosts (${counts.boost})`          },
    { id: 'consumable', label: `Consumíveis (${counts.consumable})` },
    { id: 'special',    label: `Especiais (${counts.special})`      },
  ]

  return (
    <div className="p-4 md:p-8 font-mono min-h-screen bg-black text-white relative pb-32">

      {/* Modal de confirmação de uso */}
      {confirmItem && (() => {
        const item = inventory.find(i => i.id === confirmItem)
        if (!item) return null
        const cfg = RARITY_CONFIG[item.rarity] ?? DEFAULT_RARITY
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
              className="bg-slate-950 border p-6 max-w-sm w-full"
              style={{ borderColor: `${cfg.color}40` }}
            >
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-4">
                Confirmar Uso
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{item.icon || '📦'}</span>
                <div>
                  <p className="font-black uppercase text-sm" style={{ color: cfg.color }}>
                    {item.name}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{item.description}</p>
                  {item.duration && (
                    <p className="text-[8px] text-cyan-700 mt-1">
                      Duração: {item.duration >= 60 ? `${item.duration / 60}h` : `${item.duration}min`}
                    </p>
                  )}
                </div>
              </div>
              {item.qty > 1 && (
                <p className="text-[8px] text-slate-600 mb-4">
                  Você possui <span className="text-white font-bold">{item.qty}</span> unidades.
                  Restará {item.qty - 1} após usar.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleUseItem(item.id)}
                  className="flex-1 py-3 border font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-all"
                  style={{ borderColor: `${cfg.color}60`, color: cfg.color, background: `${cfg.color}10` }}
                >
                  Usar Item
                </button>
                <button
                  onClick={() => setConfirmItem(null)}
                  className="flex-1 py-3 border border-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-slate-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-900/50 pb-6 gap-4">
        <div>
          <p className="text-cyan-500 text-[10px] font-black tracking-[0.5em] uppercase mb-2">
            Storage Protocol: Delta-01
          </p>
          <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase">
            INVENTÁRIO <span className="text-cyan-500 font-light not-italic">S-RANK</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-slate-950 border border-cyan-900/30 text-[10px] text-slate-500 uppercase font-bold">
            {inventory.length} / 50 itens
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 px-4 py-2 border border-cyan-500/40 text-cyan-400 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
          >
            <ShoppingBag size={12} /> Ir à Loja
          </Link>
        </div>
      </div>

      {/* Boosts ativos */}
      {Object.entries(activeBoosts).some(([, v]) => v > Date.now()) && (
        <div className="mb-6 p-3 border border-yellow-900/40 bg-yellow-950/10">
          <p className="text-[8px] text-yellow-600 uppercase tracking-widest font-black mb-2 flex items-center gap-1">
            <Zap size={10} /> Boosts ativos agora
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeBoosts)
              .filter(([, v]) => v > Date.now())
              .map(([k]) => (
                <span
                  key={k}
                  className="text-[8px] px-2 py-1 border border-yellow-600/40 text-yellow-500 bg-yellow-950/20 font-bold uppercase"
                >
                  {k.replace(/_/g, ' ')}
                </span>
              ))
            }
          </div>
        </div>
      )}

      {/* Filtros */}
      {inventory.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter size={12} className="text-slate-600" />
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
                filter === tab.id
                  ? 'bg-cyan-500 text-black border-cyan-500'
                  : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Vazio */}
      {inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 border border-dashed border-cyan-900/20 bg-slate-950/10 gap-4">
          <Package className="text-cyan-900/30" size={48} />
          <p className="text-cyan-900 font-black uppercase text-[10px] tracking-widest">
            Inventário Vazio
          </p>
          <Link
            href="/shop"
            className="flex items-center gap-2 px-4 py-2 border border-cyan-500/30 text-cyan-600 font-black text-[9px] uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
          >
            <ShoppingBag size={11} /> Comprar itens na loja
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-900">
          <Package className="text-slate-800" size={36} />
          <p className="text-slate-700 font-black uppercase text-[10px] tracking-widest mt-3">
            Nenhum item nesta categoria
          </p>
        </div>
      ) : (
        /* Grid de itens */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(item => {
            const cfg      = RARITY_CONFIG[item.rarity] ?? DEFAULT_RARITY
            const isBoost  = item.type === 'boost'
            const boostOn  = item.boostType && (activeBoosts[item.boostType] ?? 0) > Date.now()

            return (
              <div
                key={item.id}
                className={`group relative bg-slate-950 border aspect-square flex flex-col items-center justify-center transition-all duration-300 overflow-hidden cursor-pointer ${cfg.border} hover:border-opacity-80`}
                style={boostOn ? { boxShadow: `0 0 12px ${cfg.color}30` } : {}}
                onClick={() => setConfirmItem(item.id)}
              >
                {/* Badge de quantidade */}
                {item.qty > 1 && (
                  <div className="absolute top-1.5 right-1.5 z-20 bg-black border border-slate-700 text-[8px] font-black text-cyan-400 px-1 leading-snug">
                    x{item.qty}
                  </div>
                )}

                {/* Badge boost ativo */}
                {boostOn && (
                  <div className="absolute top-1.5 left-1.5 z-20">
                    <Zap size={10} className="text-yellow-400" />
                  </div>
                )}

                {/* Raridade badge */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: cfg.color }}
                />

                {/* Info do item */}
                <div className="flex flex-col items-center group-hover:opacity-20 transition-opacity duration-300 pointer-events-none px-2">
                  <span className="text-3xl mb-1.5">{item.icon || '📦'}</span>
                  <p className="text-[7px] text-center uppercase font-black text-slate-400 leading-tight line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-[6px] mt-0.5 font-bold" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>
                </div>

                {/* Overlay hover — botão de uso */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/70 backdrop-blur-[2px] transition-all duration-200">
                  <div
                    className="p-2.5 rounded-full border-2 shadow-lg mb-1.5"
                    style={{
                      borderColor: isBoost ? '#eab308' : cfg.color,
                      boxShadow:   `0 0 16px ${isBoost ? '#eab30840' : cfg.color + '40'}`,
                    }}
                  >
                    <Play
                      size={18}
                      style={{
                        color:       isBoost ? '#eab308' : cfg.color,
                        fill:        isBoost ? '#eab308' : cfg.color,
                      }}
                    />
                  </div>
                  <span
                    className="text-[8px] font-black uppercase tracking-tighter"
                    style={{ color: isBoost ? '#eab308' : cfg.color }}
                  >
                    {isBoost ? 'ATIVAR' : 'USAR'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}