export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
  type: 'boost' | 'consumable' | 'special';
  boostType?: string;
  duration?: number;
  icon: string;
}

export const MASTER_ITEM_DATABASE: ShopItem[] = [
  // RANK E (básicos)
  { id: 'e1',  name: 'Café Expresso',         description: 'Estimulante. XP de Agilidade dobrado por 10min.',         price: 150,   rarity: 'E',   type: 'boost',      boostType: 'agility_boost',     duration: 10,  icon: '☕' },
  { id: 'e2',  name: 'Copo de Água 500ml',    description: 'Hidratação básica. Restaura 2 de Stamina.',               price: 50,    rarity: 'E',   type: 'consumable',                                        icon: '💧' },
  { id: 'e3',  name: 'Checklist de Papel',    description: 'Externaliza memória. XP de Inteligência dobrado por 15min.', price: 100, rarity: 'E',   type: 'boost',      boostType: 'intelligence_boost', duration: 15,  icon: '📝' },
  { id: 'e4',  name: 'Post-it Estratégico',   description: 'Ancoragem visual. XP de Percepção dobrado por 10min.',    price: 120,   rarity: 'E',   type: 'boost',      boostType: 'perception_boost',  duration: 10,  icon: '📌' },
  { id: 'e5',  name: 'Alongamento 2min',      description: 'Descompressão. XP de Controle Corporal dobrado por 10min.', price: 80,  rarity: 'E',   type: 'boost',      boostType: 'bodyControl_boost', duration: 10,  icon: '🧘' },
  { id: 'e6',  name: 'Mascar Chiclete',       description: 'Fluxo cerebral. XP de Reflexo dobrado por 5min.',         price: 60,    rarity: 'E',   type: 'boost',      boostType: 'reflex_boost',      duration: 5,   icon: '🍬' },
  { id: 'e7',  name: 'Luz Natural 5min',      description: 'Ciclo circadiano. XP de Mentalidade dobrado por 15min.',  price: 0,     rarity: 'E',   type: 'boost',      boostType: 'mentality_boost',   duration: 15,  icon: '☀️' },
  { id: 'e8',  name: 'Respiração 4-7-8',      description: 'Protocolo de calma. Recupera 3 de Stamina.',             price: 90,    rarity: 'E',   type: 'consumable',                                        icon: '🌬️' },
  { id: 'e9',  name: 'Lanche Saudável',       description: 'Combustível limpo. Recupera 4 de Stamina.',              price: 200,   rarity: 'E',   type: 'consumable',                                        icon: '🥗' },
  { id: 'e10', name: 'Vitamina C',            description: 'Suporte imunológico. XP de Vitalidade dobrado por 20min.', price: 180, rarity: 'E',   type: 'boost',      boostType: 'vitality_boost',    duration: 20,  icon: '🍊' },

  // RANK D
  { id: 'd1',  name: 'Banho Gelado',          description: 'Reset térmico. XP de Mentalidade dobrado por 10min.',     price: 200,   rarity: 'D',   type: 'boost',      boostType: 'mentality_boost',   duration: 10,  icon: '🚿' },
  { id: 'd2',  name: 'Chocolate Amargo',      description: 'Dopamina natural. XP de Reflexo dobrado por 10min.',     price: 130,   rarity: 'D',   type: 'boost',      boostType: 'reflex_boost',      duration: 10,  icon: '🍫' },
  { id: 'd3',  name: 'Playlist de Foco',      description: 'Ambiente sonoro. XP de Inteligência dobrado por 20min.', price: 250,   rarity: 'D',   type: 'boost',      boostType: 'intelligence_boost', duration: 20, icon: '🎵' },
  { id: 'd4',  name: 'Diário de Metas',       description: 'Clareza de objetivos. XP global +25% por 30min.',        price: 350,   rarity: 'D',   type: 'boost',      boostType: 'xp_boost_25',       duration: 30,  icon: '📔' },
  { id: 'd5',  name: 'Suplemento de Proteína',description: 'Recuperação muscular. XP de Força dobrado por 30min.',   price: 300,   rarity: 'D',   type: 'boost',      boostType: 'strength_boost',    duration: 30,  icon: '💊' },

  // RANK C
  { id: 'c1',  name: 'Fone Noise Cancelling', description: 'Silêncio absoluto. XP de Percepção dobrado por 30min.',  price: 1200,  rarity: 'C',   type: 'boost',      boostType: 'perception_boost',  duration: 30,  icon: '🎧' },
  { id: 'c2',  name: 'Podcast Técnico',       description: 'Input passivo. XP de Inteligência dobrado por 40min.',   price: 600,   rarity: 'C',   type: 'boost',      boostType: 'intelligence_boost', duration: 40, icon: '🎙️' },
  { id: 'c3',  name: 'Garrafa de 2L',         description: 'Meta de hidratação. Recupera 8 de Stamina.',             price: 800,   rarity: 'C',   type: 'consumable',                                        icon: '🫙' },
  { id: 'c4',  name: 'Treino HIIT',           description: 'Intensidade máxima. XP de Força e Agilidade dobrado por 20min.', price: 1000, rarity: 'C', type: 'boost', boostType: 'strength_boost',  duration: 20,  icon: '🏃' },
  { id: 'c5',  name: 'Bloco de Notas Digital',description: 'Captura de ideias. XP de Inteligência dobrado por 25min.', price: 700, rarity: 'C',   type: 'boost',      boostType: 'intelligence_boost', duration: 25, icon: '📱' },

  // RANK B
  { id: 'b1',  name: 'Teclado Mecânico',      description: 'Latência zero. XP de Agilidade dobrado por 20min.',      price: 1500,  rarity: 'B',   type: 'boost',      boostType: 'agility_boost',     duration: 20,  icon: '⌨️' },
  { id: 'b2',  name: 'Blue Light Glasses',    description: 'Proteção ocular. XP de Percepção dobrado por 60min.',    price: 900,   rarity: 'B',   type: 'boost',      boostType: 'perception_boost',  duration: 60,  icon: '👓' },
  { id: 'b3',  name: 'Técnica Pomodoro',      description: 'Ciclos de foco. XP de Mentalidade dobrado por 25min.',   price: 800,   rarity: 'B',   type: 'boost',      boostType: 'mentality_boost',   duration: 25,  icon: '🍅' },
  { id: 'b4',  name: 'Protocolo de Sono',     description: 'Recuperação total. Restaura Stamina ao máximo.',         price: 2000,  rarity: 'B',   type: 'consumable',                                        icon: '🌙' },
  { id: 'b5',  name: 'Pré-treino Elite',      description: 'Energia concentrada. XP de Força dobrado por 45min.',   price: 1800,  rarity: 'B',   type: 'boost',      boostType: 'strength_boost',    duration: 45,  icon: '⚡' },

  // RANK A
  { id: 'a1',  name: 'Cadeira Ergonômica Pro', description: 'Postura perfeita. XP de Controle Corporal dobrado por 60min.', price: 4500, rarity: 'A', type: 'boost', boostType: 'bodyControl_boost', duration: 60, icon: '💺' },
  { id: 'a2',  name: 'Jejum Metabólico',      description: 'Clareza mental extrema. XP de Mentalidade dobrado por 120min.', price: 2500, rarity: 'A', type: 'boost', boostType: 'mentality_boost',  duration: 120, icon: '⏳' },
  { id: 'a3',  name: 'Monitor Ultra Wide',    description: 'Campo visual expandido. XP de Percepção dobrado por 90min.', price: 5000, rarity: 'A', type: 'boost', boostType: 'perception_boost',  duration: 90,  icon: '🖥️' },

  // RANK S
  { id: 's1',  name: 'Deep Work Mode',        description: 'Imersão total. XP de Inteligência dobrado por 45min.',   price: 3000,  rarity: 'S',   type: 'boost',      boostType: 'intelligence_boost', duration: 45, icon: '🧠' },
  { id: 's2',  name: 'Sessão de Mentoria',    description: 'Expertise direta. XP de Inteligência dobrado por 60min.', price: 8000, rarity: 'S',   type: 'boost',      boostType: 'intelligence_boost', duration: 60, icon: '🤝' },
  { id: 's3',  name: 'Isolamento Total',      description: 'Zero distrações. XP GLOBAL dobrado por 30min.',         price: 6000,  rarity: 'S',   type: 'boost',      boostType: 'xp_boost',          duration: 30,  icon: '🏔️' },

  // RANK SS - SSS (raros e caros)
  { id: 'ss1', name: 'Estado de Flow',        description: 'Sincronia absoluta. 2x XP GLOBAL por 60min.',           price: 15000, rarity: 'SSS', type: 'boost',      boostType: 'xp_boost',          duration: 60,  icon: '🌀' },
  { id: 'ss2', name: 'Setup de Biohacking',   description: 'Biomarcadores monitorados. Regenera +1 Stamina a cada 20min.', price: 25000, rarity: 'SS', type: 'special',                                icon: '🧬' },
  { id: 'ss3', name: 'Conexão Neural Elite',  description: 'Sem custo de Stamina por 30min.',                       price: 20000, rarity: 'SSS', type: 'boost',      boostType: 'no_stamina_cost',   duration: 30,  icon: '⚡' },
  { id: 'ss4', name: 'Maestria de Hábito',    description: 'Automatização permanente. Reduz custo de Stamina em 10%.', price: 50000, rarity: 'SSS', type: 'special',                                icon: '🏆' },
  { id: 'ss5', name: 'Legado do Monarca',     description: 'Ganho de Gold +50% permanentemente.',                   price: 100000, rarity: 'SSS', type: 'special',                                icon: '💰' },
];