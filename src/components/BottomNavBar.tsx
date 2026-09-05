import React from 'react';
import { Compass, Inbox, LifeBuoy, Plus, Wrench } from 'lucide-react';

export type MainTabType = 'today' | 'backlog' | 'toolkit' | 'sos';

interface BottomNavBarProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  pendingCount: number;
  onOpenQuickDump: () => void;
  onPlayClick: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  pendingCount,
  onOpenQuickDump,
  onPlayClick,
}) => {
  return (
    <div className="shrink-0 w-full max-w-md mx-auto pt-1 pointer-events-none flex justify-center z-40">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto w-full bg-neutral-950 border border-neutral-800 shadow-2xl rounded-2xl p-1.5 flex items-center justify-between gap-1"
      >
        {/* 1. Today Flow (Autopilot) */}
        <button
          onClick={() => {
            onPlayClick();
            onChangeTab('today');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl transition-all ${
            activeTab === 'today'
              ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Dnešní autopilot"
        >
          <Compass className={`w-5 h-5 ${activeTab === 'today' ? 'text-amber-400' : ''}`} />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Dnes</span>
        </button>

        {/* 2. Task Backlog */}
        <button
          onClick={() => {
            onPlayClick();
            onChangeTab('backlog');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl transition-all relative ${
            activeTab === 'backlog'
              ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Zásobník úkolů"
        >
          <div className="relative">
            <Inbox className={`w-5 h-5 ${activeTab === 'backlog' ? 'text-amber-400' : ''}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Zásobník</span>
        </button>

        {/* 3. Quick Dump Button (+) */}
        <button
          onClick={() => {
            onPlayClick();
            onOpenQuickDump();
          }}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          title="Rychlý výsyp myšlenek (+)"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span className="text-[10px] font-black uppercase tracking-tight leading-none mt-1">
            Výsyp
          </span>
        </button>

        {/* 4. Toolkit (Calm Utilities: Meal Prep & Spending Pause) */}
        <button
          onClick={() => {
            onPlayClick();
            onChangeTab('toolkit');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl transition-all ${
            activeTab === 'toolkit'
              ? 'bg-indigo-500/20 text-indigo-300 font-black border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Nástroje (Jídlo bez přemýšlení & Stopka nákupů)"
        >
          <Wrench className={`w-5 h-5 ${activeTab === 'toolkit' ? 'text-indigo-400' : ''}`} />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Nástroje</span>
        </button>

        {/* 5. SOS Freeze Breaker */}
        <button
          onClick={() => {
            onPlayClick();
            onChangeTab('sos');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl transition-all ${
            activeTab === 'sos'
              ? 'bg-rose-500/20 text-rose-300 font-black border border-rose-500/30'
              : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
          }`}
          title="SOS Reset při paralýze"
        >
          <div className="relative">
            <LifeBuoy className="w-5 h-5 text-rose-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">SOS Reset</span>
        </button>
      </nav>
    </div>
  );
};
