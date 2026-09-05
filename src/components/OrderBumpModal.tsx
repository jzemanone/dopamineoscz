import React, { useState } from 'react';
import { X, Check, Zap, FileText, Lock, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { trackCheckoutRedirect, getStoredUtmParams } from '../lib/analytics';
import { STRIPE_STANDARD_URL, STRIPE_ULTIMATE_URL } from '../lib/freemium';

interface OrderBumpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderBumpModal: React.FC<OrderBumpModalProps> = ({ isOpen, onClose }) => {
  const [includeBump, setIncludeBump] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = (productKeyOverride?: 'base' | 'base_with_vault') => {
    const selectedProduct = productKeyOverride || (includeBump ? 'base_with_vault' : 'base');
    const totalAmount = selectedProduct === 'base_with_vault' ? 539 : 390;
    setLoading(true);
    setErrorMsg(null);

    // Track analytics conversion checkpoint
    trackCheckoutRedirect(selectedProduct, totalAmount, selectedProduct === 'base_with_vault');

    let redirectUrl =
      selectedProduct === 'base_with_vault'
        ? STRIPE_ULTIMATE_URL
        : STRIPE_STANDARD_URL;

    try {
      const utm = getStoredUtmParams();
      if (utm.utm_source) {
        const url = new URL(redirectUrl);
        url.searchParams.set('utm_source', utm.utm_source);
        if (utm.utm_medium) url.searchParams.set('utm_medium', utm.utm_medium);
        if (utm.utm_campaign) url.searchParams.set('utm_campaign', utm.utm_campaign);
        redirectUrl = url.toString();
      }
    } catch {
      // url formatting fallback
    }

    window.location.href = redirectUrl;
  };

  const currentTotal = includeBump ? 539 : 390;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Container */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all text-lg font-medium"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Label Banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>⚡ JEDNORÁZOVÁ NABÍDKA — POUZE PŘI OBJEDNÁVCE</span>
        </div>

        {/* Modal Title */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight leading-snug mb-1">
          Dokonči svou objednávku
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Získej doživotní přístup k Dopamine OS bez jakéhokoliv předplatného.
        </p>

        {/* Base Product Row */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md shadow-amber-500/20 text-sm">
              DOS
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Dopamine OS <span className="text-xs text-slate-400 font-normal">| Doživotní přístup</span>
              </h4>
              <p className="text-[11px] text-slate-400">Úkoly podle energie, XP, Výsyp hlavy</p>
            </div>
          </div>
          <span className="text-base font-black text-amber-400">390 Kč</span>
        </div>

        {/* Order Bump Card (Emerald Green Border) */}
        <div
          onClick={() => !loading && setIncludeBump(!includeBump)}
          className={`cursor-pointer rounded-2xl p-4 transition-all border-2 relative ${
            includeBump
              ? 'bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Top Checkbox Row */}
          <div className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                includeBump
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                  : 'border-slate-700 bg-slate-950'
              }`}
            >
              {includeBump && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 leading-snug">
                  Přidat: ADHD Prompt Trezor — 50 AI promptů (+149 Kč)
                </span>
              </div>

              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                50 hotových ChatGPT promptů pro ADHD mozek. Rutiny, soustředění, zvládání emocí, jídelníčky. Lidé s tímto balíčkem mívají výsledky 3× rychleji.
              </p>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5" />
                  PDF ke stažení
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  Okamžité doručení
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Total Display */}
        <div className="my-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Dnes celkem:</span>
          <div className="text-right">
            <span className="text-lg sm:text-xl font-black text-amber-400">
              {currentTotal} Kč <span className="text-xs text-slate-400 font-normal">jednorázově</span>
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Primary Checkout Button */}
        <button
          onClick={() => handleCheckout()}
          disabled={loading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Přesměrování na pokladnu...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Dokončit nákup — {currentTotal} Kč →</span>
            </>
          )}
        </button>

        {/* Decline Link */}
        <div className="text-center mt-3">
          <button
            onClick={() => handleCheckout('base')}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
          >
            Ne, díky, chci jen Dopamine OS za 390 Kč
          </button>
        </div>

        {/* Footer Trust Line */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>30denní garance vrácení peněz · Jednorázová platba · Žádné předplatné</span>
        </div>
      </div>
    </div>
  );
};
