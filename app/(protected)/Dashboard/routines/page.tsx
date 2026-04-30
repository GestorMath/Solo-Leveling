'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useSystem } from '@/app/context/SystemContext'
import { type StatKey } from '@/app/context/SystemContext'
import { Plus, Trash2, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'

// ... resto do código igual

const CATEGORIAS: { key: StatKey; label: string; color: string }[] = [
  { key: 'strength',     label: 'Força',              color: '#ff4466' },
  { key: 'agility',      label: 'Agilidade',          color: '#00ffff' },
  { key: 'intelligence', label: 'Inteligência',       color: '#9944ff' },
  { key: 'vitality',     label: 'Vitalidade',         color: '#44ff88' },
  { key: 'mentality',    label: 'Mentalidade',        color: '#4488ff' },
  { key: 'reflex',       label: 'Reflexo',            color: '#ff8844' },
  { key: 'perception',   label: 'Percepção',          color: '#ffaa44' },
  { key: 'faith',        label: 'Fé',                 color: '#ffdd00' },
  { key: 'bodyControl',  label: 'Controle Corporal',  color: '#00dddd' },
]

export default function RoutinesPage() {
  const { routines, addRoutine, removeRoutine, completeRoutine } = useSystem()
  const [title,    setTitle]    = useState('')
  const [category, setCategory] = useState<StatKey>('strength')
  const [error,    setError]    = useState('')

  function handleAdd() {
    const t = title.trim()
    if (!t || t.length < 2) { setError('Nome deve ter ao menos 2 caracteres.'); return }
    if (routines.length >= 15) { setError('Limite de 15 rotinas atingido.'); return }
    setError('')
    addRoutine(t, category)
    setTitle('')
  }

  const catColor = CATEGORIAS.find(c => c.key === category)?.color ?? '#00ffff'

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">
      <header className="mb-8 pb-5 border-b border-cyan-900/30">
        <Link href="/Dashboard" className="flex items-center gap-2 text-[9px] text-slate-600 hover:text-cyan-400 transition-colors mb-3 uppercase tracking-widest">
          <ArrowLeft size={12} /> Voltar ao Dashboard
        </Link>
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Contratos do Sistema</p>
        <h1 className="text-2xl font-black italic uppercase tracking-tight">
          Rotinas <span className="text-orange-500">Personalizadas</span>
        </h1>
        <p className="text-[10px] text-slate-500 mt-1">Cada rotina completada concede +50 XP no atributo vinculado.</p>
      </header>

      {/* Formulário */}
      <div className="max-w-md bg-slate-950 border border-slate-900 p-5 mb-8 space-y-4">
        <h2 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">// Nova Rotina</h2>

        <div>
          <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-2 block">Título</label>
          <input
            type="text" value={title}
            onChange={e => { setTitle(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            maxLength={40} placeholder="Ex: Lavar a louça, Estudar 30min..."
            className="w-full bg-black border border-slate-800 px-3 py-2.5 text-sm text-cyan-300 outline-none focus:border-cyan-500 font-mono placeholder:text-slate-800"
          />
        </div>

        <div>
          <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-2 block">Atributo Vinculado</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIAS.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className="px-2 py-1.5 text-[8px] font-black uppercase tracking-wide border transition-all"
                style={category === c.key
                  ? { borderColor: c.color, background: `${c.color}15`, color: c.color }
                  : { borderColor: 'rgba(51,65,85,0.5)', color: '#475569' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-[9px] text-red-400">// {error}</p>}

        <button onClick={handleAdd} disabled={!title.trim() || routines.length >= 15}
          className="w-full py-2.5 border font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ borderColor: `${catColor}60`, background: `${catColor}10`, color: catColor }}>
          <Plus size={13} /> Adicionar Rotina
        </button>
        <p className="text-[7px] text-slate-800 text-right">{routines.length}/15 rotinas</p>
      </div>

      {/* Lista */}
      <div className="max-w-md space-y-2">
        <h2 className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-3">
          // Rotinas Ativas ({routines.length})
        </h2>

        {routines.length === 0 && (
          <p className="text-[9px] text-slate-700 italic py-6 text-center border border-dashed border-slate-900 uppercase">
            Nenhuma rotina criada ainda
          </p>
        )}

        {routines.map(r => {
          const cat = CATEGORIAS.find(c => c.key === r.category)
          return (
            <div key={r.id} className="flex items-center gap-3 p-3 border border-slate-900 hover:border-slate-700 transition-all"
              style={r.completedToday ? { opacity: 0.5 } : {}}>
              <button
                onClick={() => !r.completedToday && completeRoutine(r.id)}
                disabled={r.completedToday}
                className="w-6 h-6 border flex items-center justify-center flex-shrink-0 transition-all"
                style={r.completedToday
                  ? { borderColor: '#22c55e', background: 'rgba(34,197,94,0.15)' }
                  : { borderColor: cat?.color ?? '#475569' }}
              >
                {r.completedToday && <Check size={12} className="text-green-500" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold truncate ${r.completedToday ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                  {r.title}
                </p>
                <p className="text-[8px] uppercase tracking-wide mt-0.5" style={{ color: cat?.color ?? '#475569' }}>
                  {cat?.label ?? r.category}
                </p>
              </div>
              <button onClick={() => removeRoutine(r.id)} className="text-slate-800 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}