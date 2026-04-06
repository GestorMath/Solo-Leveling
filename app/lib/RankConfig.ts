// ─────────────────────────────────────────────
// lib/rankConfig.ts
// Exporta configurações de rank para uso em toda a app
// ─────────────────────────────────────────────

import type { RankTier } from '../context/SystemContext'

export const RANK_COLORS: Record<string, string> = {
  'F':   '#666666',
  'E-':  '#888888', 'E':  '#999999', 'E+': '#aaaaaa',
  'D-':  '#cc8833', 'D':  '#ffaa44', 'D+': '#ffbb55',
  'C-':  '#33cc77', 'C':  '#44ff88', 'C+': '#55ffaa',
  'B-':  '#3366ee', 'B':  '#4488ff', 'B+': '#55aaff',
  'A-':  '#8833ee', 'A':  '#9944ff', 'A+': '#aa55ff',
  'S-':  '#00dddd', 'S':  '#00ffff', 'S+': '#22ffff',
  'SS-': '#ff6633', 'SS': '#ff8844', 'SS+': '#ff4466',
}

export const RANK_NAMES: Record<string, string> = {
  'F':   'Mortal Comum',
  'E-':  'Caçador Iniciante', 'E':  'Caçador Bronze',    'E+':  'Caçador Prata',
  'D-':  'Guerreiro D',       'D':  'Guerreiro',          'D+':  'Guerreiro Elite',
  'C-':  'Cavaleiro C',       'C':  'Cavaleiro',          'C+':  'Cavaleiro Elite',
  'B-':  'Mestre B',          'B':  'Mestre',             'B+':  'Mestre Elite',
  'A-':  'Herói A',           'A':  'Herói',              'A+':  'Herói Lendário',
  'S-':  'Soberano S',        'S':  'Soberano',           'S+':  'Shadow Monarch',
  'SS-': 'Monarca I',         'SS': 'Monarca das Sombras','SS+': 'Monarca Absoluto',
}

export function getRankColor(rank: string): string {
  return RANK_COLORS[rank] ?? '#888888'
}

export function getRankName(rank: string): string {
  return RANK_NAMES[rank] ?? rank
}

export function getRankGlow(rank: string): string {
  const color = getRankColor(rank)
  return `0 0 15px ${color}55`
}