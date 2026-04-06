'use client'
import { useState, useEffect } from 'react'
import { useSystem } from '../../context/SystemContext'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { Lock, User, Ghost, Info } from 'lucide-react'

export default function ProfilePage() {
  const system = useSystem()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !system) return <div className="min-h-screen bg-black flex items-center justify-center italic text-cyan-900">Sincronizando...</div>

  const { stats, level, rank } = system

  const chartData = [
    { subject: 'STR', A: stats.strength },
    { subject: 'AGI', A: stats.agility },
    { subject: 'INT', A: stats.intelligence },
    { subject: 'VIT', A: stats.vitality },
    { subject: 'MEN', A: stats.mentality },
    { subject: 'REF', A: stats.reflex },
  ]

  return (
    <div className="p-8 font-mono bg-black text-white min-h-screen pb-40">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* SEÇÃO 1: ATRIBUTOS E GRÁFICO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-950/40 border border-slate-900 p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-black italic uppercase text-cyan-500 tracking-tighter">Status_Player</h1>
              <p className="text-slate-500 text-[10px] tracking-[0.5em]">NÍVEL {level} | RANK {rank}</p>
            </header>

            <div className="space-y-5">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-cyan-400">{value}</span>
                  </div>
                  <div className="h-[2px] bg-slate-900 w-full overflow-hidden">
                    <div className="h-full bg-cyan-600" style={{ width: `${Math.min((value / 300) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* INFO DE RANK S */}
            <div className="mt-10 p-4 border border-yellow-900/30 bg-yellow-950/5 rounded-sm flex gap-4">
              <Info className="text-yellow-600 shrink-0" size={18} />
              <p className="text-[9px] text-yellow-500/80 leading-relaxed uppercase font-bold">
                <span className="text-yellow-500">Protocolo de Ascensão:</span> Ao atingir o <span className="underline">Rank S</span>, você poderá resetar seu NV/XP para adquirir um <span className="text-white font-black">Seguidor de Sombras</span>. O seguidor dobra o XP de todas as missões e permite personalização de codinome.
              </p>
            </div>
          </div>

          {/* GRÁFICO DE EVOLUÇÃO */}
          <div className="bg-slate-950/20 border border-slate-900 p-8 flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-500 tracking-widest">Distribuição_de_Potencial</h2>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
                  <Radar dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: ÁREA DA SOMBRA (RESERVADO) */}
        <div className="relative group">
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800">
             <Lock className="text-slate-700 mb-2 animate-pulse" size={32} />
             <span className="text-slate-600 font-black tracking-[0.5em] uppercase text-xs">Reservado para Rank S e Acima</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-20 filter grayscale">
            <div className="p-8 border border-slate-900 bg-black">
               <h2 className="text-2xl font-black italic text-slate-700 uppercase">Shadow_Stats</h2>
               <div className="mt-4 space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-900 w-full" />)}
               </div>
            </div>
            <div className="p-8 border border-slate-900 bg-black flex items-center justify-center">
               <Ghost size={80} className="text-slate-900" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}