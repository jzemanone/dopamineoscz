import React, { useState } from 'react';
import { X, Check, Trash2, Zap, Play, CheckCircle2, Clock, Plus } from 'lucide-react';
import { Task } from '../types';

interface TaskInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  activeTaskId: string | null;
  onSelectActiveTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onPlayClick: () => void;
}

export const TaskInboxDrawer: React.FC<TaskInboxDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  activeTaskId,
  onSelectActiveTask,
  onToggleComplete,
  onDeleteTask,
  onPlayClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Click backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer content */}
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Zásobník úkolů & Inbox</h3>
              <p className="text-[11px] text-slate-400">
                {pendingCount} aktivních • {completedCount} hotových
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-900 flex gap-2">
          {([
            { key: 'pending', label: 'K vyřízení' },
            { key: 'all', label: 'Vše' },
            { key: 'completed', label: 'Hotovo' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => {
                onPlayClick();
                setFilter(f.key);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === f.key
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label} ({f.key === 'pending' ? pendingCount : f.key === 'completed' ? completedCount : tasks.length})
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Žádné úkoly v tomto zobrazení.</p>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isActive = t.id === activeTaskId;
              const energyLabel =
                t.energyLevel === 'low'
                  ? 'nízká'
                  : t.energyLevel === 'high'
                  ? 'vysoká'
                  : 'střední';

              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 shadow-md'
                      : t.completed
                      ? 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        onPlayClick();
                        onToggleComplete(t.id);
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                        t.completed
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          t.completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {t.estimatedMinutes}m
                        </span>
                        <span>•</span>
                        <span>{energyLabel} energie</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">+{t.xpReward} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!t.completed && !isActive && (
                      <button
                        onClick={() => {
                          onPlayClick();
                          onSelectActiveTask(t.id);
                          onClose();
                        }}
                        className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1"
                        title="Nastavit jako aktivní úkol"
                      >
                        <Play className="w-3 h-3 fill-amber-300" />
                        <span className="text-[10px]">Fokus</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onPlayClick();
                        onDeleteTask(t.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Smazat úkol"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
