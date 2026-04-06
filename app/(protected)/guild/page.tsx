'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Users, Crown, Plus, X, Loader2, Copy, Check, Zap, LogOut } from 'lucide-react'
import { RANK_COLORS, RANK_NAMES } from '@/app/lib/RankConfig'

interface GuildMember {
  id: string; name: string; rank: string; level: number; xp: number; class: string
}
interface Guild {
  id: string; name: string; tag: string; description: string
  leader_id: string; members: string[]; created_at: string
}

export default function GuildPage() {
  const [mounted,    setMounted]    = useState(false)
  const [guild,      setGuild]      = useState<Guild | null>(null)
  const [members,    setMembers]    = useState<GuildMember[]>([])
  const [loading,    setLoading]    = useState(true)
  const [userId,     setUserId]     = useState('')
  const [copied,     setCopied]     = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [gName,      setGName]      = useState('')
  const [gTag,       setGTag]       = useState('')
  const [gDesc,      setGDesc]      = useState('')
  const [creating,   setCreating]   = useState(false)
  const [createErr,  setCreateErr]  = useState('')

  const [showJoin,   setShowJoin]   = useState(false)
  const [invCode,    setInvCode]    = useState('')
  const [joining,    setJoining]    = useState(false)
  const [joinErr,    setJoinErr]    = useState('')

  useEffect(() => {
    setMounted(true)
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const uid = session.user.id
      setUserId(uid)
      await loadGuild(uid)
      setLoading(false)
    }
    load()
  }, [])

  async function loadGuild(uid: string) {
    const { data } = await supabase
      .from('guilds')
      .select('*')
      .contains('members', [uid])
      .maybeSingle()
    if (!data) { setGuild(null); setMembers([]); return }
    setGuild(data)
    const { data: membersData } = await supabase
      .from('players')
      .select('id, name, rank, level, xp, class')
      .in('id', data.members)
      .order('xp', { ascending: false })
    setMembers(membersData ?? [])
  }

  async function handleCreate() {
    const name = gName.trim()
    const tag  = gTag.trim().toUpperCase()
    if (!name || !tag) { setCreateErr('Nome e tag são obrigatórios.'); return }
    if (tag.length > 4) { setCreateErr('Tag deve ter no máximo 4 letras.'); return }
    setCreating(true); setCreateErr('')
    const { data, error } = await supabase.from('guilds').insert({
      name, tag, description: gDesc.trim(),
      leader_id: userId, members: [userId],
      created_at: new Date().toISOString(),
    }).select().single()
    if (error) { setCreateErr(`Erro: ${error.message}`); setCreating(false); return }
    setGuild(data); setShowCreate(false); await loadGuild(userId); setCreating(false)
  }

  async function handleJoin() {
    if (!invCode.trim()) { setJoinErr('Insira o código de convite.'); return }
    setJoining(true); setJoinErr('')
    const { data } = await supabase.from('guilds').select('*').eq('id', invCode.trim()).maybeSingle()
    if (!data) { setJoinErr('Guild não encontrada.'); setJoining(false); return }
    if (data.members.includes(userId)) { setJoinErr('Você já é membro desta guild.'); setJoining(false); return }
    await supabase.from('guilds').update({ members: [...data.members, userId] }).eq('id', data.id)
    setShowJoin(false); await loadGuild(userId); setJoining(false)
  }

  async function handleLeave() {
    if (!guild) return
    const newMembers = guild.members.filter(m => m !== userId)
    await supabase.from('guilds').update({ members: newMembers }).eq('id', guild.id)
    setGuild(null); setMembers([])
  }

  function copyCode() {
    if (!guild) return
    navigator.clipboard.writeText(guild.id).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono">
      <p className="text-cyan-900 text-[10px] uppercase tracking-widest animate-pulse">Carregando Guild...</p>
    </div>
  )

  const totalXP   = members.reduce((a, m) => a + m.xp, 0)
  const isLeader  = guild?.leader_id === userId

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">
      <header className="mb-8 pb-5 border-b border-cyan-900/30">
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Aba de Guild</p>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight flex items-center gap-3">
          <Users size={26} className="text-cyan-500" />
          {guild ? guild.name : 'Guild'}
          {guild && <span className="text-lg text-slate-600 font-mono not-italic">[{guild.tag}]</span>}
        </h1>
        {guild?.description && <p className="text-[10px] text-slate-500 mt-2 max-w-lg">{guild.description}</p>}
      </header>

      {/* SEM GUILD */}
      {!guild && (
        <div className="max-w-sm mx-auto text-center py-16">
          <Users size={44} className="text-slate-800 mx-auto mb-4" />
          <p className="text-[10px] text-slate-700 uppercase tracking-widest font-black mb-2">// Você não pertence a nenhuma guild</p>
          <p className="text-[9px] text-slate-800 mb-8">Crie sua própria guild ou entre em uma existente com o código de convite.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-3 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500/20 transition-all">
              <Plus size={13} /> Criar Guild
            </button>
            <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-5 py-3 border border-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-slate-500 transition-all">
              Entrar com Código
            </button>
          </div>
        </div>
      )}

      {/* COM GUILD */}
      {guild && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {/* Código */}
            <div className="bg-slate-950 border border-slate-900 p-4">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">// Código de Convite</p>
              <div className="flex items-center gap-2">
                <p className="text-[8px] text-cyan-400 font-mono flex-1 truncate">{guild.id}</p>
                <button onClick={copyCode} className="text-slate-600 hover:text-cyan-400 transition-colors flex-shrink-0">
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="text-[7px] text-slate-800 mt-1">Compartilhe este código para convidar membros</p>
            </div>

            {/* Stats */}
            <div className="bg-slate-950 border border-slate-900 p-4 space-y-3">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest">// Estatísticas</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[7px] text-slate-700 uppercase tracking-widest">Membros</p>
                  <p className="text-xl font-black text-white">{members.length}</p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-700 uppercase tracking-widest">XP Total</p>
                  <p className="text-xl font-black text-cyan-400">{totalXP.toLocaleString()}</p>
                </div>
              </div>
              {isLeader && (
                <div className="flex items-center gap-1 pt-2 border-t border-slate-900">
                  <Crown size={10} className="text-yellow-400" />
                  <span className="text-[8px] text-yellow-600 uppercase tracking-widest font-black">Você é o Líder</span>
                </div>
              )}
            </div>

            <button onClick={handleLeave} className="w-full py-2.5 border border-red-900/40 text-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-950/20 transition-all flex items-center justify-center gap-2">
              <LogOut size={12} /> Sair da Guild
            </button>
          </div>

          {/* Membros */}
          <div className="lg:col-span-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Zap size={12} className="text-cyan-500" /> Membros ({members.length})
            </h2>
            <div className="space-y-2">
              {members.map(m => {
                const color = RANK_COLORS[m.rank] ?? '#888'
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 border border-slate-900 hover:border-slate-700 transition-all" style={m.id === userId ? { borderColor: 'rgba(0,255,255,0.2)', background: 'rgba(0,255,255,0.02)' } : {}}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}60`, color }}>
                      {m.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-black text-white truncate">{m.name}</p>
                        {m.id === guild.leader_id && <Crown size={9} className="text-yellow-400 flex-shrink-0" />}
                        {m.id === userId && <span className="text-[7px] text-cyan-600 font-bold">você</span>}
                      </div>
                      <p className="text-[7px] text-slate-600 uppercase">{RANK_NAMES[m.rank] ?? m.rank} · Nv.{m.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black tabular-nums" style={{ color }}>{m.xp.toLocaleString()}</p>
                      <p className="text-[7px] text-slate-700">XP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar */}
      {showCreate && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-black border border-cyan-900/40 p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-black uppercase tracking-wider text-sm">Criar Nova Guild</h2>
              <button onClick={() => setShowCreate(false)}><X size={16} className="text-slate-600" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Nome da Guild', value: gName, set: setGName, max: 30, placeholder: 'Ex: Shadow Hunters', upper: false },
                { label: 'Tag (max 4)', value: gTag, set: (v: string) => setGTag(v.toUpperCase()), max: 4, placeholder: 'SHD', upper: true },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold block mb-1">{f.label}</label>
                  <input type="text" value={f.value} onChange={e => f.set(e.target.value)} maxLength={f.max} placeholder={f.placeholder}
                    className="w-full bg-black border border-slate-800 px-3 py-2.5 text-sm text-cyan-300 outline-none focus:border-cyan-500 font-mono"
                    style={f.upper ? { textTransform: 'uppercase' } : {}} />
                </div>
              ))}
              <div>
                <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold block mb-1">Descrição (opcional)</label>
                <textarea value={gDesc} onChange={e => setGDesc(e.target.value)} maxLength={120} rows={2} placeholder="Descrição da guild..."
                  className="w-full bg-black border border-slate-800 px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-500 font-mono resize-none" />
              </div>
              {createErr && <p className="text-[9px] text-red-400">// {createErr}</p>}
              <button onClick={handleCreate} disabled={creating} className="w-full py-3 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {creating ? <><Loader2 size={12} className="animate-spin" /> Criando...</> : 'Criar Guild'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Entrar */}
      {showJoin && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-black border border-slate-800 p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-black uppercase tracking-wider text-sm">Entrar na Guild</h2>
              <button onClick={() => setShowJoin(false)}><X size={16} className="text-slate-600" /></button>
            </div>
            <div className="space-y-3">
              <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold block mb-1">Código de Convite</label>
              <input type="text" value={invCode} onChange={e => setInvCode(e.target.value)} placeholder="Cole o ID da guild aqui..."
                className="w-full bg-black border border-slate-800 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-500 font-mono" />
              {joinErr && <p className="text-[9px] text-red-400">// {joinErr}</p>}
              <button onClick={handleJoin} disabled={joining} className="w-full py-3 border border-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-slate-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {joining ? <><Loader2 size={12} className="animate-spin" /> Entrando...</> : 'Entrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}