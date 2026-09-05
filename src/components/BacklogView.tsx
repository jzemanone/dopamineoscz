import React, { useState } from 'react';
import {
  Inbox,
  Plus,
  Sparkles,
  Trash2,
  CheckCircle2,
  Circle,
  Split,
  Play,
  Flame,
  Zap,
  ArrowUpRight,
  Filter,
  Check,
  RotateCcw,
  Link2,
  User,
  Calendar,
  ShieldCheck,
  Bell,
  BellOff,
  Clock,
} from 'lucide-react';
import { Task, EnergyLevel, OpenLoop, SoftUrgency } from '../types';
import { autoTriageRawInput, autoTriageTaskList } from '../utils/triage';
import { requestNotificationPermission } from '../utils/notifications';
import {
  normalizeDueDateTime,
  formatDueDateTime,
  getReminderHelperText,
} from '../utils/dateTime';
import { ProGateOverlay } from './ProGateOverlay';

interface BacklogViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  openLoops?: OpenLoop[];
  isPro?: boolean;
  onOpenPaywall?: () => void;
  onSelectActiveTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddBulkTasks: (newTasks: Omit<Task, 'id' | 'createdAt' | 'completed'>[]) => void;
  onReorderTasks: (newOrderedTasks: Task[]) => void;
  onDecomposeTask: (taskId: string) => void;
  onAddOpenLoop?: (
    title: string,
    person?: string,
    dueDate?: string,
    softUrgency?: SoftUrgency,
    remindOnDueDate?: boolean
  ) => void;
  onCompleteOpenLoop?: (loopId: string) => void;
  onDropOpenLoop?: (loopId: string) => void;
  onPromoteLoopToToday?: (loop: OpenLoop) => void;
  onPlayClick: () => void;
}

export const BacklogView: React.FC<BacklogViewProps> = ({
  tasks,
  activeTaskId,
  openLoops = [],
  isPro = false,
  onOpenPaywall,
  onSelectActiveTask,
  onToggleComplete,
  onDeleteTask,
  onAddBulkTasks,
  onReorderTasks,
  onDecomposeTask,
  onAddOpenLoop,
  onCompleteOpenLoop,
  onDropOpenLoop,
  onPromoteLoopToToday,
  onPlayClick,
}) => {
  const [subTab, setSubTab] = useState<'tasks' | 'loops'>('tasks');
  const [filterEnergy, setFilterEnergy] = useState<EnergyLevel | 'all'>('all');
  const [rawDumpText, setRawDumpText] = useState<string>('');
  const [isDumpExpanded, setIsDumpExpanded] = useState<boolean>(false);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  // Open Loops Form state
  const [showAddLoop, setShowAddLoop] = useState(false);
  const [newLoopTitle, setNewLoopTitle] = useState('');
  const [newLoopPerson, setNewLoopPerson] = useState('');
  const [newLoopDueDate, setNewLoopDueDate] = useState('');
  const [newLoopDueTime, setNewLoopDueTime] = useState('');
  const [newLoopUrgency, setNewLoopUrgency] = useState<SoftUrgency>('few_days');
  const [remindOnDueDate, setRemindOnDueDate] = useState<boolean>(true);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const activeLoops = openLoops.filter((l) => l.status === 'open');

  const filteredPending = pendingTasks.filter((t) => {
    if (filterEnergy === 'all') return true;
    return t.energyLevel === filterEnergy;
  });

  const handleApplyAutoTriage = () => {
    onPlayClick();
    const triaged = autoTriageTaskList(tasks);
    onReorderTasks(triaged);
  };

  const handleDumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawDumpText.trim()) return;
    onPlayClick();
    const result = autoTriageRawInput(rawDumpText, 'medium');
    if (result.orderedTasks.length > 0) {
      onAddBulkTasks(
        result.orderedTasks.map((t) => ({
          title: t.title,
          estimatedMinutes: t.estimatedMinutes,
          energyLevel: t.energyLevel,
          category: t.category,
          xpReward: t.xpReward,
        }))
      );
      setRawDumpText('');
      setIsDumpExpanded(false);
    }
  };

  const handleCreateLoop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoopTitle.trim() || !onAddOpenLoop) return;
    onPlayClick();

    const normalizedDueDate = newLoopDueDate
      ? normalizeDueDateTime(newLoopDueDate, newLoopDueTime)
      : undefined;

    if (normalizedDueDate && remindOnDueDate) {
      await requestNotificationPermission();
    }

    onAddOpenLoop(
      newLoopTitle.trim(),
      newLoopPerson.trim() || undefined,
      normalizedDueDate,
      newLoopUrgency,
      normalizedDueDate ? remindOnDueDate : false
    );
    setNewLoopTitle('');
    setNewLoopPerson('');
    setNewLoopDueDate('');
    setNewLoopDueTime('');
    setRemindOnDueDate(true);
    setShowAddLoop(false);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Sub-navigation Switch: Daily Tasks vs Open Loops */}
      <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
        <button
          onClick={() => {
            onPlayClick();
            setSubTab('tasks');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            subTab === 'tasks'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Zásobník úkolů ({pendingTasks.length})</span>
        </button>

        <button
          onClick={() => {
            onPlayClick();
            setSubTab('loops');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            subTab === 'loops'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Otevřené smyčky ({activeLoops.length})</span>
        </button>
      </div>

      {subTab === 'tasks' ? (
        <>
          {/* Header & Smart Auto-Triage Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-100 tracking-tight">
                  Zásobník & Fronta úkolů
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {pendingTasks.length} čeká • {completedTasks.length} hotovo
                </p>
              </div>
            </div>

            <button
              onClick={handleApplyAutoTriage}
              className="py-2 px-3.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
              title="Automaticky seřadit: Rozcvička -> Úkol dne -> Rychlá výhra"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Automaticky seřadit</span>
            </button>
          </div>

          {/* Raw Brain Dump Quick Box */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                Rychlý výsyp myšlenek
              </span>
              <button
                onClick={() => setIsDumpExpanded(!isDumpExpanded)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-200"
              >
                {isDumpExpanded ? 'Sbalit' : 'Víceřádkový výsyp'}
              </button>
            </div>

            <form onSubmit={handleDumpSubmit} className="space-y-2">
              {isDumpExpanded ? (
                <textarea
                  value={rawDumpText}
                  onChange={(e) => setRawDumpText(e.target.value)}
                  placeholder="Vlož nebo napiš cokoliv (jeden úkol na řádek)...&#10;• Zavolat zubaři&#10;• Dokončit prezentaci&#10;• Vypít 500ml vody"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              ) : (
                <input
                  type="text"
                  value={rawDumpText}
                  onChange={(e) => setRawDumpText(e.target.value)}
                  placeholder="Vysyp myšlenku (stiskni Enter)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!rawDumpText.trim()}
                  className="py-2 px-4 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all disabled:opacity-40"
                >
                  Přidat do zásobníku
                </button>
              </div>
            </form>
          </div>

          {/* Energy Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => {
                onPlayClick();
                setFilterEnergy('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterEnergy === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Vše ({pendingTasks.length})
            </button>

            <button
              onClick={() => {
                onPlayClick();
                setFilterEnergy('low');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterEnergy === 'low'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Nízká energie ({pendingTasks.filter((t) => t.energyLevel === 'low').length})
            </button>

            <button
              onClick={() => {
                onPlayClick();
                setFilterEnergy('medium');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterEnergy === 'medium'
                  ? 'bg-blue-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Střední ({pendingTasks.filter((t) => t.energyLevel === 'medium').length})
            </button>

            <button
              onClick={() => {
                onPlayClick();
                setFilterEnergy('high');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterEnergy === 'high'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Plná síla ({pendingTasks.filter((t) => t.energyLevel === 'high').length})
            </button>
          </div>

          {/* Pending Task Cards List */}
          <div className="space-y-2">
            {filteredPending.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <p className="text-xs font-bold text-slate-400">
                  Žádné úkoly pro tento filtr. Vše je čisté!
                </p>
              </div>
            ) : (
              filteredPending.map((t) => {
                const isActive = t.id === activeTaskId;
                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => {
                          onPlayClick();
                          onToggleComplete(t.id);
                        }}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {t.title}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase border border-amber-500/30">
                              Aktivní
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              t.energyLevel === 'low'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : t.energyLevel === 'medium'
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {t.estimatedMinutes}m • {t.energyLevel === 'low' ? 'nízká' : t.energyLevel === 'medium' ? 'střední' : 'vysoká'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            +{t.xpReward} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onPlayClick();
                          onDecomposeTask(t.id);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all"
                        title="Rozsekat na 3 kroky"
                      >
                        <Split className="w-4 h-4" />
                      </button>

                      {!isActive && (
                        <button
                          onClick={() => {
                            onPlayClick();
                            onSelectActiveTask(t.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-black flex items-center gap-1 transition-all"
                          title="Nastavit jako aktivní fokus"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Fokus</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onPlayClick();
                          onDeleteTask(t.id);
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                        title="Smazat úkol"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Collapsible Completed Section */}
          {completedTasks.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showCompleted
                  ? `Skrýt ${completedTasks.length} hotových úkolů ▲`
                  : `Zobrazit ${completedTasks.length} hotových úkolů (${completedTasks.reduce((acc, curr) => acc + (curr.xpReward || 25), 0)} XP získáno) ▼`}
              </button>

              {showCompleted && (
                <div className="space-y-1.5 mt-2">
                  {completedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-slate-850 flex items-center justify-between gap-2 text-slate-500"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs line-through truncate">{t.title}</span>
                      </div>
                      <button
                        onClick={() => {
                          onPlayClick();
                          onToggleComplete(t.id);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-300"
                      >
                        Obnovit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* ========================================================================= */
        /* SUB-TAB: OPEN LOOPS (LIFE LAYER) - GATED BEHIND PROGATEOVERLAY */
        /* ========================================================================= */
        <ProGateOverlay
          isPro={Boolean(isPro)}
          title="LIFE Vrstva & Otevřené smyčky"
          description="Vysyp z hlavy nedořešené závazky, kontakty a budoucí termíny, ať ti nezabírají pracovní paměť."
          onUnlock={onOpenPaywall || (() => {})}
          featureTag="PRO LIFE VRSTVA"
        >
          <div className="space-y-3 animate-fadeIn">
            {/* Open Loops Header & Intro */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-100 tracking-tight">
                    Otevřené smyčky (LIFE vrstva)
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {activeLoops.length > 0 ? activeLoops.length : '3'} závazků a kontaktů na pozadí
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                Závazky, které čekají na ostatní nebo na konkrétní datum. Jakmile přijde termín, automaticky se přesunou do denní fronty.
              </p>
            </div>

            {/* Add Loop Button / Inline Form */}
            {!showAddLoop ? (
              <button
                onClick={() => {
                  if (!isPro && onOpenPaywall) {
                    onOpenPaywall();
                    return;
                  }
                  onPlayClick();
                  setShowAddLoop(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Zapsat nový závazek nebo kontakt</span>
              </button>
            ) : (
              <form onSubmit={handleCreateLoop} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Nová otevřená smyčka
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddLoop(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-300"
                  >
                    Zrušit
                  </button>
                </div>

                <input
                  type="text"
                  value={newLoopTitle}
                  onChange={(e) => setNewLoopTitle(e.target.value)}
                  placeholder="Co je to za závazek? (např. Poslat audit Martinovi do pátku)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newLoopPerson}
                    onChange={(e) => setNewLoopPerson(e.target.value)}
                    placeholder="Člověk / Kontakt (volitelné, např. Máma, Klient, Šéf)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Termín (volitelné)
                      </label>
                      <input
                        type="date"
                        value={newLoopDueDate}
                        onChange={(e) => setNewLoopDueDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Čas (volitelné, výchozí 9:00)
                      </label>
                      <input
                        type="time"
                        value={newLoopDueTime}
                        onChange={(e) => setNewLoopDueTime(e.target.value)}
                        disabled={!newLoopDueDate}
                        placeholder="09:00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Opt-in Prompt on Due Date */}
                {newLoopDueDate ? (
                  <div className="p-3 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-indigo-400" />
                        Připomenout v den a čas termínu?
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">1 push notifikace</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setRemindOnDueDate(true);
                          await requestNotificationPermission();
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                          remindOnDueDate
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Ano, připomenout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemindOnDueDate(false)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          !remindOnDueDate
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                        }`}
                      >
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Ne, jen evidovat</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {remindOnDueDate ? (
                        <span className="text-indigo-300 font-medium">
                          ✓ {getReminderHelperText(newLoopDueDate, newLoopDueTime)}
                        </span>
                      ) : (
                        'Pasivní sledování na pozadí — ukáže se jen při ranním plánování.'
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{getReminderHelperText(newLoopDueDate, newLoopDueTime)}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!newLoopTitle.trim()}
                    className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider disabled:opacity-40 transition-all shadow-md"
                  >
                    Uložit smyčku
                  </button>
                </div>
              </form>
            )}

            {/* Active Loops List */}
            <div className="space-y-2">
              {activeLoops.length === 0 ? (
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-400/60 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">
                    Žádné otevřené smyčky! Hlava je čistá a bez zátěže.
                  </p>
                </div>
              ) : (
                activeLoops.map((loop) => {
                  const formattedDue = formatDueDateTime(loop.dueDate);
                  return (
                    <div
                      key={loop.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                            {loop.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {loop.person && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
                                <User className="w-2.5 h-2.5" />
                                {loop.person}
                              </span>
                            )}
                            {loop.dueDate && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {formattedDue?.label || loop.dueDate}
                              </span>
                            )}
                            {loop.dueDate && loop.remindOnDueDate && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                                  loop.notified
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                }`}
                              >
                                <Bell className="w-2.5 h-2.5" />
                                {loop.notified ? 'Upozorněno' : 'Notifikace nastavena'}
                              </span>
                            )}
                            {loop.parkedCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                                {loop.parkedCount}× odloženo
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onPromoteLoopToToday && (
                            <button
                              onClick={() => {
                                onPlayClick();
                                onPromoteLoopToToday(loop);
                              }}
                              className="px-2 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all border border-amber-500/30"
                              title="Přesunout do dnešního plánu (Úkol dne)"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Dnes</span>
                            </button>
                          )}

                          {onCompleteOpenLoop && (
                            <button
                              onClick={() => {
                                onPlayClick();
                                onCompleteOpenLoop(loop.id);
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-all"
                              title="Označit jako hotové (+25 XP)"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {onDropOpenLoop && (
                            <button
                              onClick={() => {
                                onPlayClick();
                                onDropOpenLoop(loop.id);
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                              title="Zahodit smyčku (bez výčitek)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </ProGateOverlay>
      )}
    </div>
  );
};
