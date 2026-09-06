import React, { useState, useEffect } from 'react';
import {
  X,
  Utensils,
  Sparkles,
  Shuffle,
  CheckCircle2,
  Plus,
  ChefHat,
  Trash2,
  Clock,
  Flame,
} from 'lucide-react';
import { ZERO_DECISION_MEALS, MealIdea, MealEffort } from '../types';
import { loadCustomMeals, saveCustomMeals } from '../utils/storage';
import { soundManager } from '../utils/audio';

interface MealPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMealAsTask: (meal: MealIdea) => void;
  onAwardXp: (amount: number, reason: string) => void;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onPlayClick: () => void;
}

export const MealPickerModal: React.FC<MealPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectMealAsTask,
  onAwardXp,
  soundEnabled,
  hapticEnabled,
  onPlayClick,
}) => {
  const [selectedEffort, setSelectedEffort] = useState<MealEffort>('zero');
  const [randomMeal, setRandomMeal] = useState<MealIdea | null>(null);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [loggedMeals, setLoggedMeals] = useState<{ [id: string]: boolean }>({});

  // Custom meals state & modal
  const [customMeals, setCustomMeals] = useState<MealIdea[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newMealName, setNewMealName] = useState<string>('');
  const [newMealPrepTime, setNewMealPrepTime] = useState<string>('3');
  const [newMealEffort, setNewMealEffort] = useState<MealEffort>('zero');
  const [newMealIngredients, setNewMealIngredients] = useState<string>('');
  const [newMealEmoji, setNewMealEmoji] = useState<string>('🥑');
  const [newMealTips, setNewMealTips] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCustomMeals(loadCustomMeals());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine default preset meals with custom user-created meals
  const allMeals: MealIdea[] = [...(ZERO_DECISION_MEALS || []), ...(customMeals || [])];
  const filteredMeals = allMeals.filter((m) => m?.effort === selectedEffort);

  const handlePickForMe = () => {
    onPlayClick();
    setIsShuffling(true);
    soundManager.playDecompose(soundEnabled);
    soundManager.triggerHaptic(hapticEnabled);

    const pool = allMeals.length > 0 ? allMeals : ZERO_DECISION_MEALS;
    let iterations = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setRandomMeal(pool[randomIdx]);
      iterations++;

      if (iterations >= 8) {
        clearInterval(interval);
        setIsShuffling(false);
        soundManager.playSuccess(soundEnabled);
      }
    }, 80);
  };

  const handleLogMeal = (meal: MealIdea) => {
    onPlayClick();
    soundManager.playSuccess(soundEnabled);
    soundManager.triggerHaptic(hapticEnabled);
    setLoggedMeals((prev) => ({ ...prev, [meal.id]: true }));
    onAwardXp(10, `Jídlo bez rozhodování: ${meal.name}`);
  };

  const handleAddTask = (meal: MealIdea) => {
    onPlayClick();
    onSelectMealAsTask(meal);
    onClose();
  };

  const handleSaveCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;

    onPlayClick();
    soundManager.playSuccess(soundEnabled);

    const ingredientsList = newMealIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const newMeal: MealIdea = {
      id: `custom-meal-${Date.now()}`,
      name: newMealName.trim(),
      effort: newMealEffort,
      energyLevel:
        newMealEffort === 'zero' ? 'low' : newMealEffort === 'low' ? 'medium' : 'high',
      prepTime: newMealPrepTime.toLowerCase().includes('min')
        ? newMealPrepTime.trim()
        : `${newMealPrepTime.trim() || '2'} min`,
      ingredients:
        ingredientsList.length > 0
          ? ingredientsList
          : ['Jednoduché suroviny dle výběru'],
      tips: newMealTips.trim() || 'Osobní rychlé palivo.',
      emoji: newMealEmoji || '🥑',
    };

    const updated = [newMeal, ...customMeals];
    setCustomMeals(updated);
    saveCustomMeals(updated);
    onAwardXp(15, `Vytvořeno vlastní jídlo: ${newMeal.name}`);

    // Reset form & close inline add
    setNewMealName('');
    setNewMealPrepTime('3');
    setNewMealIngredients('');
    setNewMealTips('');
    setSelectedEffort(newMealEffort);
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomMeal = (id: string) => {
    onPlayClick();
    const updated = customMeals.filter((m) => m.id !== id);
    setCustomMeals(updated);
    saveCustomMeals(updated);
    if (randomMeal?.id === id) {
      setRandomMeal(null);
    }
  };

  const emojiOptions = ['🥑', '🥪', '🥣', '🍳', '🥗', '🍲', '🍌', '🍕', '🧀', '🍗', '🍜', '⚡'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                Jídlo bez rozhodování
              </h3>
              <p className="text-[10px] text-slate-400">Palivo bez vaření a vyhoření pro dny bez energie</p>
            </div>
          </div>

          <button
            onClick={() => {
              onPlayClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature 6 Highlight: "Pick For Me" Magic Randomizer Banner */}
        <div className="my-3 p-3 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Únava z rozhodování?
            </span>
            <p className="text-[11px] text-slate-300 truncate">
              Nech systém vybrat další palivo za tebe.
            </p>
          </div>

          <button
            onClick={handlePickForMe}
            disabled={isShuffling}
            className="py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>Vyber za mě</span>
          </button>
        </div>

        {/* Highlighted Random Choice Card (if randomized) */}
        {randomMeal && (
          <div className="mb-3 p-3.5 bg-slate-950 border-2 border-amber-400 rounded-2xl animate-scaleUp shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <ChefHat className="w-3.5 h-3.5" /> Vybrané jídlo
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-800">
                {randomMeal.prepTime}
              </span>
            </div>

            <h4 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-1">
              <span>{randomMeal.emoji}</span>
              <span>{randomMeal.name}</span>
            </h4>

            <p className="text-[11px] text-slate-300 mb-2">
              <strong>Suroviny:</strong> {randomMeal.ingredients.join(', ')}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleAddTask(randomMeal)}
                className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nastavit jako aktivní úkol</span>
              </button>

              <button
                onClick={() => handleLogMeal(randomMeal)}
                disabled={loggedMeals[randomMeal.id]}
                className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                  loggedMeals[randomMeal.id]
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                {loggedMeals[randomMeal.id] ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Zaznamenáno (+10 XP)</span>
                  </>
                ) : (
                  <span>Snědeno (+10 XP)</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 3 Preparation Energy Categories */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-3 shrink-0">
          {(
            [
              { key: 'zero', label: 'Nulové úsilí', sub: 'Bez vaření' },
              { key: 'low', label: 'Nízké úsilí', sub: '5 minut' },
              { key: 'medium', label: 'Střední', sub: '10-15 minut' },
            ] as { key: MealEffort; label: string; sub: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                onPlayClick();
                setSelectedEffort(tab.key);
              }}
              className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                selectedEffort === tab.key
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold leading-tight">{tab.label}</div>
              <div className="text-[9px] opacity-80">{tab.sub}</div>
            </button>
          ))}
        </div>

        {/* Meal List in Selected Category (Scrollable with custom dark scrollbar) */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {(filteredMeals || []).map((meal) => {
            const isDone = loggedMeals[meal?.id];
            const isCustom = meal?.id?.startsWith('custom-meal-');

            return (
              <div
                key={meal?.id}
                className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all flex flex-col gap-2 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meal.emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-100">{meal.name}</h4>
                        {isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                            Vlastní
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-400 font-medium">{meal.prepTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isCustom && (
                      <button
                        onClick={() => handleDeleteCustomMeal(meal.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-slate-900 transition-all"
                        title="Smazat vlastní jídlo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleAddTask(meal)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all"
                      title="Nastavit jako úkol"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  <span className="font-semibold text-slate-300">Suroviny:</span> {meal.ingredients.join(', ')}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                    {meal.tips}
                  </span>

                  <button
                    onClick={() => handleLogMeal(meal)}
                    disabled={isDone}
                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/30'
                    }`}
                  >
                    {isDone ? '✓ Zapsáno (+10 XP)' : '+10 XP Snědeno'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Dashed Button "+ Add Custom Meal" at bottom of list */}
          <button
            onClick={() => {
              onPlayClick();
              setNewMealEffort(selectedEffort);
              setIsAddModalOpen(true);
            }}
            className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/40 hover:bg-slate-950 text-slate-400 hover:text-amber-300 transition-all text-xs font-bold flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-400" />
            <span>+ Přidat vlastní jídlo</span>
          </button>
        </div>

        {/* Inline Add Custom Meal Modal/Drawer */}
        {isAddModalOpen && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col z-20 animate-fadeIn custom-scrollbar overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Přidat vlastní rychlé jídlo
                </h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomMeal} className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Název jídla *
                  </label>
                  <input
                    type="text"
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    placeholder="např. Toust s arašídovým máslem"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Čas přípravy (min)
                    </label>
                    <input
                      type="text"
                      value={newMealPrepTime}
                      onChange={(e) => setNewMealPrepTime(e.target.value)}
                      placeholder="např. 3"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Náročnost
                    </label>
                    <select
                      value={newMealEffort}
                      onChange={(e) => setNewMealEffort(e.target.value as MealEffort)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="zero">Nulové úsilí (bez vaření)</option>
                      <option value="low">Nízké úsilí (5 minut)</option>
                      <option value="medium">Střední úsilí (10-15 minut)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Suroviny (oddělené čárkou)
                  </label>
                  <input
                    type="text"
                    value={newMealIngredients}
                    onChange={(e) => setNewMealIngredients(e.target.value)}
                    placeholder="Chleba, máslo, šunka, sýr"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Rychlý tip nebo poznámka (volitelné)
                  </label>
                  <input
                    type="text"
                    value={newMealTips}
                    onChange={(e) => setNewMealTips(e.target.value)}
                    placeholder="Opeč toust a rovnou namaž"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Ikona / Emoji
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(emojiOptions || []).map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewMealEmoji(em)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all ${
                          newMealEmoji === em
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 scale-110'
                            : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={!newMealName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider disabled:opacity-40 shadow-md"
                >
                  Uložit jídlo (+15 XP)
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
