import React, { useState } from 'react';
import {
  Link2,
  Plus,
  User,
  Calendar,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  X,
  Clock,
  ChevronRight,
  ShieldCheck,
  Bell,
  BellOff,
} from 'lucide-react';
import { OpenLoop, SoftUrgency } from '../types';
import { requestNotificationPermission } from '../utils/notifications';
import {
  normalizeDueDateTime,
  formatDueDateTime,
  getReminderHelperText,
} from '../utils/dateTime';

interface OpenLoopsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  openLoops: OpenLoop[];
  onAddOpenLoop: (
    title: string,
    person?: string,
    dueDate?: string,
    softUrgency?: SoftUrgency,
    remindOnDueDate?: boolean
  ) => void;
  onCompleteOpenLoop: (loopId: string) => void;
  onDropOpenLoop: (loopId: string) => void;
  onPromoteLoopToToday: (loop: OpenLoop) => void;
  onPlayClick?: () => void;
}

export const OpenLoopsDrawer: React.FC<OpenLoopsDrawerProps> = ({
  isOpen,
  onClose,
  openLoops,
  onAddOpenLoop,
  onCompleteOpenLoop,
  onDropOpenLoop,
  onPromoteLoopToToday,
  onPlayClick,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  const [newUrgency, setNewUrgency] = useState<SoftUrgency>('few_days');
  const [remindOnDueDate, setRemindOnDueDate] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const activeLoops = (openLoops || []).filter((l) => l?.status === 'open');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onPlayClick) onPlayClick();

    const normalizedDueDate = newDueDate ? normalizeDueDateTime(newDueDate, newDueTime) : undefined;

    if (normalizedDueDate && remindOnDueDate) {
      await requestNotificationPermission();
    }

    onAddOpenLoop(
      newTitle.trim(),
      newPerson.trim() || undefined,
      normalizedDueDate,
      newUrgency,
      normalizedDueDate ? remindOnDueDate : false
    );

    setNewTitle('');
    setNewPerson('');
    setNewDueDate('');
    setNewDueTime('');
    setRemindOnDueDate(true);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>Otevřené smyčky (ŽIVOT)</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {activeLoops.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Závazky a lidé na pozadí. Připomenou se, jen když hoří termín nebo při ranním plánování.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onPlayClick) onPlayClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Form / Toggle */}
        {!showAddForm ? (
          <button
            onClick={() => {
              if (onPlayClick) onPlayClick();
              setShowAddForm(true);
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-950/80 border border-dashed border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Zapsat nový závazek / člověka</span>
          </button>
        ) : (
          <form onSubmit={handleCreate} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Co je potřeba udělat? (např. Poslat Petrovi nabídku)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="space-y-2">
              <input
                type="text"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="Člověk / kontakt (volitelné, např. Máma, Klient, Šéf)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Termín (volitelné)
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Čas (volitelné, výchozí 9:00)
                  </label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    disabled={!newDueDate}
                    placeholder="09:00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            {/* Notification Opt-in Prompt on Due Date */}
            {newDueDate ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-indigo-400" />
                    Upozornit v den a čas termínu?
                  </span>
                  <span className="text-[9px] text-slate-400">1 push notifikace</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      setRemindOnDueDate(true);
                      await requestNotificationPermission();
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                      remindOnDueDate
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bell className="w-3 h-3" />
                    <span>Ano, připomenout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemindOnDueDate(false)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      !remindOnDueDate
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <BellOff className="w-3 h-3" />
                    <span>Ne, jen sledovat</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {remindOnDueDate ? (
                    <span className="text-indigo-300 font-medium">
                      ✓ {getReminderHelperText(newDueDate, newDueTime)}
                    </span>
                  ) : (
                    'Pasivní sledování v sekci ŽIVOT — počká na ranní plánování bez notifikací.'
                  )}
                </p>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>{getReminderHelperText(newDueDate, newDueTime)}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase disabled:opacity-50"
              >
                Uložit
              </button>
            </div>
          </form>
        )}

        {/* Loops List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {activeLoops.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">
                Žádné otevřené smyčky. Všechny závazky na pozadí jsou čisté!
              </p>
            </div>
          ) : (
            (activeLoops || []).map((loop) => {
              const formattedDue = formatDueDateTime(loop?.dueDate);
              return (
                <div
                  key={loop?.id}
                  className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 leading-snug">
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
                    <button
                      onClick={() => {
                        if (onPlayClick) onPlayClick();
                        onPromoteLoopToToday(loop);
                      }}
                      className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                      title="Přesunout do dnešní fronty (Zásadní krok)"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dnes</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onPlayClick) onPlayClick();
                        onCompleteOpenLoop(loop.id);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-all"
                      title="Hotovo"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (onPlayClick) onPlayClick();
                        onDropOpenLoop(loop.id);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                      title="Smazat smyčku"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};
