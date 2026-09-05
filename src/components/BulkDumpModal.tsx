import React, { useState } from 'react';
import { X, Sparkles, FileText, Check, Zap } from 'lucide-react';
import { Task, EnergyLevel } from '../types';
import { autoTriageRawInput } from '../utils/triage';

interface BulkDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBulkTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'completed'>[]) => void;
  onPlayClick: () => void;
}

export const BulkDumpModal: React.FC<BulkDumpModalProps> = ({
  isOpen,
  onClose,
  onAddBulkTasks,
  onPlayClick,
}) => {
  const [text, setText] = useState('');
  const [useAutoTriage, setUseAutoTriage] = useState<boolean>(true);
  const [defaultMinutes, setDefaultMinutes] = useState<number>(2);

  if (!isOpen) return null;

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onPlayClick();

    if (useAutoTriage) {
      const triaged = autoTriageRawInput(text, 'medium');
      if (triaged.orderedTasks.length > 0) {
        onAddBulkTasks(
          triaged.orderedTasks.map((t) => ({
            title: t.title,
            estimatedMinutes: t.estimatedMinutes,
            energyLevel: t.energyLevel,
            category: t.category,
            xpReward: t.xpReward,
          }))
        );
        setText('');
        onClose();
        return;
      }
    }

    const lines = text
      .split('\n')
      .map((line) => line.replace(/^[-*•\d+.\s]+/, '').trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    const newTasks = lines.map((title) => {
      const energyLevel: EnergyLevel = defaultMinutes <= 2 ? 'low' : defaultMinutes <= 10 ? 'medium' : 'high';
      const xpReward = defaultMinutes <= 2 ? 30 : defaultMinutes <= 10 ? 50 : 80;

      return {
        title,
        estimatedMinutes: defaultMinutes,
        energyLevel,
        category: 'work' as const,
        xpReward,
      };
    });

    onAddBulkTasks(newTasks);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100 tracking-tight">Rychlý výsyp hlavy</h3>
            <p className="text-xs text-slate-400 font-medium">
              Vlož nebo napiš myšlenky • 1 úkol na řádek
            </p>
          </div>
        </div>

        <form onSubmit={handleImport} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={`Vysyp sem všechno, co ti leží v hlavě:\n• Vypít půl litru vody\n• Dokončit prezentaci pro klienta\n• Odpovědět na hořící e-maily\n• Vynést tříděný odpad`}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed resize-none custom-scrollbar"
            autoFocus
          />

          {/* Auto Triage Switch */}
          <div
            onClick={() => setUseAutoTriage(!useAutoTriage)}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-black text-slate-200 block">
                  ADHD auto-třídění úkolů
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Zahřátí (2 min) → Zásadní úkol → Rychlé zářezy
                </span>
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                useAutoTriage ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  useAutoTriage ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all disabled:opacity-40"
            >
              Nahrát do fronty autopilota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
