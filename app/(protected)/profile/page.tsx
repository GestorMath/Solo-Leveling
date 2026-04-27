'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSystem } from '../../context/SystemContext'
import {
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar,
} from 'recharts'
import { Lock, User, Trophy, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Títulos ──────────────────────────────────────────────────────────────────

const TITLES = [
  // Por missões
  { id: 't1',  name: 'Iniciante',           cond: (s: any) => s.missions >= 1,    desc: 'Completou a primeira missão'       },
  { id: 't2',  name: 'Aprendiz',            cond: (s: any) => s.missions >= 5,    desc: '5 missões concluídas'              },
  { id: 't3',  name: 'Caçador Novato',      cond: (s: any) => s.missions >= 10,   desc: '10 missões concluídas'             },
  { id: 't4',  name: 'Caçador Ativo',       cond: (s: any) => s.missions >= 25,   desc: '25 missões concluídas'             },
  { id: 't5',  name: 'Veterano',            cond: (s: any) => s.missions >= 50,   desc: '50 missões concluídas'             },
  { id: 't6',  name: 'Caçador de Elite',    cond: (s: any) => s.missions >= 100,  desc: '100 missões concluídas'            },
  { id: 't7',  name: 'Mestre Caçador',      cond: (s: any) => s.missions >= 200,  desc: '200 missões concluídas'            },
  { id: 't8',  name: 'Lenda',              cond: (s: any) => s.missions >= 500,  desc: '500 missões concluídas'            },
  { id: 't9',  name: 'Monarca das Sombras', cond: (s: any) => s.missions >= 1000, desc: '1000 missões concluídas'           },
  // Por força
  { id: 't10', name: 'Corpo de Ferro',      cond: (s: any) => s.stats.strength >= 10,  desc: 'Força nível 10'              },
  { id: 't11', name: 'Músculos de Aço',     cond: (s: any) => s.stats.strength >= 25,  desc: 'Força nível 25'              },
  { id: 't12', name: 'Guerreiro Físico',    cond: (s: any) => s.stats.strength >= 50,  desc: 'Força nível 50'              },
  { id: 't13', name: 'Titã',               cond: (s: any) => s.stats.strength >= 100, desc: 'Força nível 100'             },
  // Por agilidade
  { id: 't14', name: 'Pés Velozes',         cond: (s: any) => s.stats.agility >= 10,   desc: 'Agilidade nível 10'          },
  { id: 't15', name: 'Sombra Rápida',       cond: (s: any) => s.stats.agility >= 25,   desc: 'Agilidade nível 25'          },
  { id: 't16', name: 'Relâmpago',           cond: (s: any) => s.stats.agility >= 50,   desc: 'Agilidade nível 50'          },
  // Por inteligência
  { id: 't17', name: 'Estudioso',           cond: (s: any) => s.stats.intelligence >= 10,  desc: 'Inteligência nível 10'   },
  { id: 't18', name: 'Pesquisador',         cond: (s: any) => s.stats.intelligence >= 25,  desc: 'Inteligência nível 25'   },
  { id: 't19', name: 'Arquiteto do Saber',  cond: (s: any) => s.stats.intelligence >= 50,  desc: 'Inteligência nível 50'   },
  { id: 't20', name: 'Oráculo',             cond: (s: any) => s.stats.intelligence >= 100, desc: 'Inteligência nível 100'  },
  // Por mentalidade
  { id: 't21', name: 'Mente Focada',        cond: (s: any) => s.stats.mentality >= 10,  desc: 'Mentalidade nível 10'      },
  { id: 't22', name: 'Disciplinado',        cond: (s: any) => s.stats.mentality >= 25,  desc: 'Mentalidade nível 25'      },
  { id: 't23', name: 'Monge Guerreiro',     cond: (s: any) => s.stats.mentality >= 50,  desc: 'Mentalidade nível 50'      },
  // Por vitalidade
  { id: 't24', name: 'Saudável',            cond: (s: any) => s.stats.vitality >= 10, desc: 'Vitalidade nível 10'         },
  { id: 't25', name: 'Resistente',          cond: (s: any) => s.stats.vitality >= 25, desc: 'Vitalidade nível 25'         },
  { id: 't26', name: 'Imortal',             cond: (s: any) => s.stats.vitality >= 50, desc: 'Vitalidade nível 50'         },
  // Por level
  { id: 't27', name: 'Nível 5',             cond: (s: any) => s.level >= 5,   desc: 'Alcançou nível 5'                   },
  { id: 't28', name: 'Nível 10',            cond: (s: any) => s.level >= 10,  desc: 'Alcançou nível 10'                  },
  { id: 't29', name: 'Nível 20',            cond: (s: any) => s.level >= 20,  desc: 'Alcançou nível 20'                  },
  { id: 't30', name: 'Nível 50',            cond: (s: any) => s.level >= 50,  desc: 'Alcançou nível 50'                  },
  { id: 't31', name: 'Nível 100',           cond: (s: any) => s.level >= 100, desc: 'Alcançou nível 100'                 },
  // Por água
  { id: 't32', name: 'Hidratado',           cond: (s: any) => s.counters.water >= 10,  desc: '10L de água consumidos'     },
  { id: 't33', name: 'Fonte de Vida',       cond: (s: any) => s.counters.water >= 50,  desc: '50L de água consumidos'     },
  { id: 't34', name: 'Oceano Ambulante',    cond: (s: any) => s.counters.water >= 200, desc: '200L de água consumidos'    },
  // Por flexões
  { id: 't35', name: 'Braços de Ferro',     cond: (s: any) => s.counters.pushups >= 100,  desc: '100 flexões realizadas'  },
  { id: 't36', name: 'Máquina de Flexões',  cond: (s: any) => s.counters.pushups >= 500,  desc: '500 flexões realizadas'  },
  { id: 't37', name: 'Rei das Flexões',     cond: (s: any) => s.counters.pushups >= 2000, desc: '2000 flexões realizadas' },
  // Por leitura
  { id: 't38', name: 'Leitor',              cond: (s: any) => s.counters.reading >= 60,   desc: '60min de leitura'        },
  { id: 't39', name: 'Bibliógrafo',         cond: (s: any) => s.counters.reading >= 300,  desc: '300min de leitura'       },
  { id: 't40', name: 'Devorador de Livros', cond: (s: any) => s.counters.reading >= 1000, desc: '1000min de leitura'      },
  // Por agachamentos
  { id: 't41', name: 'Pernas de Aço',       cond: (s: any) => s.counters.squats >= 100, desc: '100 agachamentos'          },
  { id: 't42', name: 'Atleta',              cond: (s: any) => s.counters.squats >= 500, desc: '500 agachamentos'          },
  // Por gold
  { id: 't43', name: 'Comerciante',         cond: (s: any) => s.gold >= 5000,   desc: '5.000 gold acumulados'            },
  { id: 't44', name: 'Rico',                cond: (s: any) => s.gold >= 20000,  desc: '20.000 gold acumulados'           },
  { id: 't45', name: 'Magnata',             cond: (s: any) => s.gold >= 100000, desc: '100.000 gold acumulados'          },
  // Por rank
  { id: 't46', name: 'Rank E',              cond: (s: any) => s.rankIndex >= 2,  desc: 'Alcançou Rank E'                 },
  { id: 't47', name: 'Rank D',              cond: (s: any) => s.rankIndex >= 5,  desc: 'Alcançou Rank D'                 },
  { id: 't48', name: 'Rank C',              cond: (s: any) => s.rankIndex >= 8,  desc: 'Alcançou Rank C'                 },
  { id: 't49', name: 'Rank B',              cond: (s: any) => s.rankIndex >= 11, desc: 'Alcançou Rank B'                 },
  { id: 't50', name: 'Rank A',              cond: (s: any) => s.rankIndex >= 14, desc: 'Alcançou Rank A'                 },
  { id: 't51', name: 'Rank S',              cond: (s: any) => s.rankIndex >= 17, desc: 'Alcançou Rank S'                 },
  { id: 't52', name: 'Monarca Supremo',     cond: (s: any) => s.rankIndex >= 20, desc: 'Alcançou Rank SS'                },
  // Por controle corporal
  { id: 't53', name: 'Equilibrista',        cond: (s: any) => s.stats.bodyControl >= 10, desc: 'Controle Corporal nível 10' },
  { id: 't54', name: 'Acrobata',            cond: (s: any) => s.stats.bodyControl >= 25, desc: 'Controle Corporal nível 25' },
  // Por fé
  { id: 't55', name: 'Devoto',              cond: (s: any) => s.stats.faith >= 10, desc: 'Fé nível 10'                   },
  { id: 't56', name: 'Iluminado',           cond: (s: any) => s.stats.faith >= 25, desc: 'Fé nível 25'                   },
  // Por reflexo
  { id: 't57', name: 'Reflexo Aguçado',     cond: (s: any) => s.stats.reflex >= 10, desc: 'Reflexo nível 10'             },
  { id: 't58', name: 'Relâmpago Vivo',      cond: (s: any) => s.stats.reflex >= 25, desc: 'Reflexo nível 25'             },
  // Por percepção
  { id: 't59', name: 'Vigilante',           cond: (s: any) => s.stats.perception >= 10, desc: 'Percepção nível 10'       },
  { id: 't60', name: 'Olho de Águia',       cond: (s: any) => s.stats.perception >= 25, desc: 'Percepção nível 25'       },
  // Multi-atributo
  { id: 't61', name: 'Completo',            cond: (s: any) => Object.values(s.stats).every((v: any) => v >= 5),  desc: 'Todos atributos 5+'  },
  { id: 't62', name: 'Equilibrado',         cond: (s: any) => Object.values(s.stats).every((v: any) => v >= 15), desc: 'Todos atributos 15+' },
  { id: 't63', name: 'Perfeito',            cond: (s: any) => Object.values(s.stats).every((v: any) => v >= 30), desc: 'Todos atributos 30+' },
  // Por meditação
  { id: 't64', name: 'Meditador',           cond: (s: any) => s.counters.meditation >= 10, desc: '10 meditações'         },
  { id: 't65', name: 'Zen',                 cond: (s: any) => s.counters.meditation >= 50, desc: '50 meditações'         },
  // Por foco
  { id: 't66', name: 'Focado',              cond: (s: any) => s.counters.focus >= 10, desc: '10 sessões sem celular'     },
  { id: 't67', name: 'Mestre Zen',          cond: (s: any) => s.counters.focus >= 30, desc: '30 sessões sem celular'     },
]

const STAT_LABELS: Record<string, string> = {
  strength: 'Força', agility: 'Agilidade', intelligence: 'Inteligência',
  vitality: 'Vitalidade', mentality: 'Mentalidade', reflex: 'Reflexo',
  perception: 'Percepção', faith: 'Fé', bodyControl: 'Controle Corporal',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const system = useSystem()
  const [mounted, setMounted] = useState(false)
  const [showAllTitles, setShowAllTitles] = useState(false)
  const [filterUnlocked, setFilterUnlocked] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // IR-03: useMemo para evitar recalcular 67 condições a cada render
  const unlockedIds = useMemo(() => {
    if (!system) return new Set<string>()
    const ctx = {
      missions:  system.counters.missions  ?? 0,
      stats:     system.stats,
      level:     system.level,
      rankIndex: system.rankIndex,
      gold:      system.gold,
      counters:  system.counters,
    }
    return new Set(
      TITLES
        .filter(t => { try { return t.cond(ctx) } catch { return false } })
        .map(t => t.id)
    )
  }, [system?.counters, system?.stats, system?.level, system?.rankIndex, system?.gold])

  if (!mounted || !system) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center italic text-cyan-900 font-mono">
        Sincronizando...
      </div>
    )
  }

  const { stats, level, rank, rankIndex, gold, counters, shadowBonusPct } = system

  // FIX: Radar com todos os 9 atributos (antes só 6)
  const radarData = [
    { subject: 'FOR', A: stats.strength,    fullMark: 100 },
    { subject: 'AGI', A: stats.agility,     fullMark: 100 },
    { subject: 'INT', A: stats.intelligence,fullMark: 100 },
    { subject: 'VIT', A: stats.vitality,    fullMark: 100 },
    { subject: 'MEN', A: stats.mentality,   fullMark: 100 },
    { subject: 'REF', A: stats.reflex,      fullMark: 100 },
    { subject: 'PER', A: stats.perception,  fullMark: 100 },
    { subject: 'FÉ',  A: stats.faith,       fullMark: 100 },
    { subject: 'CC',  A: stats.bodyControl, fullMark: 100 },
  ]

  const displayTitles = filterUnlocked
    ? TITLES.filter(t => unlockedIds.has(t.id))
    : showAllTitles
      ? TITLES
      : TITLES.slice(0, 24)

  const totalStats = Object.values(stats).reduce((a, v) => a + v, 0)

  return (
    <div className="font-mono bg-black text-white min-h-screen pb-40">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* ── Atributos + Radar ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Atributos */}
          <div className="bg-slate-950/40 border border-slate-900 p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-black italic uppercase text-cyan-500 tracking-tighter">
                Perfil do Caçador
              </h1>
              <p className="text-slate-500 text-[10px] tracking-[0.5em]">
                NÍVEL {level} | RANK {rank} | {totalStats} pontos totais
              </p>
              {shadowBonusPct > 0 && (
                <p className="text-[9px] text-purple-400 font-bold mt-1">
                  ⚡ Bônus Shadow Army ativo: +{shadowBonusPct}% XP
                </p>
              )}
            </header>

            <div className="space-y-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                    <span className="text-slate-500">{STAT_LABELS[key] ?? key}</span>
                    <span className="text-cyan-400">{value}</span>
                  </div>
                  <div className="h-[2px] bg-slate-900 w-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 transition-all duration-700"
                      style={{ width: `${Math.min((value / 300) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Info de reset */}
            <div className="mt-8 p-4 border border-yellow-900/30 bg-yellow-950/5 flex gap-3">
              <span className="text-yellow-600 flex-shrink-0 mt-0.5">ℹ</span>
              <p className="text-[9px] text-yellow-500/80 leading-relaxed uppercase font-bold">
                <span className="text-yellow-500">Protocolo de Ascensão:</span> Ao atingir o{' '}
                <span className="underline">Rank S</span>, você pode extrair Sombras no Shadow Army.
                Cada sombra concede +5% XP global permanentemente.
              </p>
            </div>
          </div>

          {/* Radar — 9 atributos */}
          <div className="bg-slate-950/20 border border-slate-900 p-8 flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-500 tracking-widest">
              Distribuição_de_Potencial (9 atributos)
            </h2>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#475569', fontSize: 9 }}
                  />
                  <Radar
                    dataKey="A"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[8px] text-slate-700 mt-2 uppercase tracking-widest">
              FOR · AGI · INT · VIT · MEN · REF · PER · FÉ · CC
            </p>
          </div>
        </div>

        {/* ── Títulos ────────────────────────────────────────────────────────── */}
        <div className="bg-slate-950/40 border border-slate-900 p-8">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <h2 className="text-xl font-black uppercase text-yellow-500 flex items-center gap-3">
              <Trophy size={20} /> Títulos
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterUnlocked(v => !v)}
                className={`text-[9px] font-black uppercase tracking-widest border px-3 py-1.5 transition-all ${
                  filterUnlocked
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {filterUnlocked ? '★ Desbloqueados' : 'Todos'}
              </button>
              <p className="text-[10px] text-slate-500">
                {unlockedIds.size} / {TITLES.length} desbloqueados
              </p>
            </div>
          </div>

          {/* Barra de progresso dos títulos */}
          <div className="mb-6">
            <div className="h-1 bg-slate-900 overflow-hidden max-w-xs">
              <div
                className="h-full bg-yellow-500 transition-all duration-700"
                style={{ width: `${(unlockedIds.size / TITLES.length) * 100}%` }}
              />
            </div>
            <p className="text-[8px] text-slate-700 mt-1">
              {Math.round((unlockedIds.size / TITLES.length) * 100)}% completo
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {displayTitles.map(title => {
              const unlocked = unlockedIds.has(title.id)
              return (
                <div
                  key={title.id}
                  className={`p-3 border text-center transition-all ${
                    unlocked
                      ? 'border-yellow-600/40 bg-yellow-950/20'
                      : 'border-slate-900 bg-slate-950/20 opacity-35'
                  }`}
                >
                  <p className={`text-[10px] font-black uppercase leading-tight ${
                    unlocked ? 'text-yellow-400' : 'text-slate-600'
                  }`}>
                    {title.name}
                  </p>
                  <p className="text-[7px] text-slate-700 mt-1 leading-tight">{title.desc}</p>
                  {unlocked && (
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mx-auto mt-2" />
                  )}
                </div>
              )
            })}
          </div>

          {!filterUnlocked && (
            <button
              onClick={() => setShowAllTitles(v => !v)}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors border border-slate-800 px-4 py-2"
            >
              {showAllTitles
                ? <><ChevronUp size={12}/> Ver menos</>
                : <><ChevronDown size={12}/> Ver todos os {TITLES.length} títulos</>
              }
            </button>
          )}
        </div>

        {/* ── Shadow Stats — bloqueado ─────────────────────────────────────── */}
        <div className="relative group">
          <div className="absolute inset-0 bg-black/85 z-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800">
            <Lock className="text-slate-700 mb-2 animate-pulse" size={32} />
            <span className="text-slate-600 font-black tracking-[0.5em] uppercase text-xs text-center px-4">
              Reservado para Rank S e Acima
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-20 filter grayscale pointer-events-none">
            <div className="p-8 border border-slate-900 bg-black">
              <h2 className="text-2xl font-black italic text-slate-700 uppercase">Shadow_Stats</h2>
              <div className="mt-4 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-slate-900 w-full" />)}
              </div>
            </div>
            <div className="p-8 border border-slate-900 bg-black flex items-center justify-center">
              <User size={80} className="text-slate-900" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}