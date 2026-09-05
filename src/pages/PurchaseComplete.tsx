import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Download,
  ShieldCheck,
  FileText,
  Key,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { grantAccess, PRIMARY_MASTER_KEY } from '../utils/storage';
import { initPaymentCheck } from '../lib/freemium';
import { Logo } from '../components/Logo';
import { trackEvent } from '../lib/analytics';

interface PurchaseCompleteProps {
  onNavigateToApp: () => void;
}

export const PurchaseComplete: React.FC<PurchaseCompleteProps> = ({
  onNavigateToApp,
}) => {
  const [copied, setCopied] = useState(false);
  const [urlParams, setUrlParams] = useState<URLSearchParams>(
    () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  );

  const productKey = urlParams.get('product') || 'base';
  const customerEmail = urlParams.get('email') || '';
  const isBumpActive =
    urlParams.get('bump') === 'true' ||
    productKey === 'base_with_vault' ||
    urlParams.get('vault') === 'true';

  const totalPaid = isBumpActive ? 537 : 390;

  useEffect(() => {
    // 1. Immediately trigger Pro activation and access grant
    initPaymentCheck(true);
    grantAccess(customerEmail || 'customer@dopamineos.app');

    // 2. Track successful purchase analytics event
    trackEvent('purchase_confirmed', {
      product: productKey,
      price: totalPaid,
      has_vault: isBumpActive,
      is_bump: urlParams.get('bump') === 'true',
    });
  }, [customerEmail, productKey, totalPaid, isBumpActive]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(PRIMARY_MASTER_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchApp = () => {
    if (onNavigateToApp) {
      onNavigateToApp();
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800/80 px-4 py-4 sticky top-0 z-30 backdrop-blur-md bg-slate-950/90">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo variant="full" size="sm" />
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Objednávka potvrzena</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col items-center text-center">
        {/* Animated Celebration Icon */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-300 text-slate-950 font-black flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-bounce-subtle">
            <CheckCircle2 className="w-11 h-11 stroke-[2.5]" />
          </div>
          <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
        </div>

        {/* Big Celebration Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight leading-snug">
            🎉 Nákup dokončen! Tvůj doživotní přístup je aktivní.
          </h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Vítej v Dopamine OS. Tvůj účet byl natrvalo povýšen na{' '}
            <strong className="text-amber-300 font-bold">PRO Doživotní</strong>.
          </p>
        </div>

        {/* Primary Action Button - Prominent Top CTA */}
        <button
          type="button"
          onClick={handleLaunchApp}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 mb-6 group cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-current stroke-none" />
          <span>🚀 Spustit aplikaci Dopamine OS →</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
        </button>

        {/* If bump=true or vault included: Prominent Download Card */}
        {isBumpActive && (
          <div className="w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-emerald-950/50 via-slate-900/90 to-slate-950 border-2 border-emerald-500/50 mb-6 shadow-2xl shadow-emerald-500/15 text-left relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bonus odemčen</span>
              </span>
              <span className="text-xs font-bold text-emerald-400">HODNOTA 149 Kč</span>
            </div>

            <h3 className="text-lg font-black text-slate-100 mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>ADHD AI Prompt Trezor</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              50 praktických hotových AI promptů navržených speciálně k prolomení paralýzy, nerozhodnosti u jídla a emočního přehlcení.
            </p>

            {/* Direct Download Button */}
            <a
              href="/prompt-vault.pdf"
              download="ADHD-Prompt-Vault.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>📥 Stáhnout ADHD Prompt Vault (PDF)</span>
            </a>
          </div>
        )}

        {/* Lifetime Access Key Box */}
        <div className="w-full bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-left mb-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Tvůj doživotní licenční klíč</span>
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-md border border-amber-500/30">
              TRVALÁ LICENCE
            </span>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 mb-3">
            <code className="text-sm sm:text-base font-mono font-black text-amber-300 tracking-wider">
              {PRIMARY_MASTER_KEY}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Zkopírováno!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopírovat klíč</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Tvůj prohlížeč je nyní trvale ověřen. Ulož si tento klíč pro případ, že promažeš mezipaměť nebo přejdeš na jiné zařízení.
          </p>
        </div>

        {/* Order Details & Receipt Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left mb-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Potvrzení objednávky
            </span>
            <span className="text-emerald-400 font-black text-sm">{totalPaid} Kč zaplaceno celkem</span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">
                ⚡ Dopamine OS doživotní licence
              </span>
              <span className="font-bold text-amber-400">390 Kč</span>
            </div>

            {isBumpActive && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ADHD AI Prompt Trezor (50 promptů)</span>
                </div>
                <span className="font-bold text-emerald-400">149 Kč</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-slate-400 border border-slate-800 flex items-center gap-2 mt-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% 30denní garance vrácení peněz v ceně.</span>
          </div>
        </div>

        {/* Secondary App Launch Button */}
        <button
          type="button"
          onClick={handleLaunchApp}
          className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <span>🚀 Spustit aplikaci Dopamine OS →</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        Dopamine OS · Doživotní Pro aktivní · Okamžitý přístup
      </footer>
    </div>
  );
};
