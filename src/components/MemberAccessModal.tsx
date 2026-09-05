import React, { useState } from 'react';
import { X, Key, Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { unlockAccessWithKey, PRIMARY_MASTER_KEY } from '../utils/storage';

interface MemberAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MemberAccessModal: React.FC<MemberAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = accessKey.trim();
    if (!clean) {
      setError('Zadej svůj doživotní licenční klíč.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const isUnlocked = unlockAccessWithKey(clean);

      if (!isUnlocked) {
        setLoading(false);
        setError('Neplatný klíč. Zkontroluj potvrzení o nákupu.');
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        onSuccess();
      }, 400);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading || success}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all text-lg"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
          <Key className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug mb-1">
          Odemknout doživotní přístup
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Zadej svůj doživotní klíč pro obnovení plného přístupu na tomto zařízení.
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">Přístup odemčen! Spouštím Dopamine OS...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Zadej licenční klíč
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                autoFocus
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="např. DOS-PRO-8492-X9K2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono tracking-wider transition-colors uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Klíč najdeš na stránce s potvrzením objednávky nebo v e-mailu ze Stripe.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/15 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Ověřuji klíč...' : success ? 'Přístup udělen' : 'Odemknout aplikaci'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Helper / Guarantee Footer */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Okamžitá doživotní synchronizace mezi zařízeními</span>
        </div>
      </div>
    </div>
  );
};
