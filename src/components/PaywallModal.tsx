import React, { useState } from 'react';
import {
  X,
  Check,
  Key,
  ArrowRight,
  ShieldCheck,
  Lock,
  FileText,
  Zap,
} from 'lucide-react';
import { STRIPE_STANDARD_URL, STRIPE_ULTIMATE_URL } from '../lib/freemium';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRestoreKey: () => void;
  onPlayClick?: () => void;
  completedTasksCount?: number;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onOpenRestoreKey,
  onPlayClick,
}) => {
  const [includeBump, setIncludeBump] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleCheckout = (useBump: boolean) => {
    if (onPlayClick) onPlayClick();
    const targetUrl = useBump ? STRIPE_ULTIMATE_URL : STRIPE_STANDARD_URL;
    window.location.href = targetUrl;
  };

  const handleRestoreClick = () => {
    if (onPlayClick) onPlayClick();
    onClose();
    onOpenRestoreKey();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="w-full max-w-lg bg-gradient-to-b from-[#131927] via-[#0F1420] to-[#0A0D15] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/15 space-y-4 relative ring-1 ring-amber-500/20 my-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (onPlayClick) onPlayClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Offer Badge & Header */}
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>⚡ ⚡ JEDNORÁZOVÁ NABÍDKA — POUZE PŘI OBJEDNÁVCE</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Dokonči svou objednávku
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Získej doživotní přístup k Dopamine OS bez jakéhokoliv předplatného.
          </p>
        </div>

        {/* Order Stack Section */}
        <div className="space-y-3 pt-1">
          {/* Base Product Card (Fixed) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-750/90 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              {/* DOS Icon Badge */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs tracking-wider shrink-0 shadow-md shadow-amber-500/20">
                DOS
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-slate-100 truncate">
                  Dopamine OS | Doživotní přístup
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  Úkoly podle energie, XP, Výsyp hlavy, kompletní systém
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-base sm:text-lg font-black text-amber-300">390 Kč</span>
              <span className="block text-[10px] text-slate-400 font-semibold">jednorázově</span>
            </div>
          </div>

          {/* Interactive Order Bump Card (Toggleable Checkbox) */}
          <div
            onClick={() => {
              if (onPlayClick) onPlayClick();
              setIncludeBump(!includeBump);
            }}
            className={`cursor-pointer rounded-2xl p-4 sm:p-4.5 transition-all duration-200 border text-left ${
              includeBump
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 opacity-80'
            }`}
          >
            {/* Header with Checkbox */}
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                  includeBump
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'border-2 border-slate-600 bg-slate-900'
                }`}
              >
                {includeBump && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-1.5 leading-snug">
                    <span>Přidat: ADHD Prompt Trezor — 50 AI promptů</span>
                    <span className="text-emerald-400 font-black shrink-0">(+149 Kč)</span>
                  </h4>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  50 hotových ChatGPT promptů pro ADHD mozek. Rutiny, soustředění, zvládání emocí, jídelníčky. Lidé s tímto balíčkem mívají výsledky 3× rychleji.
                </p>

                {/* Feature Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-750 text-[10px] font-bold text-slate-300">
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span>📄 PDF ke stažení</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-750 text-[10px] font-bold text-slate-300">
                    <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>⚡ Okamžité doručení</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Total Line */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between px-4">
          <span className="text-xs font-bold text-slate-300">Dnes celkem:</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-amber-300">
              {includeBump ? '539 Kč' : '390 Kč'}
            </span>
            <span className="text-xs font-bold text-slate-400">jednorázově</span>
          </div>
        </div>

        {/* Primary CTA & Direct Fallback Sublink */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleCheckout(includeBump)}
            className="w-full py-4 px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <Lock className="w-4 h-4 fill-current stroke-none" />
            <span>
              {includeBump
                ? '🔒 DOKONČIT NÁKUP — 539 Kč →'
                : '🔒 DOKONČIT NÁKUP — 390 Kč →'}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Sub-Link (Fallback) */}
          {includeBump && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  if (onPlayClick) onPlayClick();
                  setIncludeBump(false);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 underline-offset-2 transition-colors font-medium"
              >
                Ne, díky, chci jen Dopamine OS za 390 Kč
              </button>
            </div>
          )}
        </div>

        {/* Reassurance & Guarantee */}
        <div className="pt-1 text-center">
          <p className="text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>🛡️ 30denní garance vrácení peněz • Jednorázová platba • Žádné předplatné</span>
          </p>
        </div>

        {/* Footer Restore Key & Dismiss */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={handleRestoreClick}
            className="hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800/50"
          >
            <Key className="w-3.5 h-3.5 text-amber-400/80" />
            <span>Už máš licenci? Obnovit přístup</span>
          </button>

          <button
            onClick={() => {
              if (onPlayClick) onPlayClick();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium py-1 px-2 transition-colors"
          >
            Možná později
          </button>
        </div>
      </div>
    </div>
  );
};
