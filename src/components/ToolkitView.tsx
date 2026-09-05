import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Dice5,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  Timer,
  TrendingDown,
  Sparkle,
  Lock,
} from 'lucide-react';
import { MealIdea, EnergyLevel, SpendingPause, ZERO_DECISION_MEALS } from '../types';
import { ProGateOverlay } from './ProGateOverlay';

export type EffortLevel = 'low' | 'medium' | 'high';

interface ToolkitProps {
  currentCapacity?: EnergyLevel;
  customMeals?: MealIdea[];
  spendingPauses?: SpendingPause[];
  isPro?: boolean;
  onOpenPaywall?: () => void;
  onAddCustomMeal?: (meal: Omit<MealIdea, 'id'>) => void;
  onQueueMealTask: (meal: MealIdea) => void;
  onCookMeal?: (meal: MealIdea) => void;
  onAddSpendingPause: (itemName: string, cost: number) => void;
  onResolveSpendingPause: (pauseId: string, outcome: 'bought' | 'skipped') => void;
  onPlayClick?: () => void;
}

const MEAL_RANDOMIZE_STORAGE_KEY = 'dopamine_meal_randomize_count_v1';
const FREE_RANDOMIZE_LIMIT = 2;

// Built-in Curated Minimalist Meals categorized into 3 ADHD Effort Levels
const CURATED_MEALS: MealIdea[] = [
  // Low Effort (<2m)
  {
    id: 'cur-low-1',
    name: 'Proteinový shake & banán',
    energyLevel: 'low',
    prepTime: '1 min',
    tips: 'Nalij mléko nebo vodu do shakeru, přidej 1 odměrku proteinu a 15s protřep. Banán sněz k tomu.',
    ingredients: ['Proteinový prášek', 'Mléko nebo voda', 'Banán'],
    emoji: '🥤',
  },
  {
    id: 'cur-low-2',
    name: 'Toast s arašídovým máslem a medem',
    energyLevel: 'low',
    prepTime: '2 min',
    tips: 'Hoď chleba do toustovače, za tepla namaž štědrou vrstvu arašídového másla a pokapej medem.',
    ingredients: ['Chléb', 'Arašídové máslo', 'Med'],
    emoji: '🍞',
  },
  {
    id: 'cur-low-3',
    name: 'Řecký jogurt s ovocem a ořechy',
    energyLevel: 'low',
    prepTime: '1 min',
    tips: 'Jez přímo z kelímku s hrstí vlašských ořechů a lesního ovoce – ušetříš nádobí.',
    ingredients: ['Řecký jogurt', 'Lesní ovoce', 'Ořechy'],
    emoji: '🥣',
  },
  {
    id: 'cur-low-4',
    name: 'Sýr a nakrájené jablko',
    energyLevel: 'low',
    prepTime: '1 min',
    tips: 'Rozkroj jablko na 4 čtvrtky nebo rovnou kousej se sýrem. Žádný úklid.',
    ingredients: ['Jablko', 'Sýr'],
    emoji: '🧀',
  },

  // Medium (5m)
  {
    id: 'cur-med-1',
    name: 'Míchaná vajíčka se sýrem na toastu',
    energyLevel: 'medium',
    prepTime: '5 min',
    tips: 'Rozklepni 2 vajíčka přímo na pánev s máslem, 90s jemně míchej vidličkou a vyklop na toast.',
    ingredients: ['2 vejce', 'Máslo', 'Sýr', '1 krajíc chleba'],
    emoji: '🍳',
  },
  {
    id: 'cur-med-2',
    name: 'Zapečený sýrový toast & kyselé okurky',
    energyLevel: 'medium',
    prepTime: '5 min',
    tips: 'Namaž chleba zvenku máslem, vlož 2 plátky sýra a opeč 2 minuty z každé strany do zlatova.',
    ingredients: ['Chléb', 'Čedar/eidam', 'Máslo', 'Kyselé okurky'],
    emoji: '🥪',
  },
  {
    id: 'cur-med-3',
    name: 'Rychlá quesadilla z mikrovlnky',
    energyLevel: 'medium',
    prepTime: '3 min',
    tips: 'Nasyp sýr na tortillu, přelož napůl a dej na 45s do mikrovlnky. Přidej salsu ze skleničky.',
    ingredients: ['Pšeničná tortilla', 'Strouhaný sýr', 'Salsa'],
    emoji: '🌮',
  },
  {
    id: 'cur-med-4',
    name: 'Toast s avokádem a vajíčkem',
    energyLevel: 'medium',
    prepTime: '4 min',
    tips: 'Rozmačkej 1/2 zralého avokáda na toast se solí, pepřem a plátky vařeného vajíčka.',
    ingredients: ['Toast', 'Avokádo', 'Vejce', 'Sůl a chilli'],
    emoji: '🥑',
  },

  // Real Cooking (15m)
  {
    id: 'cur-high-1',
    name: 'Těstoviny s tuňákem z jednoho hrnce',
    energyLevel: 'high',
    prepTime: '12 min',
    tips: 'Uvař rychlé těstoviny, slij vodu, vyklop plechovku tuňáka, přidej olivový olej, česnek a parmazán.',
    ingredients: ['Těstoviny', 'Tuňák v konzervě', 'Olivový olej', 'Parmazán', 'Sušený česnek'],
    emoji: '🍝',
  },
  {
    id: 'cur-high-2',
    name: 'Křupavý wrap s kuřecím masem a zeleninou',
    energyLevel: 'high',
    prepTime: '10 min',
    tips: 'Opeč kousky kuřete s kořením na pánvi a zabal do teplé tortilly se zeleninou a dresinkem.',
    ingredients: ['Tortilla', 'Kuřecí maso', 'Špenát/salát', 'Dresink nebo majonéza'],
    emoji: '🌯',
  },
  {
    id: 'cur-high-3',
    name: 'Blesková zeleninová směs (Stir-fry)',
    energyLevel: 'high',
    prepTime: '15 min',
    tips: 'Orestuj mraženou zeleninu na prudkém ohni se sójovou omáčkou a sezamovým olejem. Smíchej s rýží.',
    ingredients: ['Mražená zelenina', 'Sójová omáčka', 'Sezamový olej', 'Rychlá rýže'],
    emoji: '🥡',
  },
];

export const ToolkitView: React.FC<ToolkitProps> = ({
  customMeals = [],
  spendingPauses = [],
  isPro = false,
  onOpenPaywall,
  onQueueMealTask,
  onAddSpendingPause,
  onResolveSpendingPause,
  onPlayClick,
}) => {
  // Tab State: 'meals' or 'pause'
  const [activeTab, setActiveTab] = useState<'meals' | 'pause'>('meals');

  // =========================================================================
  // TAB 1: ZERO-DECISION MEALS ENGINE
  // =========================================================================
  const [selectedEffort, setSelectedEffort] = useState<EffortLevel>('low');
  const [activeMeal, setActiveMeal] = useState<MealIdea>(() => CURATED_MEALS[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [queuedNotification, setQueuedNotification] = useState<string | null>(null);

  // Free Randomize Trials Counter (up to 2 free trials for free users)
  const [randomizeCount, setRandomizeCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(MEAL_RANDOMIZE_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Combine custom & default meals pool
  const allMealsPool = useMemo(() => {
    return [...customMeals, ...CURATED_MEALS, ...ZERO_DECISION_MEALS];
  }, [customMeals]);

  // Filter pool by chosen effort
  const effortMeals = useMemo(() => {
    return allMealsPool.filter((m) => {
      if (selectedEffort === 'low') return m.energyLevel === 'low' || m.energyLevel === 'LOW_BATTERY';
      if (selectedEffort === 'medium') return m.energyLevel === 'medium' || m.energyLevel === 'BALANCED_FLOW';
      return m.energyLevel === 'high' || m.energyLevel === 'PEAK_PERFORMANCE';
    });
  }, [allMealsPool, selectedEffort]);

  // When effort filter changes, automatically pick a matching meal if current does not match
  useEffect(() => {
    const pool = effortMeals.length > 0 ? effortMeals : CURATED_MEALS;
    const currentMatches = pool.some((m) => m.id === activeMeal.id);
    if (!currentMatches) {
      setActiveMeal(pool[0]);
    }
  }, [selectedEffort, effortMeals, activeMeal.id]);

  // Randomize Meal Handler
  const handleRandomizeMeal = () => {
    if (onPlayClick) onPlayClick();

    // Check if free trial limit has been reached
    if (!isPro && randomizeCount >= FREE_RANDOMIZE_LIMIT) {
      if (onOpenPaywall) {
        onOpenPaywall();
      }
      return;
    }

    setIsAnimating(true);

    const pool = effortMeals.length > 0 ? effortMeals : CURATED_MEALS;
    const candidatePool = pool.filter((m) => m.id !== activeMeal.id);
    const chosen =
      candidatePool.length > 0
        ? candidatePool[Math.floor(Math.random() * candidatePool.length)]
        : pool[0];

    // Increment trial count for free users
    if (!isPro) {
      const newCount = randomizeCount + 1;
      setRandomizeCount(newCount);
      try {
        localStorage.setItem(MEAL_RANDOMIZE_STORAGE_KEY, String(newCount));
      } catch {
        // ignore
      }
    }

    setTimeout(() => {
      setActiveMeal(chosen);
      setIsAnimating(false);
    }, 180);
  };

  const handleQueueActiveMeal = () => {
    if (onPlayClick) onPlayClick();
    onQueueMealTask(activeMeal);
    setQueuedNotification(`Přidáno "${activeMeal.name}" do dnešní fronty!`);
    setTimeout(() => {
      setQueuedNotification(null);
    }, 2800);
  };

  const isMealPickerGated = !isPro && randomizeCount >= FREE_RANDOMIZE_LIMIT;

  // =========================================================================
  // TAB 2: IMPULSE BUY PAUSER (24H COOLDOWN)
  // =========================================================================
  const [pauseItemName, setPauseItemName] = useState('');
  const [pausePrice, setPausePrice] = useState('');
  const [now, setNow] = useState(Date.now());

  // Keep a tick timer for real-time cooldown calculations
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCreatePause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pauseItemName.trim() || !pausePrice || isNaN(Number(pausePrice))) return;

    // Check impulse pause free limit (1 active pause for free users)
    if (!isPro && spendingPauses.length >= 1) {
      if (onOpenPaywall) onOpenPaywall();
      return;
    }

    if (onPlayClick) onPlayClick();
    onAddSpendingPause(pauseItemName.trim(), Math.max(0, Number(pausePrice)));
    setPauseItemName('');
    setPausePrice('');
  };

  // Calculate Monthly Saved Metric ($ saved this month via "didn't buy")
  const monthlySaved = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return spendingPauses
      .filter((p) => {
        if (p.outcome !== 'skipped') return false;
        const resolvedDate = new Date(p.resolvedAt || p.createdAt);
        return resolvedDate.getMonth() === currentMonth && resolvedDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.cost || 0), 0);
  }, [spendingPauses]);

  // Separate active pending pauses vs history
  const activePauses = useMemo(() => {
    return spendingPauses.filter((p) => !p.outcome);
  }, [spendingPauses]);

  const pastPauses = useMemo(() => {
    return spendingPauses.filter((p) => p.outcome).slice(0, 5);
  }, [spendingPauses]);

  const isImpulseFormGated = !isPro && spendingPauses.length >= 1;

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-24 pt-3 sm:pt-6 space-y-5 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. NAVIGATION TABS (TOP BAR) */}
      {/* ========================================================================= */}
      <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 shadow-lg shadow-black/20 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => {
            if (onPlayClick) onPlayClick();
            setActiveTab('meals');
          }}
          className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 select-none ${
            activeTab === 'meals'
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.01]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-base leading-none">🍔</span>
          <span className="truncate">Jídla bez rozhodování</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onPlayClick) onPlayClick();
            setActiveTab('pause');
          }}
          className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 select-none ${
            activeTab === 'pause'
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.01]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-base leading-none">🛑</span>
          <span className="truncate">Stopka impulzivních nákupů</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ZERO-DECISION MEALS ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'meals' && (
        <div className="space-y-4">
          {/* Header Explanation */}
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center justify-center gap-2">
              <span>Generátor rychlého jídla</span>
              <Sparkle className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Přeskoč exekutivní paralýzu. Zvol svoji energii, hoď kostkou a najez se.
            </p>
          </div>

          {/* 3 Effort / Energy Filter Pills */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (onPlayClick) onPlayClick();
                setSelectedEffort('low');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border text-center ${
                selectedEffort === 'low'
                  ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="text-sm">🔋</span>
              <span className="leading-tight">Minimální úsilí</span>
              <span className="text-[10px] font-semibold text-emerald-400/90">&lt;2 min</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onPlayClick) onPlayClick();
                setSelectedEffort('medium');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border text-center ${
                selectedEffort === 'medium'
                  ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-2 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="text-sm">⚡</span>
              <span className="leading-tight">Střední</span>
              <span className="text-[10px] font-semibold text-amber-400/90">5 min</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onPlayClick) onPlayClick();
                setSelectedEffort('high');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border text-center ${
                selectedEffort === 'high'
                  ? 'bg-rose-500/15 border-rose-500/80 text-rose-300 ring-2 ring-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="text-sm">🍳</span>
              <span className="leading-tight">Opravdové vaření</span>
              <span className="text-[10px] font-semibold text-rose-400/90">15 min</span>
            </button>
          </div>

          {/* Randomize Button with Trial Counter / Pro Lock Wrapper */}
          <ProGateOverlay
            isPro={!isMealPickerGated}
            title="Neomezený výběr jídel bez rozhodování"
            description="Už žádné bezradné zírání do lednice. Odemkni si 50+ rychlých receptů přizpůsobených tvé energii."
            onUnlock={onOpenPaywall || (() => {})}
            featureTag="PRO NÁSTROJE"
          >
            <div className="space-y-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleRandomizeMeal}
                  className="w-full py-4 px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <Dice5
                    className={`w-5 h-5 transition-transform ${
                      isAnimating ? 'rotate-180 scale-110' : 'group-hover:rotate-45'
                    }`}
                  />
                  <span>🎲 NÁHODNÉ JÍDLO</span>
                </button>

                {!isPro && (
                  <div className="text-center mt-1.5">
                    <span className="text-[11px] font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Zbývá pokusů zdarma: {Math.max(0, FREE_RANDOMIZE_LIMIT - randomizeCount)}/2
                    </span>
                  </div>
                )}
              </div>

              {/* Single Meal Card Display (Result) */}
              <div
                className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#131927] via-[#0F1420] to-[#0A0D15] border border-amber-500/40 shadow-2xl shadow-amber-500/10 space-y-4 transition-all duration-200 ${
                  isAnimating ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {activeMeal.emoji || '🍽️'}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-[10px] font-bold text-amber-300 mb-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>⏱️ {activeMeal.prepTime || '3 min'}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-100 leading-snug">
                        {activeMeal.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Minimal Preparation Hack */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Příprava s nulovým odporem</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {activeMeal.tips ||
                      'Rychlé jídlo bez námahy. Vezmi suroviny a pusť se do toho.'}
                  </p>
                </div>

                {/* Ingredients Snapshot */}
                {activeMeal.ingredients && activeMeal.ingredients.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Potřebuješ:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMeal.ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-300"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button: Add to Today Autopilot Queue */}
                <button
                  type="button"
                  onClick={handleQueueActiveMeal}
                  className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-750 active:scale-[0.99] border border-amber-500/40 text-amber-300 hover:text-amber-200 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
                  <span>+ Přidat do dnešní fronty autopilota</span>
                </button>
              </div>
            </div>
          </ProGateOverlay>

          {/* Feedback Toast */}
          {queuedNotification && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{queuedNotification}</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: IMPULSE BUY PAUSER (24H COOLDOWN) */}
      {/* ========================================================================= */}
      {activeTab === 'pause' && (
        <div className="space-y-5">
          {/* Monthly Saved Metric Badge */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingDown className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ušetřeno tento měsíc
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-300">
                  ${monthlySaved.toLocaleString()}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                🛡️ Ochrana před impulzy
              </span>
            </div>
          </div>

          {/* Input Form with Pro Gate for 2nd Pause */}
          <ProGateOverlay
            isPro={!isImpulseFormGated}
            title="ADHD štít proti impulzivním nákupům"
            description="Ochraň své peníze před dopaminovými nákupy pomocí neomezených 24h odkladových slotů."
            onUnlock={onOpenPaywall || (() => {})}
            featureTag="PRO NÁSTROJE"
          >
            <form
              onSubmit={handleCreatePause}
              className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-xl shadow-black/20"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <span>Spustit 24hodinový dopaminový odklad</span>
                  </h3>
                  {!isPro && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      1 slot zdarma ({spendingPauses.length}/1)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  ADHD mozek rád loví dopamin nakupováním. Dej to na 24 hodin k ledu, než se rozhodneš.
                </p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Co si chceš koupit?
                  </label>
                  <input
                    type="text"
                    value={pauseItemName}
                    onChange={(e) => setPauseItemName(e.target.value)}
                    placeholder="např. Tenisky, gadget ke hrám, kurz, mechanická klávesnice"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-750 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cena (Kč)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={pausePrice}
                      onChange={(e) => setPausePrice(e.target.value)}
                      placeholder="490"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-750 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      Kč
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!pauseItemName.trim() || !pausePrice}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🛑 Zmrazit nákup na 24h</span>
              </button>
            </form>
          </ProGateOverlay>

          {/* Active Pauses List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>Chladicí komora nákupů ({activePauses.length})</span>
              </h4>
            </div>

            {activePauses.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Lock className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-400">
                  Žádné odložené nákupy k ledu.
                </p>
                <p className="text-[11px] text-slate-400">
                  Kdykoliv dostaneš náhlou chuť něco online koupit, zadej to nejdřív sem!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activePauses.map((pause) => {
                  const msElapsed = now - pause.createdAt;
                  const msRemaining = Math.max(0, 24 * 60 * 60 * 1000 - msElapsed);
                  const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
                  const isReady = msRemaining <= 0;

                  return (
                    <div
                      key={pause.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="text-sm font-black text-slate-100 truncate">
                            {pause.itemName}
                          </h5>
                          <span className="text-xs font-bold text-amber-300">
                            {pause.cost.toLocaleString()} Kč
                          </span>
                        </div>

                        {/* Visual Countdown Pill */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black shrink-0 ${
                            isReady
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span>{isReady ? '✅ 24h uplynulo' : `⏳ Zbývá ${hoursRemaining} h`}</span>
                        </div>
                      </div>

                      {/* Post-Cooldown Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            if (onPlayClick) onPlayClick();
                            onResolveSpendingPause(pause.id, 'skipped');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="truncate">🗑️ Nekoupeno (ušetřeno {pause.cost} Kč)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onPlayClick) onPlayClick();
                            onResolveSpendingPause(pause.id, 'bought');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🛒 Stejně koupeno</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resolved History / Wins */}
            {pastPauses.length > 0 && (
              <div className="pt-3 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                  Nedávná rozhodnutí:
                </span>
                <div className="space-y-1.5">
                  {pastPauses.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 font-medium truncate max-w-[200px]">
                        {p.itemName}
                      </span>
                      {p.outcome === 'skipped' ? (
                        <span className="text-emerald-400 font-bold">
                          Ušetřeno {p.cost} Kč
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          Koupeno ({p.cost} Kč)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
