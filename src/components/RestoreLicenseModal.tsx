import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { activateProWithKey } from '../lib/freemium';
import { soundManager } from '../utils/audio';

interface RestoreLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUnlock?: () => void;
  onPlayClick?: () => void;
}

export const RestoreLicenseModal: React.FC<RestoreLicenseModalProps> = ({
  isOpen,
  onClose,
  onSuccessUnlock,
  onPlayClick,
}) => {
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (onPlayClick) onPlayClick();

    const result = activateProWithKey(licenseKeyInput);
    if (result.success) {
      setIsSuccess(true);
      setErrorMsg(null);
      soundManager.playSuccess(true);
      soundManager.triggerHaptic(true);

      setTimeout(() => {
        setIsSuccess(false);
        setLicenseKeyInput('');
        if (onSuccessUnlock) onSuccessUnlock();
        onClose();
      }, 1400);
    } else {
      soundManager.triggerHaptic(true);
      setErrorMsg(result.error || 'Neplatný licenční klíč. Zkontroluj ho a zkus to znovu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (onPlayClick) onPlayClick();
            setErrorMsg(null);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100">Obnovit doživotní licenci</h3>
            <p className="text-xs text-slate-400">Synchronizuj svůj nákup mezi prohlížeči a zařízeními</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-200">Doživotní licence aktivována!</p>
              <p className="text-xs text-emerald-400/90 font-medium">
                Neomezené rozpadání úkolů s AI a všechny funkce odemčeny (+100 XP).
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Licenční klíč / Kód objednávky
              </label>
              <input
                type="text"
                value={licenseKeyInput}
                onChange={(e) => {
                  setLicenseKeyInput(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="např. DOP-84X921 nebo STRIPE-KEY"
                className="w-full uppercase font-mono tracking-widest px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none transition-colors"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Svůj klíč najdeš v potvrzení ze Stripe nebo v e-mailu s objednávkou.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-2xl transition-all"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={!licenseKeyInput.trim()}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-current stroke-none" />
                <span>Odemknout Pro</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
