import React from 'react';
import { LifeBuoy, Utensils, Plus, Inbox, Zap } from 'lucide-react';

interface BottomActionDockProps {
  onOpenReset: () => void;
  onOpenMeals: () => void;
  onOpenQuickCapture: () => void;
  onOpenInbox: () => void;
  pendingTaskCount: number;
  onPlayClick: () => void;
}

export const BottomActionDock: React.FC<BottomActionDockProps> = ({
  onOpenReset,
  onOpenMeals,
  onOpenQuickCapture,
  onOpenInbox,
  pendingTaskCount,
  onPlayClick,
}) => {
  return (
    <div className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
      <nav
        aria-label="Quick Actions Dock"
        className="pointer-events-auto w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-slate-750/80 shadow-2xl shadow-slate-950/80 rounded-2xl p-1.5 flex items-center justify-between gap-1 ring-1 ring-white/10"
      >
        {/* 1. SOS / Reset */}
        <button
          onClick={() => {
            onPlayClick();
            onOpenReset();
          }}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:scale-95 transition-all group"
          title="Reset / SOS Menu"
        >
          <div className="relative">
            <LifeBuoy className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">SOS Reset</span>
        </button>

        {/* 2. Zero-Decision Meals */}
        <button
          onClick={() => {
            onPlayClick();
            onOpenMeals();
          }}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 active:scale-95 transition-all group"
          title="Jídlo bez rozhodování"
        >
          <Utensils className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Jídlo</span>
        </button>

        {/* 3. Quick Brain Dump (+) - Prominent Center Action */}
        <button
          onClick={() => {
            onPlayClick();
            onOpenQuickCapture();
          }}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          title="Rychlý výsyp myšlenek (+)"
        >
          <div className="flex items-center gap-1">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="text-[10px] font-black tracking-tight uppercase leading-none mt-1">Výsyp (+)</span>
        </button>

        {/* 4. Task Inbox */}
        <button
          onClick={() => {
            onPlayClick();
            onOpenInbox();
          }}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all relative group"
          title="Schránka úkolů"
        >
          <div className="relative">
            <Inbox className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {pendingTaskCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {pendingTaskCount > 9 ? '9+' : pendingTaskCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Schránka</span>
        </button>
      </nav>
    </div>
  );
};
