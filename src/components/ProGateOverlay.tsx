import React from 'react';
import { Lock, Sparkles, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export interface ProGateOverlayProps {
  isPro: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
  onUnlock: () => void;
  featureTag?: string;
  priceText?: string;
}

export const ProGateOverlay: React.FC<ProGateOverlayProps> = ({
  isPro,
  title,
  description,
  children,
  onUnlock,
  featureTag = 'PRO FUNKCE',
  priceText = 'Odemknout plný přístup (390 Kč)',
}) => {
  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl w-full group">
      {/* Blurred background preview */}
      <div
        className="filter blur-md pointer-events-none select-none opacity-30 sm:opacity-40 transition-all duration-200"
        aria-hidden="true"
        tabIndex={-1}
      >
        {children}
      </div>

      {/* Frosted Glass Lock Overlay Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-[6px] animate-fadeIn">
        <div className="w-full max-w-md bg-gradient-to-b from-[#141A28]/95 via-[#0F1422]/95 to-[#0A0D16]/95 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/15 space-y-3.5 text-center relative ring-1 ring-amber-500/20 my-auto">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Glowing Lock Icon */}
          <div className="relative mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Lock className="w-6 h-6 text-amber-400 fill-amber-400/20" />
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
            <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{featureTag}</span>
          </div>

          {/* Headline & Value Proposition */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              {description}
            </p>
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={onUnlock}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current stroke-none" />
            <span>⚡ {priceText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Reassurance */}
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>⚡ Jednorázová platba • Doživotní přístup • Žádné předplatné</span>
          </p>
        </div>
      </div>
    </div>
  );
};
