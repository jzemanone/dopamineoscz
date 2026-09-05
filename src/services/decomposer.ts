import { BiologicalCapacity, normalizeBiologicalCapacity } from '../types';

export type BiologicalMode = BiologicalCapacity;
export type DecomposeMode = BiologicalCapacity | 'low_energy' | 'desk' | 'field' | 'low' | 'medium' | 'high';
export type DecomposeCategory =
  | 'communication'
  | 'chore'
  | 'deep_work'
  | 'fuel'
  | 'physical'
  | 'digital'
  | 'admin';

export interface DecomposedResult {
  steps: string[];
  category: DecomposeCategory;
  source: 'gemini' | 'heuristic_fallback';
}

interface HeuristicPattern {
  keywords: string[];
  regex: RegExp;
  category: DecomposeCategory;
  stepsByMode?: {
    LOW_BATTERY: string[];
    BALANCED_FLOW: string[];
    PEAK_PERFORMANCE: string[];
  };
  steps: string[];
}

const HEURISTIC_PATTERNS: HeuristicPattern[] = [
  {
    // Food / Fuel / Nutrition / Kitchen
    keywords: [
      'fuel',
      'eat',
      'food',
      'snack',
      'cook',
      'kitchen',
      'apple',
      'protein',
      'meal',
      'lunch',
      'breakfast',
      'dinner',
      'shake',
      'yogurt',
      'coffee',
      'tea',
      'water',
      'jídlo',
      'vařit',
      'snídaně',
      'oběd',
      'večeře',
      'svačina',
    ],
    regex: /\b(fuel|eat|food|snack|cook|kitchen|apple|protein|meal|lunch|breakfast|dinner|shake|yogurt|coffee|tea|water|jídlo|vařit|oběd|večeře|snídaně|svačina)\b/i,
    category: 'fuel',
    steps: [
      'Zvedni se a jdi rovnou do kuchyně k lince nebo lednici',
      'Vyndej první surovinu a vezmi talíř, misku nebo pánev',
      'Začni první pohyb přípravy nebo si dej první sousto',
    ],
  },
  {
    // Home Cleaning / Tidy / Chores / Physical House Tasks
    keywords: [
      'tidy',
      'clean',
      'wash',
      'laundry',
      'dishes',
      'apartment',
      'room',
      'trash',
      'bed',
      'shower',
      'vacuum',
      'mop',
      'prát',
      'vyprat',
      'uklidit',
      'úklid',
      'nádobí',
      'odpadky',
      'vyluxovat',
      'koupelna',
      'ustlat',
      'vytřít',
    ],
    regex: /\b(tidy|clean|wash|laundry|dishes|apartment|room|trash|bed|shower|vacuum|mop|prát|vyprat|uklidit|úklid|nádobí|odpadky|vyluxovat|koupelna|ustlat|vytřít)\b/i,
    category: 'physical',
    steps: [
      'Hned se zvedni a jdi přímo do cílové místnosti',
      'Zvedni nebo ukliď první 3 věci ze stolu nebo podlahy',
      'Nastav 2minutový časovač na úklid jen téhle jedné plochy',
    ],
  },
  {
    // Fitness / Workout / Gym / Movement
    keywords: [
      'gym',
      'workout',
      'train',
      'walk',
      'run',
      'running',
      'fitness',
      'exercise',
      'stretch',
      'weights',
      'yoga',
      'posilovna',
      'cvičení',
      'cvičit',
      'běhat',
      'běh',
      'protáhnout',
      'kolo',
      'jóga',
    ],
    regex: /\b(gym|workout|train|walk|run|running|fitness|exercise|stretch|weights|yoga|posilovna|cvičení|cvičit|běhat|běh|protáhnout|kolo|jóga)\b/i,
    category: 'physical',
    steps: [
      'Obuj si boty na cvičení nebo roztáhni podložku hned teď',
      'Napusť si lahev s vodou a pusť si jeden energický track',
      'Začni 30 sekundami lehkého rozhýbání na prolomení setrvačnosti',
    ],
  },
  {
    // Admin / Invoices / Banking / Taxes / Forms
    keywords: [
      'invoice',
      'pay',
      'bank',
      'tax',
      'taxes',
      'bill',
      'document',
      'form',
      'faktura',
      'zaplatit',
      'platba',
      'účet',
      'úřad',
      'daň',
      'daně',
      'pojištění',
      'smlouva',
    ],
    regex: /\b(invoice|pay|bank|tax|taxes|bill|document|form|faktura|zaplatit|platba|účet|úřad|daň|daně|pojištění|smlouva)\b/i,
    category: 'admin',
    steps: [
      'Přihlas se do jednoho potřebného portálu nebo otevři formulář',
      'Najdi otevřenou položku nebo vyplň jediný první řádek',
      'Odešli nebo potvrď platbu bez zbytečného přemýšlení',
    ],
  },
  {
    // Outreach / Proposals / Emails / Comms / Client Follow-ups
    keywords: [
      'email',
      'mail',
      'reply',
      'dm',
      'pitch',
      'outreach',
      'proposal',
      'proposals',
      'call',
      'text',
      'message',
      'client',
      'zavolat',
      'napsat',
      'odepsat',
      'klient',
      'nabídka',
      'poptávka',
      'telefon',
      'dopis',
    ],
    regex: /\b(email|mail|reply|dm|pitch|outreach|proposal|proposals|call|text|message|client|zavolat|napsat|odepsat|klient|nabídka|poptávka|telefon|dopis)\b/i,
    category: 'digital',
    steps: [
      'Otevři konverzaci nebo čistý koncept (zavři všechny ostatní panely)',
      'Napiš syrovou 1 větu bez autocenzury nebo opravování',
      'Klikni na odeslat nebo naplánuj odeslání hned teď',
    ],
  },
  {
    // Coding / Dev / Bug Fixing / Scripting / Building
    keywords: [
      'code',
      'coding',
      'bug',
      'feature',
      'script',
      'dev',
      'git',
      'build',
      'program',
      'app',
      'design',
      'write',
      'article',
      'draft',
      'doc',
      'typescript',
      'css',
      'api',
      'kódovat',
      'programovat',
      'opravit',
      'vyvíjet',
      'aplikace',
    ],
    regex: /\b(code|coding|dev|bug|feature|script|git|build|app|design|write|article|draft|doc|typescript|css|api|program|kódovat|programovat|opravit|vyvíjet|aplikace)\b/i,
    category: 'digital',
    steps: [
      'Otevři konkrétní cílový soubor nebo dokument a sbal boční panely',
      'Napiš 1 hrubý řádek kódu, testovací komentář nebo první větu',
      'Soustřeď se nerušeně na první 2 zkušební minuty',
    ],
  },
];

/**
 * Instant local heuristic fallback matrix.
 * Executes synchronously in <1ms with zero network requirements.
 * Refactored into 3 biological capacity states (Friction Filters):
 * 1. LOW_BATTERY (Survival / Burnout / Freeze): Microscopic friction <30s sensory triggers.
 * 2. BALANCED_FLOW (Baseline): Pragmatic body-cam execution (Open -> 1 action -> Complete block).
 * 3. PEAK_PERFORMANCE (Hyperfocus): Skips prep, direct high-leverage needle mover + sprint.
 */
export function getLocalHeuristicDecomposition(
  task: string,
  mode: DecomposeMode = 'BALANCED_FLOW'
): DecomposedResult {
  const normalized = (task || '').toLowerCase();
  const bioCapacity = normalizeBiologicalCapacity(mode);

  // 1. Direct domain detection
  let detectedCategory: DecomposeCategory = 'deep_work';
  let matchedPattern: HeuristicPattern | null = null;

  for (const pattern of HEURISTIC_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      matchedPattern = pattern;
      detectedCategory = pattern.category;
      break;
    }
  }

  // Domain categorization fallback
  if (!matchedPattern) {
    if (/\b(call|email|mail|msg|message|text|dm|reply|slack|client|pitch)\b/i.test(normalized)) {
      detectedCategory = 'communication';
    } else if (/\b(clean|wash|laundry|dishes|tidy|trash|room|bed)\b/i.test(normalized)) {
      detectedCategory = 'chore';
    } else if (/\b(eat|food|snack|cook|lunch|water|coffee|protein|meal)\b/i.test(normalized)) {
      detectedCategory = 'fuel';
    } else {
      detectedCategory = 'deep_work';
    }
  }

  // 2. Biological Capacity State (Friction Filters)

  // STATE 1: LOW_BATTERY (<30s microscopic sensory triggers)
  if (bioCapacity === 'LOW_BATTERY') {
    if (detectedCategory === 'fuel') {
      return {
        steps: [
          'Vypij hned teď 1 sklenici studené vody (10 s)',
          'Dojdi do kuchyně a sáhni na 1 jídlo nebo svačinu (10 s)',
          'Dej si 1 sousto bez jakéhokoliv tlaku na dojezení (10 s)',
        ],
        category: 'fuel',
        source: 'heuristic_fallback',
      };
    }
    if (detectedCategory === 'chore' || detectedCategory === 'physical') {
      return {
        steps: [
          'Fyzicky vstaň a sáhni na 1 věc k uklizení (5 s)',
          'Polož doslova 1 věc na své místo nebo do dřezu (10 s)',
          'Zastav se nebo přidej ještě 1 věc (15 s)',
        ],
        category: 'chore',
        source: 'heuristic_fallback',
      };
    }
    if (detectedCategory === 'communication') {
      return {
        steps: [
          'Otevři konverzaci a přečti si 1 větu (10 s)',
          'Napiš doslova 3 slova hrubé odpovědi (15 s)',
          'Odešli to nebo nech koncept připravený (5 s)',
        ],
        category: 'communication',
        source: 'heuristic_fallback',
      };
    }
    // Default LOW_BATTERY
    return {
      steps: [
        `Otevři obrazovku nebo sáhni na věc pro "${(task || 'tento úkol').slice(0, 26)}" (10 s)`,
        'Udělej 1 mikroskopický úvodní pohyb bez jakýchkoliv očekávání (15 s)',
        'Oslav +10 XP a klidně si dej pauzu (5 s)',
      ],
      category: detectedCategory,
      source: 'heuristic_fallback',
    };
  }

  // STATE 3: PEAK_PERFORMANCE (High-leverage Needle Mover + Deep Sprint)
  if (bioCapacity === 'PEAK_PERFORMANCE') {
    if (detectedCategory === 'fuel') {
      return {
        steps: [
          'Dej si bílkoviny a hned se napij (60 s)',
          'Ukliď prostor pro jídlo pro nulovou kognitivní zátěž',
          'Vrať se do hlubokého soustředění plný energie',
        ],
        category: 'fuel',
        source: 'heuristic_fallback',
      };
    }
    if (detectedCategory === 'chore' || detectedCategory === 'physical') {
      return {
        steps: [
          'Zaútoč přímo na největší překážku v místnosti',
          'Vyčisti nejviditelnější plochu za 2 rychlé minuty',
          'Zafixuj čistý základ a hotovo',
        ],
        category: 'chore',
        source: 'heuristic_fallback',
      };
    }
    if (detectedCategory === 'communication') {
      return {
        steps: [
          'Otevři zprávu a napiš rozhodnou nabídku nebo aktualizaci o 2 větách',
          'Odešli okamžitě bez zbytečného přemýšlení',
          'Archivuj vlákno a posuň se k dalšímu cíli',
        ],
        category: 'communication',
        source: 'heuristic_fallback',
      };
    }
    // Default PEAK_PERFORMANCE
    return {
      steps: [
        'Otevři přímo klíčový soubor nebo dokument (přeskoč přípravu)',
        'Spusť hlavní blok s nejvyšší pákou na 2 minuty plného focusu',
        'Zafixuj nerušený rozběh v hyperfocusu',
      ],
      category: detectedCategory,
      source: 'heuristic_fallback',
    };
  }

  // STATE 2: BALANCED_FLOW (Pragmatic Body-Cam Execution)
  if (matchedPattern) {
    return {
      steps: [...matchedPattern.steps],
      category: matchedPattern.category,
      source: 'heuristic_fallback',
    };
  }

  if (detectedCategory === 'communication') {
    return {
      steps: [
        'Otevři konverzaci nebo prázdný koncept',
        'Napiš syrovou 1 větu bez autocenzury',
        'Odešli to nebo naplánuj odeslání hned',
      ],
      category: 'communication',
      source: 'heuristic_fallback',
    };
  }

  if (detectedCategory === 'chore' || detectedCategory === 'physical') {
    return {
      steps: [
        'Dojdi rovnou do cílové místnosti nebo k dané ploše',
        'Zvedni a ukliď první 3 věci z povrchu',
        'Soustřeď se na úklid pouze hlavní plochy po dobu 2 minut',
      ],
      category: 'chore',
      source: 'heuristic_fallback',
    };
  }

  return {
    steps: [
      'Otevři jediný potřebný nástroj, dokument nebo aplikaci',
      'Napiš 1 hrubý řádek kódu, testovací poznámku nebo první větu',
      'Soustřeď se nerušeně po dobu 2 minut',
    ],
    category: detectedCategory,
    source: 'heuristic_fallback',
  };
}

/**
 * Calls `/api/decompose` with strict timeout (2500ms).
 * If offline, error, or slow network, immediately returns local heuristic.
 */
export async function decomposeWithAI(
  task: string,
  mode: DecomposeMode = 'BALANCED_FLOW',
  simpler: boolean = false
): Promise<DecomposedResult> {
  const cleanTask = (task || '').trim();
  const bioCapacity = normalizeBiologicalCapacity(mode);

  if (!cleanTask) {
    return getLocalHeuristicDecomposition('Start focus', bioCapacity);
  }

  // If user browser reports offline, skip network instantly
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getLocalHeuristicDecomposition(cleanTask, bioCapacity);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    const response = await fetch('/api/decompose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: cleanTask,
        mode: bioCapacity,
        energyLevel: bioCapacity,
        simpler,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data.steps) && data.steps.length >= 3) {
      const validCategories: DecomposeCategory[] = [
        'communication',
        'chore',
        'deep_work',
        'fuel',
        'physical',
        'digital',
        'admin',
      ];
      return {
        steps: data.steps.slice(0, 3).map((s: string) => String(s).trim()),
        category: validCategories.includes(data.category) ? data.category : 'deep_work',
        source: 'gemini',
      };
    }

    throw new Error('Malformed step structure');
  } catch {
    // Graceful offline heuristic fallback
    const heuristic = getLocalHeuristicDecomposition(cleanTask, bioCapacity);
    if (simpler) {
      return {
        steps: [
          `Just open the tool or document for "${cleanTask.slice(0, 30)}" (10s)`,
          'Write 1 single sentence or do 1 small movement without expectations',
          'Stop or choose to continue for another 30 seconds',
        ],
        category: heuristic.category,
        source: 'heuristic_fallback',
      };
    }
    return heuristic;
  }
}

/**
 * Specifically decomposes a repeatedly avoided task (parkedCount >= 3)
 * into ultra-frictionless 10-30s micro-actions.
 */
export async function decomposeUltraSimple(task: string): Promise<DecomposedResult> {
  return decomposeWithAI(task, 'low_energy', true);
}

export interface DumpClassificationResult {
  tasks: Array<{
    title: string;
    energyLevel: 'low' | 'medium' | 'high';
    estimatedMinutes: number;
    category: string;
  }>;
  openLoops: Array<{
    title: string;
    person?: string;
    dueDate?: string;
    softUrgency?: string;
  }>;
  source: 'gemini' | 'heuristic_fallback';
}

/**
 * Classifies raw Brain Dump text into immediate tasks + Open Loops (people & deadlines)
 */
export async function classifyBrainDumpWithAI(rawText: string): Promise<DumpClassificationResult> {
  const clean = (rawText || '').trim();
  if (!clean) {
    return { tasks: [], openLoops: [], source: 'heuristic_fallback' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('/api/classify-dump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: clean }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.tasks)) {
        return {
          tasks: data.tasks,
          openLoops: Array.isArray(data.openLoops) ? data.openLoops : [],
          source: 'gemini',
        };
      }
    }
  } catch (e) {
    // offline fallback handled by caller
  }

  return { tasks: [], openLoops: [], source: 'heuristic_fallback' };
}
