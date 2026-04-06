'use client'
import { useState, useEffect } from 'react'
import { useSystem } from '../../context/SystemContext'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { Lock, User, Ghost, Info, Trophy } from 'lucide-react'

// 100 titles based on mission count and attributes
const TITLES_DATABASE = [
  // By missions completed (counters.missions)
  { id: 't1',  name: 'Iniciante',          condition: (s: any) => s.missions >= 1,    description: 'Completou a primeira missão' },
  { id: 't2',  name: 'Aprendiz',           condition: (s: any) => s.missions >= 5,    description: '5 missões concluídas' },
  { id: 't3',  name: 'Caçador Novato',     condition: (s: any) => s.missions >= 10,   description: '10 missões concluídas' },
  { id: 't4',  name: 'Caçador Ativo',      condition: (s: any) => s.missions >= 25,   description: '25 missões concluídas' },
  { id: 't5',  name: 'Veterano',           condition: (s: any) => s.missions >= 50,   description: '50 missões concluídas' },
  { id: 't6',  name: 'Caçador de Elite',   condition: (s: any) => s.missions >= 100,  description: '100 missões concluídas' },
  { id: 't7',  name: 'Mestre Caçador',     condition: (s: any) => s.missions >= 200,  description: '200 missões concluídas' },
  { id: 't8',  name: 'Lenda',              condition: (s: any) => s.missions >= 500,  description: '500 missões concluídas' },
  { id: 't9',  name: 'Monarca das Sombras', condition: (s: any) => s.missions >= 1000, description: '1000 missões concluídas' },
  
  // By physical attribute (strength + agility)
  { id: 't10', name: 'Corpo de Ferro',     condition: (s: any) => s.stats.strength >= 10,  description: 'Força nível 10' },
  { id: 't11', name: 'Músculos de Aço',    condition: (s: any) => s.stats.strength >= 25,  description: 'Força nível 25' },
  { id: 't12', name: 'Guerreiro Físico',   condition: (s: any) => s.stats.strength >= 50,  description: 'Força nível 50' },
  { id: 't13', name: 'Titã',              condition: (s: any) => s.stats.strength >= 100, description: 'Força nível 100' },
  { id: 't14', name: 'Pés Velozes',        condition: (s: any) => s.stats.agility >= 10,   description: 'Agilidade nível 10' },
  { id: 't15', name: 'Sombra Rápida',      condition: (s: any) => s.stats.agility >= 25,   description: 'Agilidade nível 25' },
  { id: 't16', name: 'Relâmpago',          condition: (s: any) => s.stats.agility >= 50,   description: 'Agilidade nível 50' },
  
  // By intelligence
  { id: 't17', name: 'Estudioso',          condition: (s: any) => s.stats.intelligence >= 10,  description: 'Inteligência nível 10' },
  { id: 't18', name: 'Pesquisador',        condition: (s: any) => s.stats.intelligence >= 25,  description: 'Inteligência nível 25' },
  { id: 't19', name: 'Arquiteto do Saber', condition: (s: any) => s.stats.intelligence >= 50,  description: 'Inteligência nível 50' },
  { id: 't20', name: 'Oráculo',            condition: (s: any) => s.stats.intelligence >= 100, description: 'Inteligência nível 100' },
  
  // By mentality
  { id: 't21', name: 'Mente Focada',       condition: (s: any) => s.stats.mentality >= 10,  description: 'Mentalidade nível 10' },
  { id: 't22', name: 'Disciplinado',       condition: (s: any) => s.stats.mentality >= 25,  description: 'Mentalidade nível 25' },
  { id: 't23', name: 'Monge Guerreiro',    condition: (s: any) => s.stats.mentality >= 50,  description: 'Mentalidade nível 50' },
  
  // By vitality
  { id: 't24', name: 'Saudável',           condition: (s: any) => s.stats.vitality >= 10, description: 'Vitalidade nível 10' },
  { id: 't25', name: 'Resistente',         condition: (s: any) => s.stats.vitality >= 25, description: 'Vitalidade nível 25' },
  { id: 't26', name: 'Imortal',            condition: (s: any) => s.stats.vitality >= 50, description: 'Vitalidade nível 50' },
  
  // By level
  { id: 't27', name: 'Nível 5',            condition: (s: any) => s.level >= 5,   description: 'Alcançou nível 5' },
  { id: 't28', name: 'Nível 10',           condition: (s: any) => s.level >= 10,  description: 'Alcançou nível 10' },
  { id: 't29', name: 'Nível 20',           condition: (s: any) => s.level >= 20,  description: 'Alcançou nível 20' },
  { id: 't30', name: 'Nível 50',           condition: (s: any) => s.level >= 50,  description: 'Alcançou nível 50' },
  { id: 't31', name: 'Nível 100',          condition: (s: any) => s.level >= 100, description: 'Alcançou nível 100' },
  
  // By hydration (water)
  { id: 't32', name: 'Hidratado',          condition: (s: any) => s.counters.water >= 10,  description: '10L de água consumidos' },
  { id: 't33', name: 'Fonte de Vida',      condition: (s: any) => s.counters.water >= 50,  description: '50L de água consumidos' },
  { id: 't34', name: 'Oceano Ambulante',   condition: (s: any) => s.counters.water >= 200, description: '200L de água consumidos' },
  
  // By pushups
  { id: 't35', name: 'Braços de Ferro',    condition: (s: any) => s.counters.pushups >= 100,  description: '100 flexões realizadas' },
  { id: 't36', name: 'Máquina de Flexões', condition: (s: any) => s.counters.pushups >= 500,  description: '500 flexões realizadas' },
  { id: 't37', name: 'Rei das Flexões',    condition: (s: any) => s.counters.pushups >= 2000, description: '2000 flexões realizadas' },
  
  // By reading
  { id: 't38', name: 'Leitor',             condition: (s: any) => s.counters.reading >= 60,   description: '60min de leitura' },
  { id: 't39', name: 'Bibliógrafo',        condition: (s: any) => s.counters.reading >= 300,  description: '300min de leitura' },
  { id: 't40', name: 'Devorador de Livros', condition: (s: any) => s.counters.reading >= 1000, description: '1000min de leitura' },
  
  // By squats
  { id: 't41', name: 'Pernas de Aço',      condition: (s: any) => s.counters.squats >= 100,  description: '100 agachamentos' },
  { id: 't42', name: 'Atleta',             condition: (s: any) => s.counters.squats >= 500,  description: '500 agachamentos' },
  
  // By gold
  { id: 't43', name: 'Comerciante',        condition: (s: any) => s.gold >= 5000,   description: '5.000 gold acumulados' },
  { id: 't44', name: 'Rico',               condition: (s: any) => s.gold >= 20000,  description: '20.000 gold acumulados' },
  { id: 't45', name: 'Magnata',            condition: (s: any) => s.gold >= 100000, description: '100.000 gold acumulados' },
  
  // By rank
  { id: 't46', name: 'Rank E',             condition: (s: any) => s.rankIndex >= 2,  description: 'Alcançou Rank E' },
  { id: 't47', name: 'Rank D',             condition: (s: any) => s.rankIndex >= 5,  description: 'Alcançou Rank D' },
  { id: 't48', name: 'Rank C',             condition: (s: any) => s.rankIndex >= 8,  description: 'Alcançou Rank C' },
  { id: 't49', name: 'Rank B',             condition: (s: any) => s.rankIndex >= 11, description: 'Alcançou Rank B' },
  { id: 't50', name: 'Rank A',             condition: (s: any) => s.rankIndex >= 14, description: 'Alcançou Rank A' },
  { id: 't51', name: 'Rank S',             condition: (s: any) => s.rankIndex >= 17, description: 'Alcançou Rank S' },
  { id: 't52', name: 'Monarca Supremo',    condition: (s: any) => s.rankIndex >= 20, description: 'Alcançou Rank SS' },
  
  // By body control
  { id: 't53', name: 'Equilibrista',       condition: (s: any) => s.stats.bodyControl >= 10, description: 'Controle Corporal nível 10' },
  { id: 't54', name: 'Acrobata',           condition: (s: any) => s.stats.bodyControl >= 25, description: 'Controle Corporal nível 25' },
  
  // By faith
  { id: 't55', name: 'Devoto',             condition: (s: any) => s.stats.faith >= 10, description: 'Fé nível 10' },
  { id: 't56', name: 'Iluminado',          condition: (s: any) => s.stats.faith >= 25, description: 'Fé nível 25' },
  
  // Multi-attribute titles
  { id: 't57', name: 'Completo',           condition: (s: any) => Object.values(s.stats).every((v: any) => v >= 5), description: 'Todos os atributos nível 5+' },
  { id: 't58', name: 'Equilibrado',        condition: (s: any) => Object.values(s.stats).every((v: any) => v >= 15), description: 'Todos os atributos nível 15+' },
  { id: 't59', name: 'Perfeito',           condition: (s: any) => Object.values(s.stats).every((v: any) => v >= 30), description: 'Todos os atributos nível 30+' },
  
  // By meditation/focus
  { id: 't60', name: 'Meditador',          condition: (s: any) => s.counters.meditation >= 10, description: '10 sessões de meditação' },
  { id: 't61', name: 'Zen',               condition: (s: any) => s.counters.meditation >= 50,  description: '50 sessões de meditação' },
  { id: 't62', name: 'Mestre Zen',         condition: (s: any) => s.counters.focus >= 30,       description: '30 sessões sem celular' },
]

const STAT_LABELS_PT: Record<string, string> = {
  strength: 'Força', agility: 'Agilidade', intelligence: 'Inteligência',
  vitality: 'Vitalidade', mentality: 'Mentalidade', reflex: 'Reflexo',
  perception: 'Percepção', faith: 'Fé', bodyControl: 'Controle Corporal',
}

export default function ProfilePage() {
  const system = useSystem()
  const [mounted, setMounted] = useState(false)
  const [showAllTitles, setShowAllTitles] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !system) return <div className="min-h-screen bg-black flex items-center justify-center italic text-cyan-900">Sincronizando...</div>

  const { stats, level, rank, rankIndex, gold, counters } = system

  const chartData = [
    { subject: 'FOR', A: stats.strength },
    { subject: 'AGI', A: stats.agility },
    { subject: 'INT', A: stats.intelligence },
    { subject: 'VIT', A: stats.vitality },
    { subject: 'MEN', A: stats.mentality },
    { subject: 'REF', A: stats.reflex },
  ]

  // Calculate unlocked titles
  const context = { missions: counters.missions || 0, stats, level, rankIndex, gold, counters }
  const unlockedTitles = TITLES_DATABASE.filter(t => {
    try { return t.condition(context) } catch { return false }
  })
  const displayTitles = showAllTitles ? TITLES_DATABASE : TITLES_DATABASE.slice(0, 20)

  return (
    <div className="font-mono bg-black text-white min-h-screen pb-40">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* ATRIBUTOS E GRÁFICO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-950/40 border border-slate-900 p-8">
            <header className="mb-8">
              {/* TITULO ALTERADO */}
              <h1 className="text-3xl font-black italic uppercase text-cyan-500 tracking-tighter">Perfil do Caçador</h1>
              <p className="text-slate-500 text-[10px] tracking-[0.5em]">NÍVEL {level} | RANK {rank}</p>
            </header>

            <div className="space-y-5">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                    {/* ATRIBUTOS EM PORTUGUÊS */}
                    <span className="text-slate-500">{STAT_LABELS_PT[key] || key}</span>
                    <span className="text-cyan-400">{value}</span>
                  </div>
                  <div className="h-[2px] bg-slate-900 w-full overflow-hidden">
                    <div className="h-full bg-cyan-600" style={{ width: `${Math.min((value / 300) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-4 border border-yellow-900/30 bg-yellow-950/5 rounded-sm flex gap-4">
              <Info className="text-yellow-600 shrink-0" size={18} />
              <p className="text-[9px] text-yellow-500/80 leading-relaxed uppercase font-bold">
                <span className="text-yellow-500">Protocolo de Ascensão:</span> Ao atingir o <span className="underline">Rank S</span>, você poderá resetar seu NV/XP para extrair uma <span className="text-white font-black">Sombra</span>. Cada sombra concede +5% XP global permanentemente.
              </p>
            </div>
          </div>

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

        {/* TÍTULOS */}
        <div className="bg-slate-950/40 border border-slate-900 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase text-yellow-500 flex items-center gap-3">
              <Trophy size={20} /> Títulos
            </h2>
            <p className="text-[10px] text-slate-500">{unlockedTitles.length} / {TITLES_DATABASE.length} desbloqueados</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {displayTitles.map(title => {
              const unlocked = unlockedTitles.find(t => t.id === title.id)
              return (
                <div key={title.id}
                  className={`p-3 border text-center transition-all ${
                    unlocked
                      ? 'border-yellow-600/40 bg-yellow-950/20'
                      : 'border-slate-900 bg-slate-950/20 opacity-40'
                  }`}>
                  <p className={`text-[10px] font-black uppercase ${unlocked ? 'text-yellow-400' : 'text-slate-600'}`}>
                    {title.name}
                  </p>
                  <p className="text-[7px] text-slate-700 mt-1 leading-tight">{title.description}</p>
                  {unlocked && <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mt-2" />}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setShowAllTitles(!showAllTitles)}
            className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors border border-slate-800 px-4 py-2"
          >
            {showAllTitles ? 'Ver menos' : `Ver todos os ${TITLES_DATABASE.length} títulos`}
          </button>
        </div>

        {/* RANK S LOCKED */}
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