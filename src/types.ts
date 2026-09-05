export type BiologicalCapacity = 'LOW_BATTERY' | 'BALANCED_FLOW' | 'PEAK_PERFORMANCE';

export type EnergyLevel = 'low' | 'medium' | 'high' | 'LOW_BATTERY' | 'BALANCED_FLOW' | 'PEAK_PERFORMANCE';

export type TaskCategory =
  | 'work'
  | 'personal'
  | 'admin'
  | 'quick-fix'
  | 'health'
  | 'fuel'
  | 'communication'
  | 'chore'
  | 'deep_work'
  | 'physical'
  | 'digital';

export function normalizeBiologicalCapacity(energy?: string): BiologicalCapacity {
  if (!energy) return 'BALANCED_FLOW';
  const val = energy.toUpperCase();
  if (val === 'LOW_BATTERY' || val === 'LOW' || val === 'LOW_ENERGY' || val === 'SURVIVAL' || val === 'FREEZE') {
    return 'LOW_BATTERY';
  }
  if (val === 'PEAK_PERFORMANCE' || val === 'HIGH' || val === 'DESK' || val === 'PEAK' || val === 'HYPERFOCUS') {
    return 'PEAK_PERFORMANCE';
  }
  return 'BALANCED_FLOW';
}

export function toLegacyEnergyLevel(cap: BiologicalCapacity | EnergyLevel): 'low' | 'medium' | 'high' {
  const norm = normalizeBiologicalCapacity(cap);
  if (norm === 'LOW_BATTERY') return 'low';
  if (norm === 'PEAK_PERFORMANCE') return 'high';
  return 'medium';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number; // e.g. 2, 5, 15, 25
  energyLevel: EnergyLevel;
  category: TaskCategory;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  subtasks?: Subtask[];
  xpReward: number;
  notes?: string;
  parkedCount?: number; // How many times task was postponed / parked
  openLoopId?: string;  // Reference to associated Open Loop if any
  isDeadlinePromoted?: boolean; // Flagged by LIFE layer as urgent (<48h)
  dueDate?: string;     // YYYY-MM-DD
  person?: string;      // Optional person tag
  isDecomposed?: boolean;
}

export type OpenLoopStatus = 'open' | 'done' | 'dropped';
export type OpenLoopSource = 'manual' | 'parked_task' | 'brain_dump';
export type SoftUrgency = 'today' | 'tomorrow' | 'few_days' | 'this_week' | 'someday';

export interface OpenLoop {
  id: string;
  title: string;          // e.g. "Call mom", "Reply to Peter's proposal"
  person?: string;        // Optional person/contact tag (e.g. "Peter", "Mom", "Accountant")
  dueDate?: string;       // YYYY-MM-DD optional hard deadline
  softUrgency?: SoftUrgency | string; // "few_days", "this_week", "someday"
  createdAt: number;
  completedAt?: number;
  parkedCount: number;    // How many times postponed/parked
  status: OpenLoopStatus; // 'open' | 'done' | 'dropped'
  sourceType: OpenLoopSource;
  notes?: string;
  remindOnDueDate?: boolean; // Opt-in push notification on due date
  notified?: boolean;        // Exactly ONE notification fired to prevent stacking/nagging
  notifiedAt?: number;       // Timestamp when notification was delivered
}

export type StreakStatus = 'active' | 'paused' | 'frozen' | 'new_start';

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  streakStatus?: StreakStatus;
  streakFreezesAvailable: number; // 1 per week automatic anti-shame buffer
  lastStreakFreezeDate?: string;  // YYYY-MM-DD
  lastActiveDate: string; // YYYY-MM-DD
  lastCheckInDate?: string;
  tasksCompletedToday: number;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  unlockedBadges: string[];
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  autoStartNextTimer: boolean;
  defaultEnergy: EnergyLevel;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  reqType: 'completed' | 'streak' | 'level' | 'xp' | 'quickWins';
  reqValue: number;
}

export type MealEffort = 'zero' | 'low' | 'medium';

export interface MealIdea {
  id: string;
  name: string;
  effort?: MealEffort;
  energyLevel: EnergyLevel;
  prepTime: string;
  ingredients: string[];
  tips: string;
  emoji: string;
  isCustom?: boolean;
  steps?: string[];
}

export interface SpendingPause {
  id: string;
  itemName: string;
  cost: number;           // number, USD
  createdAt: number;      // timestamp
  resolvedAt?: number;    // timestamp
  outcome?: 'skipped' | 'bought' | null; // "skipped" | "bought" | null while pending
  notified?: boolean;
  notifiedAt?: number;
}

export interface EmergencyResetAction {
  id: string;
  title: string;
  duration: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  completedTasksCount: number;
  openLoopsCount: number;
  xpEarnedToday: number;
  pausedSpendingCount?: number;
  pausedSpendingTotal?: number;
  closedAt: number; // timestamp
}

export interface FocusFlowState {
  tasks: Task[];
  openLoops?: OpenLoop[];
  spendingPauses?: SpendingPause[];
  customMeals?: MealIdea[];
  stats: UserStats;
  settings: AppSettings;
  currentCapacity: EnergyLevel;
  activeTaskId: string | null;
  lastCheckInDate?: string;
  lastClosedDay?: string; // YYYY-MM-DD date when the day was closed
  isDayClosed?: boolean;
  dailySummaries?: Record<string, DailySummary>;
}

export const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  streakStatus: 'new_start',
  streakFreezesAvailable: 1,
  lastStreakFreezeDate: '',
  lastActiveDate: new Date().toISOString().split('T')[0],
  lastCheckInDate: '',
  tasksCompletedToday: 0,
  totalTasksCompleted: 0,
  totalFocusMinutes: 0,
  unlockedBadges: [],
};

export const INITIAL_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  autoStartNextTimer: false,
  defaultEnergy: 'low',
};

export const BADGES_LIST: Badge[] = [
  { id: 'first_win', name: 'První jiskra', description: 'Dokonči svůj první 2minutový úkol', icon: 'Zap', reqType: 'completed', reqValue: 1 },
  { id: 'streak_3', name: 'Rozjezd', description: 'Udrž 3denní fokus streak', icon: 'Flame', reqType: 'streak', reqValue: 3 },
  { id: 'quick_master', name: 'Mistr mikro-kroků', description: 'Splň 5 nenáročných úkolů', icon: 'CheckCircle2', reqType: 'quickWins', reqValue: 5 },
  { id: 'streak_7', name: 'Nezastavitelný', description: 'Dosáhni 7denního fokus streaku', icon: 'Trophy', reqType: 'streak', reqValue: 7 },
  { id: 'level_5', name: 'Fokus veterán', description: 'Dosáhni Levelu 5', icon: 'Award', reqType: 'level', reqValue: 5 },
  { id: 'xp_1000', name: 'Stav flow', description: 'Získej celkem 1 000 XP', icon: 'Sparkles', reqType: 'xp', reqValue: 1000 },
];

export const PRESET_TASKS: Omit<Task, 'id' | 'createdAt' | 'completed'>[] = [
  { title: 'Vypij sklenici studené vody a protáhni se', estimatedMinutes: 2, energyLevel: 'low', category: 'health', xpReward: 25 },
  { title: 'Odpověz na 1 naléhavou zprávu nebo e-mail', estimatedMinutes: 2, energyLevel: 'low', category: 'work', xpReward: 30 },
  { title: 'Ukliď stažené soubory na ploše', estimatedMinutes: 5, energyLevel: 'medium', category: 'admin', xpReward: 45 },
  { title: 'Nahoď hlavní 3 priority na dnešek', estimatedMinutes: 5, energyLevel: 'medium', category: 'work', xpReward: 50 },
  { title: 'Napiš první odstavec k nejdůležitějšímu úkolu', estimatedMinutes: 15, energyLevel: 'high', category: 'work', xpReward: 90 },
];

export const ZERO_DECISION_MEALS: MealIdea[] = [
  // Low Energy / Zero-Cook (< 2 mins)
  {
    id: 'm-z1',
    name: 'Proteinová tyčinka & banán',
    energyLevel: 'low',
    effort: 'zero',
    prepTime: '0 min',
    ingredients: ['1 oblíbená proteinovka', '1 zralý banán', 'Sklenice vody'],
    tips: 'Nulové nádobí: okamžitá glukóza + stabilní dávka bílkovin.',
    emoji: '🍌',
    steps: [
      'Běž do spíže a vem proteinovku a banán.',
      'Rozbal tyčinku a oloupej půlku banánu.',
      'Dej si první sousto a zapij sklenicí vody.',
    ],
  },
  {
    id: 'm-z2',
    name: 'Řecký jogurt, ořechy & med',
    energyLevel: 'low',
    effort: 'zero',
    prepTime: '1 min',
    ingredients: ['1 kelímek řeckého jogurtu', 'Hrst ořechů nebo granoly', 'Trocha medu'],
    tips: 'Hoď to do misky, nebo jez přímo z kelímku, ať nemyješ nádobí.',
    emoji: '🥣',
    steps: [
      'Otevři lednici, vem řecký jogurt a čistou lžíci.',
      'Dej 3 velké lžíce do misky (nebo jez rovnou z kelímku).',
      'Posyp hrstí ořechů, zakápni medem a sněz první lžíci.',
    ],
  },
  {
    id: 'm-z3',
    name: 'Jablko s arašídovým máslem',
    energyLevel: 'low',
    effort: 'zero',
    prepTime: '2 min',
    ingredients: ['1 křupavé jablko', '2 lžíce arašídového másla'],
    tips: 'Rozkroj na měsíčky a nabírej přímo ze sklenice.',
    emoji: '🍎',
    steps: [
      'Vem jablko a nůž na linku.',
      'Rozkroj jablko na 4 hrubé měsíčky.',
      'Naber lžíci arašídového másla na talíř a jez.',
    ],
  },
  {
    id: 'm-z4',
    name: 'Cottage s rýžovými chlebíčky',
    energyLevel: 'low',
    effort: 'zero',
    prepTime: '1 min',
    ingredients: ['Půlka kelímku cottage', '2-3 rýžové chlebíčky', 'Sůl, pepř nebo bylinky'],
    tips: 'Namaž cottage na chlebíčky pro okamžitou křupavou bílkovinu.',
    emoji: '🧀',
    steps: [
      'Vytáhni 2 rýžové chlebíčky a vaničku cottage.',
      'Mázni velkou lžíci cottage na chlebíčky.',
      'Osol, opepři a křupni si.',
    ],
  },
  {
    id: 'm-z5',
    name: 'Mandle, hořká čokoláda & mléko',
    energyLevel: 'low',
    effort: 'zero',
    prepTime: '0 min',
    ingredients: ['Hrst mandlí nebo vlašáků', '2 čtverečky hořké čoko', 'Sklenice mléka nebo rostlinného'],
    tips: 'Nulová příprava, palivo pro mozek s hořčíkem a zdravými tuky.',
    emoji: '🍫',
    steps: [
      'Vezmi hrst mandlí a 2 čtverečky hořké čokolády.',
      'Nalij si sklenici studeného mléka.',
      'Sedni si bez jakéhokoliv vaření a začni jíst.',
    ],
  },
  {
    id: 'm-z6',
    name: 'Hummus, pita chipsy & baby mrkve',
    energyLevel: 'low',
    effort: 'zero',
    prepTime: '1 min',
    ingredients: ['3-4 lžíce hummusu', 'Pita chipsy nebo pečivo', 'Baby mrkve a okurka'],
    tips: 'Namáčej zeleninu a chipsy přímo do vaničky. Nulový úklid.',
    emoji: '🧆',
    steps: [
      'Vytáhni hummus a mrkve nebo chipsy z lednice.',
      'Strhni víčko z hummusu a otevři sáček.',
      'Namoč první mrkev nebo chips rovnou dovnitř.',
    ],
  },
  {
    id: 'm-z7',
    name: 'Hotový proteinový shake & lesní plody',
    energyLevel: 'low',
    effort: 'zero',
    prepTime: '0 min',
    ingredients: ['1 vychlazený proteinový shake', 'Hrst borůvek nebo malin'],
    tips: 'Protřep, otevři a pij s hrstí borůvek.',
    emoji: '🥤',
    steps: [
      'Vezmi 1 vychlazený proteinový shake a hrst ovoce.',
      'Pořádně protřepej 5 sekund a odšroubuj víčko.',
      'Napij se a zakousni ovocem.',
    ],
  },

  // Medium Energy (3 - 5 mins)
  {
    id: 'm-l1',
    name: 'Křupavý toast se sýrem a nakládačkami',
    energyLevel: 'medium',
    effort: 'low',
    prepTime: '5 min',
    ingredients: ['2 plátky chleba', '2 plátky čedaru / eidamu', 'Máslo', 'Kyselé okurky'],
    tips: 'Opeč na pánvi s máslem do zlatova a roztečení.',
    emoji: '🥪',
    steps: [
      'Dej pánev na střední plamen, vezmi máslo a chleba.',
      'Namaž zvenku chleba, dej sýr dovnitř a šoupni na pánev.',
      'Po 2 minutách otoč dozlatova, přihoď okurku a jez.',
    ],
  },
  {
    id: 'm-l2',
    name: 'Míchaná vajíčka z mikrovlnky na topince',
    energyLevel: 'medium',
    effort: 'low',
    prepTime: '3 min',
    ingredients: ['2 vejce', 'Kapka mléka', '1 toast', 'Máslo, sůl a pepř'],
    tips: 'Rozšlehej vejce v hrnku, 60s mikrovlnka, promíchej, 30s mikrovlnka.',
    emoji: '🍳',
    steps: [
      'Rozklepni 2 vejce do hrnku s kapkou mléka, solí a pepřem.',
      'Vidličkou prošlehej 15 sekund.',
      'Dej do mikrovlnky na 60s, zamíchej, ještě 30s a vyklop na toast.',
    ],
  },
  {
    id: 'm-l3',
    name: 'Blesková quesadilla',
    energyLevel: 'medium',
    effort: 'low',
    prepTime: '4 min',
    ingredients: ['1 tortila', 'Hrst strouhaného sýra', 'Salsa nebo pálivá omáčka'],
    tips: 'Přelož tortilu se sýrem, mikrovlnka 45s nebo pánev 2 min.',
    emoji: '🌮',
    steps: [
      'Polož tortilu na talíř vhodný do mikrovlnky.',
      'Půlku posypej sýrem a přelož.',
      'Ohřej 45 sekund, až se sýr rozteče, přidej salsu a jez.',
    ],
  },
  {
    id: 'm-l4',
    name: 'Rychlý ramen s vajíčkem a špenátem',
    energyLevel: 'medium',
    effort: 'low',
    prepTime: '5 min',
    ingredients: ['1 balíček ramenu', '1 vejce', 'Hrst baby špenátu', 'Sezamový olej'],
    tips: 'Zalij nudle vroucí vodou z konvice, přihoď vejce a špenát.',
    emoji: '🍜',
    steps: [
      'Zapni rychlovarnou konvici.',
      'Dej nudle, koření a špenát do misky.',
      'Zalij vroucí vodou, rozklepni vejce, přiklop na 3 minuty.',
    ],
  },
  {
    id: 'm-l5',
    name: 'Avokádový toast se semínky',
    energyLevel: 'medium',
    effort: 'low',
    prepTime: '3 min',
    ingredients: ['1 plátek kváskového chleba', '1/2 zralého avokáda', 'Koření / sůl', 'Olivový olej'],
    tips: 'Rozmačkej avokádo vidličkou přímo na teplý toast.',
    emoji: '🥑',
    steps: [
      'Hoď chleba do topinkovače.',
      'Vydlabej půlku avokáda na teplý toast.',
      'Rozmačkej vidličkou, posypej solí a zakápni olejem.',
    ],
  },
  {
    id: 'm-l6',
    name: 'Tuňákový wrap nebo chlebík',
    energyLevel: 'medium',
    effort: 'low',
    prepTime: '4 min',
    ingredients: ['1 konzerva tuňáka', '1 lžíce majonézy nebo jogurtu', '1 tortila nebo chleba', 'Listový salát'],
    tips: 'Promíchej tuňáka s majonézou rovnou v plechovce, mázni a zabal.',
    emoji: '🐟',
    steps: [
      'Otevři tuňáka a slij šťávu do dřezu.',
      'Přímo v plechovce promíchej lžící majonézy.',
      'Dej na tortilu se salátem, zabal a hotovo.',
    ],
  },
  {
    id: 'm-l7',
    name: 'Ovesná kaše s banánem a arašídovým máslem',
    energyLevel: 'medium',
    effort: 'low',
    prepTime: '3 min',
    ingredients: ['1/2 hrnku ovesných vloček', '1 hrnek mléka/vody', '1 lžíce arašídového másla', '1/2 nakrájeného banánu'],
    tips: 'Mikrovlnka na 90s, vmíchej arašídové máslo do krémova.',
    emoji: '🥣',
    steps: [
      'Smíchej vločky a mléko/vodu v misce.',
      'Dej do mikrovlnky na 90 sekund.',
      'Vmíchej lžíci arašídového másla a nakrájený banán.',
    ],
  },

  // High Energy (10 - 15 mins)
  {
    id: 'm-m1',
    name: 'Kuřecí kousky & pečená zelenina',
    energyLevel: 'high',
    effort: 'medium',
    prepTime: '12 min',
    ingredients: ['Kuřecí prsní nudličky / tofu', '1 hrnek mražené zeleniny', 'Olivový olej & koření'],
    tips: 'Horkovzdušná fritéza nebo trouba na 200°C na 10-12 min bez postávání.',
    emoji: '🍗',
    steps: [
      'Promíchej maso/tofu a zeleninu s lžící oleje a kořením.',
      'Nasyp do košíku fritézy nebo na plech.',
      'Zapni na 200°C na 10 minut a nech pracovat.',
    ],
  },
  {
    id: 'm-m2',
    name: 'Těstoviny s pestem a cherry rajčaty',
    energyLevel: 'high',
    effort: 'medium',
    prepTime: '10 min',
    ingredients: ['1 hrnek těstovin', '2 lžíce zeleného pesta', 'Parmazán', 'Cherry rajčata'],
    tips: 'Uvař těstoviny 8 min, slij, vmíchej pesto a rajčata rovnou v hrnci.',
    emoji: '🍝',
    steps: [
      'Uvař vodu v konvici, nalij do hrnce se solí a hoď těstoviny.',
      'Vař 8 minut a slij vodu do dřezu.',
      'Přímo v horkém hrnci vmíchej pesto a překrojená rajčata.',
    ],
  },
  {
    id: 'm-m3',
    name: 'Plněná pečená brambora se sýrem a fazolemi',
    energyLevel: 'high',
    effort: 'medium',
    prepTime: '10 min',
    ingredients: ['1 velká brambora nebo batát', 'Půl plechovky fazolí', 'Strouhaný sýr', 'Řecký jogurt / zakysanka'],
    tips: 'Propíchej bramboru vidličkou, 6-8 min v mikrovlnce, rozkroj a naplň.',
    emoji: '🥔',
    steps: [
      'Bramboru 5x propíchni vidličkou a polož na talíř do mikrovlnky.',
      'Ohřívej 6 až 7 minut doměkka.',
      'Rozkroj, naplň fazolemi a sýrem, ještě na 30s ohřej.',
    ],
  },
  {
    id: 'm-m4',
    name: 'Pečená klobáska s paprikou na plechu',
    energyLevel: 'high',
    effort: 'medium',
    prepTime: '15 min',
    ingredients: ['1 kvalitní klobása', '1 paprika', '1/2 cibule', 'Olivový olej & paprika'],
    tips: 'Všechno nakrájej na plech a peč na 200°C 12 minut.',
    emoji: '🍳',
    steps: [
      'Nakrájej klobásu a papriku na prkénku.',
      'Rozprostři na plech a zakápni kapkou oleje.',
      'Peč na 200°C cca 12 minut dozlatova.',
    ],
  },
  {
    id: 'm-m5',
    name: 'Rychlá smažená rýže s vajíčkem a zeleninou',
    energyLevel: 'high',
    effort: 'medium',
    prepTime: '10 min',
    ingredients: ['1 hrnek předvařené rýže', '2 rozšlehaná vejce', '1/2 hrnku mraženého hrášku s mrkví', 'Sójovka'],
    tips: 'Vejce usmaž na pánvi, přihoď rýži a zeleninu, zakápni sójovkou.',
    emoji: '🍚',
    steps: [
      'Rozpal lžíci oleje na pánvi na vyšším plamenu.',
      'Vlij 2 vejce a 30 sekund míchej.',
      'Přisyp rýži a mraženou zeleninu, zakápni sójovkou a 2 minuty opékej.',
    ],
  },
];

export const DEFAULT_MEAL_IDEAS: MealIdea[] = ZERO_DECISION_MEALS;

export const EMERGENCY_RESET_ACTIONS: EmergencyResetAction[] = [
  {
    id: 'reset-water',
    title: 'Vypij sklenici studené vody',
    duration: '1 min',
    description: 'Teplotní senzorický reset. Hydratuje nervová spojení a stimuluje bloudivý nerv.',
    icon: 'Droplets',
    xpReward: 10,
  },
  {
    id: 'reset-tidy',
    title: '5minutový úklid pracovní plochy',
    duration: '5 min',
    description: 'Vyhoď odpadky z linky/stolu, ukliď 3 volné věci. Sníží vizuální šum a přehlcení.',
    icon: 'Sparkles',
    xpReward: 10,
  },
  {
    id: 'reset-posture',
    title: 'Změň místnost a polohu těla',
    duration: '2 min',
    description: 'Vstaň, projdi se k oknu nebo do jiné místnosti, protáhni se. Přeruší neurologickou smyčku paralýzy.',
    icon: 'Move',
    xpReward: 10,
  },
];

export const LEVEL_TITLES: { [level: number]: string } = {
  1: 'Fokus Začátečník',
  2: 'Stavitel hybnosti',
  3: 'Zasvěcenec Flow',
  4: 'Mistr exekutivy',
  5: 'Mistr Flow',
};

export function getLevelTitle(level: number): string {
  if (level >= 5) return 'Mistr Flow';
  return LEVEL_TITLES[level] || `Mistr Flow L${level}`;
}
