'use client'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useSystem } from '@/app/context/SystemContext'
import { Package, Box, Play } from 'lucide-react'

export default function InventoryPage() {
  const system = useSystem()
  
  if (!system) {
    return (
      <div className="p-8 font-mono bg-black text-white min-h-screen flex items-center justify-center italic uppercase tracking-widest animate-pulse">
        [ERRO_DE_SINCRONIA]: Sistema de Contexto não detectado...
      </div>
    )
  }

  const { inventory, useItem } = system

  const handleAction = (e: React.MouseEvent, id: string, name: string) => {
    // Interrompe qualquer outro evento pai
    e.preventDefault()
    e.stopPropagation()
    
    console.log(`[SISTEMA]: Ativando: ${name}`);
    useItem(id);
  };

  return (
    <div className="p-8 font-mono min-h-screen bg-black text-white relative">
      <div className="scanline pointer-events-none" />

      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-900/50 pb-6">
        <div>
          <p className="text-cyan-500 text-[10px] font-black tracking-[0.5em] uppercase mb-2 animate-in slide-in-from-left duration-500">
            Storage Protocol: Delta-01
          </p>
          <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase">
            INVENTÁRIO <span className="text-cyan-500 font-light not-italic">S-RANK</span>
          </h1>
        </div>
        <div className="mt-4 px-3 py-1 bg-slate-950 border border-cyan-900/30 text-[10px] text-slate-500 uppercase font-bold">
          Capacidade: {inventory.length} / 50
        </div>
      </div>

      {/* GRADE DE ITENS */}
      {inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 border border-dashed border-cyan-900/20 bg-slate-950/10">
          <Package className="text-cyan-900/30 mb-4" size={48} />
          <p className="text-cyan-900 font-black uppercase text-[10px] tracking-widest">Vazio</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {inventory.map((item, index) => {
            const isBoost = item.type === 'boost';
            
            return (
              <div 
                key={`${item.id}-${index}`} 
                className="group relative bg-slate-950 border border-cyan-900/30 aspect-square flex flex-col items-center justify-center transition-all duration-300 hover:border-white/50 overflow-hidden"
              >
                {/* Info do Item (Visual) */}
                <div className="flex flex-col items-center group-hover:opacity-20 transition-opacity duration-300 pointer-events-none">
                  <span className="text-4xl mb-2">{item.icon || '📦'}</span>
                  <p className="text-[7px] text-center uppercase font-black px-2">{item.name}</p>
                </div>

                {/* BOTÃO DE AÇÃO REAL (OCUPA O CARD TODO) */}
                <button 
                  type="button"
                  onClick={(e) => handleAction(e, item.id, item.name)}
                  className="absolute inset-0 z-[100] w-full h-full bg-transparent flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-black/60 backdrop-blur-[2px] transition-all duration-200 cursor-pointer border-none outline-none"
                >
                  <div className={`p-2 rounded-full bg-black border-2 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-transform active:scale-90 ${isBoost ? 'border-yellow-500 shadow-yellow-500/20' : 'border-cyan-500'}`}>
                    <Play size={20} className={isBoost ? 'text-yellow-500 fill-yellow-500' : 'text-cyan-500 fill-cyan-500'} />
                  </div>
                  <span className={`text-[10px] font-black mt-2 tracking-tighter ${isBoost ? 'text-yellow-500' : 'text-cyan-500'}`}>
                    {isBoost ? 'EXECUTAR' : 'USAR'}
                  </span>
                </button>

                {/* Barra Inferior Decorativa */}
                <div className={`absolute bottom-0 left-0 w-full h-1 pointer-events-none ${isBoost ? 'bg-yellow-600' : 'bg-cyan-600'}`} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}