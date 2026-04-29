'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSystem, THEME_COLORS, type ColorTheme } from '@/app/context/SystemContext'
import { supabase } from '@/app/lib/supabase'
import {
  Settings, User, LogOut, Trash2, Save, Check,
  Loader2, Bell, Palette, Camera, ChevronRight,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AppSettings {
  theme: ColorTheme
  notifQuests: boolean
  notifSistema: boolean
  notifRank: boolean
  notifShop: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cyan',
  notifQuests: true,
  notifSistema: true,
  notifRank: true,
  notifShop: false,
}

const SETTINGS_KEY = 'sl_app_settings'

const THEMES: { id: ColorTheme; label: string; color: string }[] = [
  { id: 'cyan',   label: 'Ciano (Padrão)', color: '#00ffff' },
  { id: 'purple', label: 'Roxo',           color: '#9944ff' },
  { id: 'gold',   label: 'Dourado',        color: '#ffdd00' },
]

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-900">
      <span className="text-[11px] text-slate-300 font-bold">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 20, borderRadius: 10,
          border: `1px solid ${checked ? 'rgba(0,255,255,0.6)' : 'rgba(100,116,139,0.4)'}`,
          background: checked ? 'rgba(0,255,255,0.12)' : 'transparent',
          cursor: 'pointer', transition: 'all 0.2s', position: 'relative', flexShrink: 0,
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const system = useSystem()

  const [settings,    setSettings]    = useState<AppSettings>(DEFAULT_SETTINGS)
  const [newName,     setNewName]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [nameError,   setNameError]   = useState('')
  const [showLogout,  setShowLogout]  = useState(false)
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleteText,  setDeleteText]  = useState('')
  const [deleting,    setDeleting]    = useState(false)
  const [mounted,     setMounted]     = useState(false)
  const [avatarError, setAvatarError] = useState('')

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
    } catch { /* ignore */ }
    setNewName(system.playerName || '')
  }, [system.playerName])

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
    if (key === 'theme') system.setColorTheme(value as ColorTheme)
  }

  // SEC: validação de arquivo antes de converter para base64
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError('')

    // Validar tipo MIME real (não só extensão)
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Formato inválido. Use JPG, PNG, GIF ou WebP.')
      return
    }

    // Validar tamanho: máximo 3.5MB (base64 ~1.37x → ~4.8MB no localStorage)
    const MAX_SIZE = 3.5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setAvatarError('Imagem muito grande. Máximo 3.5MB.')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const url = ev.target?.result as string
        if (!url) { setAvatarError('Falha ao ler imagem.'); return }
        system.setAvatarUrl(url)
      }
      reader.onerror = () => setAvatarError('Erro ao carregar imagem.')
      reader.readAsDataURL(file)
    } catch {
      setAvatarError('Erro inesperado ao processar imagem.')
    }
  }

  async function handleSaveName() {
    const trimmed = newName.trim()
    if (trimmed.length < 2)  { setNameError('Mínimo 2 caracteres.'); return }
    if (trimmed.length > 24) { setNameError('Máximo 24 caracteres.'); return }

    setNameError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('players').update({ name: trimmed }).eq('id', user.id)
      }
      localStorage.setItem('sl_player_name', trimmed)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setNameError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    // Limpar apenas chaves do app, não todo o localStorage
    const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('sl_'))
    keysToRemove.forEach(k => localStorage.removeItem(k))
    router.replace('/auth')
  }

  async function handleDelete() {
    if (deleteText !== 'DELETAR') return
    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Deletar dados do player primeiro, depois a conta
        await supabase.from('players').delete().eq('id', user.id)
        // Remover de guilds
        const { data: guilds } = await supabase
          .from('guilds').select('id, members').contains('members', [user.id])
        if (guilds) {
          for (const g of guilds) {
            const newMembers = g.members.filter((m: string) => m !== user.id)
            await supabase.from('guilds').update({ members: newMembers }).eq('id', g.id)
          }
        }
        await supabase.auth.signOut()
      }
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('sl_'))
      keysToRemove.forEach(k => localStorage.removeItem(k))
      router.replace('/auth')
    } catch {
      setDeleting(false)
    }
  }

  if (!mounted) return null

  const themeColor = THEME_COLORS[system.colorTheme] ?? '#00ffff'

  return (
    <div className="font-mono bg-black text-white min-h-screen pb-32">

      <header
        className="mb-8 pb-5 border-b"
        style={{ borderBottomColor: `${themeColor}30` }}
      >
        <p className="text-[9px] text-slate-600 tracking-[0.5em] uppercase mb-2">// Configurações</p>
        <h1 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
          <Settings size={24} style={{ color: themeColor }} /> System Settings
        </h1>
      </header>

      <div className="max-w-lg space-y-8">

        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Camera size={11} /> Foto de Perfil
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full border-2 flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ borderColor: themeColor }}
            >
              {system.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={system.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={28} className="text-slate-500" />
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer">
                <div
                  className="px-4 py-2 border font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-2 hover:opacity-80 transition-all"
                  style={{
                    borderColor: `${themeColor}60`,
                    background:  `${themeColor}10`,
                    color:       themeColor,
                  }}
                >
                  <Camera size={12} /> Alterar Foto
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
              <p className="text-[8px] text-slate-700 mt-2">JPG, PNG, GIF ou WebP. Máx 3.5MB.</p>
              {avatarError && (
                <p className="text-[9px] text-red-400 mt-1">❌ {avatarError}</p>
              )}
              {system.avatarUrl && (
                <button
                  onClick={() => system.setAvatarUrl(null)}
                  className="text-[8px] text-slate-600 hover:text-red-400 mt-1 transition-colors"
                >
                  Remover foto
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Perfil ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <User size={11} /> Perfil do Caçador
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5 space-y-4">
            <div>
              <label className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-2 block">
                // Nome de exibição
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setNameError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  maxLength={24}
                  className="flex-1 bg-black border border-slate-800 px-4 py-2.5 text-sm text-cyan-300 outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="px-4 py-2.5 border font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-1.5"
                  style={{
                    borderColor: `${themeColor}40`,
                    background:  `${themeColor}08`,
                    color:       themeColor,
                  }}
                >
                  {saving  ? <Loader2 size={12} className="animate-spin" />
                  : saved  ? <Check size={12} className="text-green-400" />
                  : <Save size={12} />}
                  {saved ? 'Salvo!' : 'Salvar'}
                </button>
              </div>
              {nameError && (
                <p className="text-[9px] text-red-400 mt-1">// {nameError}</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-900">
              <div>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Classe</p>
                <p className="font-black text-white capitalize mt-0.5">
                  {system.playerClass || '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Level</p>
                <p className="font-black text-white mt-0.5">{system.level}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">Rank</p>
                <p className="font-black text-lg mt-0.5" style={{ color: themeColor }}>
                  {system.rank}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tema ────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Palette size={11} /> Tema de Cor
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5">
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(t => {
                const isActive = system.colorTheme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => updateSetting('theme', t.id)}
                    className="p-3 border text-center transition-all"
                    style={isActive
                      ? { borderColor: t.color, borderWidth: 2, background: `${t.color}10` }
                      : { borderColor: 'rgba(51,65,85,0.6)' }
                    }
                  >
                    <div
                      className="w-6 h-6 rounded-full mx-auto mb-2"
                      style={{ background: t.color, boxShadow: `0 0 10px ${t.color}60` }}
                    />
                    <p
                      className="text-[8px] font-black uppercase tracking-wide"
                      style={{ color: isActive ? t.color : '#666' }}
                    >
                      {t.label}
                    </p>
                    {isActive && (
                      <Check size={10} className="mx-auto mt-1" style={{ color: t.color }} />
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[8px] text-slate-700 mt-3 text-center">
              // A cor selecionada é aplicada em todo o aplicativo
            </p>
          </div>
        </section>

        {/* ── Notificações ────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Bell size={11} /> Notificações
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5">
            <Toggle
              label="Missões e Quests"
              checked={settings.notifQuests}
              onChange={v => updateSetting('notifQuests', v)}
            />
            <Toggle
              label="Alertas do Sistema"
              checked={settings.notifSistema}
              onChange={v => updateSetting('notifSistema', v)}
            />
            <Toggle
              label="Mudanças de Rank"
              checked={settings.notifRank}
              onChange={v => updateSetting('notifRank', v)}
            />
            <Toggle
              label="Rotação da Loja"
              checked={settings.notifShop}
              onChange={v => updateSetting('notifShop', v)}
            />
          </div>
        </section>

        {/* ── Zona de Perigo ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[9px] font-black uppercase tracking-widest text-red-800 mb-4">
            // Zona de Perigo
          </h2>
          <div className="bg-slate-950 border border-slate-900 p-5 space-y-3">

            {/* Logout */}
            <div>
              <button
                onClick={() => setShowLogout(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <LogOut size={14} />
                  <span className="font-bold text-[11px] uppercase tracking-widest">
                    Sair da Conta
                  </span>
                </div>
                <ChevronRight size={14} />
              </button>

              {showLogout && (
                <div className="mt-2 p-4 border border-yellow-900/40 bg-yellow-950/10">
                  <p className="text-[9px] text-yellow-400 font-bold mb-3">
                    Confirmar logout? Seu progresso está salvo.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-yellow-600 text-black font-black text-[9px] uppercase hover:bg-yellow-500 transition-all"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowLogout(false)}
                      className="px-4 py-2 border border-slate-700 text-slate-400 font-black text-[9px] uppercase hover:border-slate-500 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete */}
            <div>
              <button
                onClick={() => setShowDelete(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 border border-red-900/40 text-red-500 hover:bg-red-950/20 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={14} />
                  <span className="font-bold text-[11px] uppercase tracking-widest">
                    Deletar Conta
                  </span>
                </div>
                <ChevronRight size={14} />
              </button>

              {showDelete && (
                <div className="mt-2 p-4 border border-red-900/60 bg-red-950/15">
                  <p className="text-[9px] text-red-400 font-bold mb-1">
                    AÇÃO IRREVERSÍVEL — Todos os dados serão apagados permanentemente.
                  </p>
                  <p className="text-[8px] text-slate-600 mb-3">
                    Digite <span className="text-red-400 font-black">DELETAR</span> para confirmar.
                  </p>
                  <input
                    type="text"
                    value={deleteText}
                    onChange={e => setDeleteText(e.target.value)}
                    placeholder="DELETAR"
                    className="w-full bg-black border border-red-900/40 px-3 py-2 text-red-400 font-mono text-sm outline-none focus:border-red-500 mb-3 uppercase"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleteText !== 'DELETAR' || deleting}
                      className="px-4 py-2 bg-red-700 text-white font-black text-[9px] uppercase hover:bg-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {deleting && <Loader2 size={10} className="animate-spin" />}
                      Deletar Permanentemente
                    </button>
                    <button
                      onClick={() => { setShowDelete(false); setDeleteText('') }}
                      className="px-4 py-2 border border-slate-700 text-slate-400 font-black text-[9px] uppercase hover:border-slate-500 transition-all"
                    >
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