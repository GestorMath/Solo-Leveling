export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
  type: 'boost' | 'consumable' | 'special';
  boostType?: string;
  duration?: number; 
  category?: string;
  icon: string;
}

export const MASTER_ITEM_DATABASE: ShopItem[] = [
  // --- RANK E - D (20 ITENS: Micro-otimizações) ---
  { id: 'e1', name: 'Café Expresso', description: 'Estimulante imediato. Reduz o tempo de resposta em tarefas de Agilidade (XP 2x).', price: 150, rarity: 'E', type: 'boost', boostType: 'agility_boost', duration: 10, icon: '☕' },
  { id: 'e2', name: 'Copo de Água (500ml)', description: 'Manutenção de homeostase. Previne a degradação de Stamina na próxima tarefa.', price: 50, rarity: 'E', type: 'consumable', icon: '💧' },
  { id: 'e3', name: 'Checklist de Papel', description: 'Externalização de memória. Otimiza o processamento em Inteligência (XP 2x).', price: 100, rarity: 'E', type: 'boost', boostType: 'intelligence_boost', duration: 15, icon: '📝' },
  { id: 'e4', name: 'Banho Gelado Rápido', description: 'Reset térmico. Estabiliza a Mentalidade sob pressão (XP 2x).', price: 200, rarity: 'D', type: 'boost', boostType: 'mentality_boost', duration: 10, icon: '🚿' },
  { id: 'e5', name: 'Post-it Estratégico', description: 'Ancoragem visual. Evita perda de foco em tarefas de Percepção (XP 2x).', price: 120, rarity: 'E', type: 'boost', boostType: 'perception_boost', duration: 10, icon: '📌' },
  { id: 'e6', name: 'Alongamento 2min', description: 'Descompressão física. Melhora o Body Control para execução (XP 2x).', price: 80, rarity: 'E', type: 'boost', boostType: 'bodyControl_boost', duration: 10, icon: '🧘' },
  { id: 'e7', name: 'Chocolate Amargo', description: 'Precursor de dopamina. Aumento breve de Reflexo (XP 2x).', price: 130, rarity: 'D', type: 'boost', boostType: 'reflex_boost', duration: 10, icon: '🍫' },
  { id: 'e8', name: 'Mascar Chiclete', description: 'Estímulo de mastigação para maior fluxo sanguíneo cerebral. (XP 2x Reflexo).', price: 60, rarity: 'E', type: 'boost', boostType: 'reflex_boost', duration: 5, icon: '🍬' },
  { id: 'e9', name: 'Luz Natural (5min)', description: 'Sincronia de ciclo circadiano. Estabiliza Mentalidade (XP 2x).', price: 0, rarity: 'E', type: 'boost', boostType: 'mentality_boost', duration: 15, icon: '☀️' },
  { id: 'e10', name: 'Vitamina C', description: 'Suporte imunológico preventivo. Mitiga custo de Vitalidade.', price: 180, rarity: 'D', type: 'consumable', icon: '🍊' },
  // ... (Completar até 20 itens com este padrão de 'Custo vs Benefício')

  // --- RANK C - B (15 ITENS: Infraestrutura de Performance) ---
  { id: 'c1', name: 'Fone Noise Cancelling', description: 'Eliminação de ruído externo. Maximização de Percepção (XP 2x).', price: 1200, rarity: 'C', type: 'boost', boostType: 'perception_boost', duration: 30, icon: '🎧' },
  { id: 'c2', name: 'Técnica Pomodoro', description: 'Ciclo de foco ultra-estruturado. Dobra ganho de XP em Mentalidade.', price: 800, rarity: 'B', type: 'boost', boostType: 'mentality_boost', duration: 25, icon: '🍅' },
  { id: 'c3', name: 'Teclado Mecânico', description: 'Redução de latência de entrada física. Ganho em Agilidade (XP 2x).', price: 1500, rarity: 'B', type: 'boost', boostType: 'agility_boost', duration: 20, icon: '⌨️' },
  { id: 'c4', name: 'Podcast Técnico', description: 'Input passivo de dados. Expansão de Inteligência (XP 2x).', price: 600, rarity: 'C', type: 'boost', boostType: 'intelligence_boost', duration: 40, icon: '🎙️' },
  { id: 'c5', name: 'Blue Light Glasses', description: 'Proteção de receptores oculares. Mantém Percepção ativa (XP 2x).', price: 900, rarity: 'B', type: 'boost', boostType: 'perception_boost', duration: 60, icon: '👓' },
  // ... (Completar até 15 itens)

  // --- RANK A - S (10 ITENS: Protocolos de Elite) ---
  { id: 'a1', name: 'Cadeira Ergonômica Pro', description: 'Alinhamento postural avançado. Estabiliza Body Control por longo prazo (XP 2x).', price: 4500, rarity: 'A', type: 'boost', boostType: 'bodyControl_boost', duration: 60, icon: '💺' },
  { id: 'a2', name: 'Deep Work Mode', description: 'Protocolo de imersão total. Multiplicador de Inteligência (XP 2x).', price: 3000, rarity: 'S', type: 'boost', boostType: 'intelligence_boost', duration: 45, icon: '🧠' },
  { id: 'a3', name: 'Sessão de Mentoria', description: 'Transferência direta de expertise. Salto em Inteligência e Fé (XP 2x).', price: 8000, rarity: 'S', type: 'boost', boostType: 'intelligence_boost', duration: 60, icon: '🤝' },
  { id: 'a4', name: 'Jejum Metabólico', description: 'Otimização de clareza mental e Vitalidade (XP 2x em Mentalidade).', price: 2500, rarity: 'A', type: 'boost', boostType: 'mentality_boost', duration: 120, icon: '⏳' },
  // ... (Completar até 10 itens)

  // --- RANK SS - SSS (5 ITENS: Transcendência de Sistema) ---
  { id: 's1', name: 'Estado de Flow', description: 'Sincronia absoluta entre hardware e software humano. 2x XP GLOBAL.', price: 15000, rarity: 'SSS', type: 'boost', boostType: 'xp_boost', duration: 60, icon: '🌀' },
  { id: 's2', name: 'Setup de Biohacking', description: 'Monitoramento de biomarcadores em tempo real. Regenera 1 de Stamina extra a cada 20min.', price: 25000, rarity: 'SS', type: 'special', icon: '🧬' },
  { id: 's3', name: 'Conexão Neural de Elite', description: 'Interface direta com a tarefa. Elimina custo de Stamina por 30min.', price: 20000, rarity: 'SSS', type: 'boost', boostType: 'no_stamina_cost', duration: 30, icon: '⚡' },
  { id: 's4', name: 'Maestria de Hábito', description: 'Automatização de processos. Reduz permanentemente custo de Stamina em 10%.', price: 50000, rarity: 'SSS', type: 'special', icon: '🏆' },
  { id: 's5', name: 'Legado do Arrematante', description: 'Algoritmo de lucro máximo. Aumenta Ganho de Gold em 50% permanentemente.', price: 100000, rarity: 'SSS', type: 'special', icon: '💰' },
];