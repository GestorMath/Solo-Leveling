'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSystem } from '@/app/context/SystemContext'
import { supabase } from '@/app/lib/supabase'
import { Settings, User, LogOut, Trash2, Save, Check, Loader2, ChevronRight, Bell, Palette } from 'lucide-react'

type ColorTheme = 'cyan' | 'purple' | 'gold'

const THEMES: { id: ColorTheme; label: string; color: string }[] = [
  { id: 'cyan',   label: 'Ciano (Padrão)', color: '#00ffff' },
  { id: 'purple', label: 'Roxo',           color: '#9944ff' },
  { id: 'gold',   label: 'Dourado',        color: '#ffdd00' },
]

interface AppSettings {
  theme: ColorTheme
  notifQuests: boolean; notifSistema: boolean; notifRank: boolean; notifShop: boolean
  questResetHour: number
}

const DEFAULT: AppSettings = {
  theme: 'cyan', notifQuests: true, notifSistema: true, notifRank: true, notifShop: false, questResetHour: 2,
}

const SETTINGS_KEY = 'sl_app_settings'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-900">
      <span className="text-[11px] text-slate-300 font-bold">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0"
        style={{
          width: 40, height: 20, borderRadius: 10,
          border: `1px solid ${checked ? 'rgba(0,255,255,0.6)' : 'rgba(100,116,139,0.4)'}`,
          background: checked ? 'rgba(0,255,255,0.12)' : 'transparent',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2,
          left: checked ? 20 : 2, width: 14, height: 14,
          borderRadius: '50%',
          background: checked ? '#22d3ee' : '#475569',
          transition: 'all 0.2s',
        }} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const router  = useRouter()
  const system  = useSystem()

  const [settings,     setSettings]     = useState<AppSettings>(DEFAULT)
  const [newName,      setNewName]      = useState('')
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [nameError,    setNameError]    = useState('')
  const [showLogout,   setShowLogout]   = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [deleteText,   setDeleteText]   = useState('')
  const [deleting,     setDeleting]     = useState(false)
  const [mounted,      setMounted]      = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const s = localStorage.getItem(SETTINGS_KEY)
      if (s) setSettings({ ...DEFAULT, ...JSON.parse(s) })
    } catch { /* ignora */ }
    setNewName(system.playerName || '')
  }, [system.playerName])

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
  }

  async function handleSaveName() {
    const name = newName.trim()
    if (name.length < 2) { setNameError('Mínimo 2 caracteres.'); return }
    if (name.length > 20) { setNameError('Máximo 20 caracteres.'); return }
    setNameError(''); setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('players').update({ name }).eq('id', user.id)
      localStorage.setItem('sl_player_name', name)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { setNameError('Erro ao salvar. Tente novamente.') }
    finally { setSaving(false) }
  }

  async function handleLogout() {
    try { await supabase.auth.signOut() } catch { /* ignora */ }
    localStorage.clear()
    router.replace('/auth')
  }

  async function handleDelete() {
    if (deleteText !== 'DELETAR') return
    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('players').delete().eq('id', user.id)
      await supabase.auth.signOut()
      localStorage.clear()
      router.replace('/auth')
    } catch { setDeleting(false) }
  }

  if (!mounted) return null

  const themeColor = THEMES.find(t => t.id === settings.theme)?.color ?? '#00ffff'

  return (
    <div className="p-4 md:p-8 font-mono bg-black text-white min-h-screen pb-32">
      <header className="mb-8 pb-5 border-b border-cyan-900/30">
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Tela 13 — Configurações</p>
        <h1 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
          <Settings size={24} className="text-cyan-500" /> System Settings
        </h1>
      </header>

      <div className="max-w-lg space-y-8">

        {/* PERFIL */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <User size={11} /> Perfil do Jogador
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5 space-y-4">
            <div>
              <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-2 block">// Nome de exibição</label>
              <div className="flex gap-2">
                <input
                  type="text" value={newName}
                  onChange={e => { setNewName(e.target.value); setNameError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  maxLength={20}
                  className="flex-1 bg-black border border-slate-800 px-4 py-2.5 text-sm text-cyan-300 outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  onClick={handleSaveName} disabled={saving}
                  className="px-4 py-2.5 border border-cyan-500/40 bg-cyan-500/08 text-cyan-400 font-black text-[9px] uppercase tracking-widest hover:bg-cyan-500/15 transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  {saving   ? <Loader2 size={12} className="animate-spin" />
                   : saved  ? <Check size={12} className="text-green-400" />
                   : <Save size={12} />}
                  {saved ? 'Salvo!' : 'Salvar'}
                </button>
              </div>
              {nameError && <p className="text-[9px] text-red-400 mt-1">// {nameError}</p>}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-900">
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Classe</p>
                <p className="font-black text-white capitalize mt-0.5">{system.playerClass || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Rank</p>
                <p className="font-black text-lg mt-0.5" style={{ color: themeColor }}>{system.rank}</p>
              </div>
            </div>
          </div>
        </section>

        {/* TEMA */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Palette size={11} /> Tema de Cor
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5">
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => updateSetting('theme', t.id)}
                  className="p-3 border text-center transition-all"
                  style={settings.theme === t.id
                    ? { borderColor: t.color, borderWidth: 2, background: `${t.color}10` }
                    : { borderColor: 'rgba(51,65,85,0.6)' }}>
                  <div className="w-6 h-6 rounded-full mx-auto mb-2" style={{ background: t.color, boxShadow: `0 0 10px ${t.color}60` }} />
                  <p className="text-[8px] font-black uppercase tracking-wide" style={{ color: settings.theme === t.id ? t.color : '#666' }}>
                    {t.label}
                  </p>
                  {settings.theme === t.id && <Check size={10} className="mx-auto mt-1" style={{ color: t.color }} />}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* NOTIFICAÇÕES */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Bell size={11} /> Notificações
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5">
            <Toggle label="Missões e Quests"   checked={settings.notifQuests}  onChange={v => updateSetting('notifQuests',  v)} />
            <Toggle label="Alertas do Sistema" checked={settings.notifSistema} onChange={v => updateSetting('notifSistema', v)} />
            <Toggle label="Mudanças de Rank"   checked={settings.notifRank}    onChange={v => updateSetting('notifRank',    v)} />
            <Toggle label="Rotação da Loja"    checked={settings.notifShop}    onChange={v => updateSetting('notifShop',    v)} />
            <div className="pt-4">
              <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold block mb-2">
                // Reset de quests: {String(settings.questResetHour).padStart(2, '0')}h
              </label>
              <input type="range" min={0} max={23} value={settings.questResetHour}
                onChange={e => updateSetting('questResetHour', Number(e.target.value))}
                className="w-full accent-cyan-500" />
            </div>
          </div>
        </section>

        {/* ZONA DE PERIGO */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-red-800 mb-4">// Zona de Perigo</h2>
          <div className="bg-slate-950 border border-slate-900 p-5 space-y-3">

            {/* Logout */}
            <div>
              <button onClick={() => setShowLogout(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-all">
                <div className="flex items-center gap-2"><LogOut size={14} /><span className="font-bold text-[11px] uppercase tracking-widest">Sair da Conta</span></div>
                <ChevronRight size={14} />
              </button>
              {showLogout && (
                <div className="mt-2 p-4 border border-yellow-900/40 bg-yellow-950/10">
                  <p className="text-[9px] text-yellow-400 font-bold mb-3">Confirmar logout? Você precisará fazer login novamente.</p>
                  <div className="flex gap-2">
                    <button onClick={handleLogout} className="px-4 py-2 bg-yellow-600 text-black font-black text-[9px] uppercase hover:bg-yellow-500 transition-all">Confirmar</button>
                    <button onClick={() => setShowLogout(false)} className="px-4 py-2 border border-slate-700 text-slate-400 font-black text-[9px] uppercase hover:border-slate-500 transition-all">Cancelar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Deletar */}
            <div>
              <button onClick={() => setShowDelete(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-red-900/40 text-red-500 hover:bg-red-950/20 transition-all">
                <div className="flex items-center gap-2"><Trash2 size={14} /><span className="font-bold text-[11px] uppercase tracking-widest">Deletar Conta</span></div>
                <ChevronRight size={14} />
              </button>
              {showDelete && (
                <div className="mt-2 p-4 border border-red-900/60 bg-red-950/15">
                  <p className="text-[9px] text-red-400 font-bold mb-1">AÇÃO IRREVERSÍVEL — Todos os dados serão apagados permanentemente.</p>
                  <p className="text-[8px] text-slate-600 mb-3">Digite <span className="text-red-400 font-black">DELETAR</span> para confirmar.</p>
                  <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="DELETAR"
                    className="w-full bg-black border border-red-900/40 px-3 py-2 text-red-400 font-mono text-sm outline-none focus:border-red-500 mb-3 uppercase" />
                  <div className="flex gap-2">
                    <button onClick={handleDelete} disabled={deleteText !== 'DELETAR' || deleting}
                      className="px-4 py-2 bg-red-700 text-white font-black text-[9px] uppercase hover:bg-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5">
                      {deleting && <Loader2 size={10} className="animate-spin" />}
                      Deletar Permanentemente
                    </button>
                    <button onClick={() => { setShowDelete(false); setDeleteText('') }}
                      className="px-4 py-2 border border-slate-700 text-slate-400 font-black text-[9px] uppercase hover:border-slate-500 transition-all">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}