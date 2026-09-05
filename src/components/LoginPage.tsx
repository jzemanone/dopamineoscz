import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { grantAccess, verifyLicenseCredentials } from '../utils/storage';
import { Logo } from './Logo';

interface LoginPageProps {
  onNavigateToApp: () => void;
  onNavigateToSalesPage: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToApp, onNavigateToSalesPage }) => {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanCode = accessCode.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Zadej prosím platnou e-mailovou adresu.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const isValid = verifyLicenseCredentials(cleanEmail, cleanCode);

      if (!isValid) {
        setLoading(false);
        setError('Pro tento účet nebyla nalezena aktivní celoživotní licence. Pro přístup prosím dokonči objednávku.');
        return;
      }

      // Valid license/passcode
      grantAccess(cleanEmail);
      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        onNavigateToApp();
      }, 500);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <header className="px-4 py-4 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateToSalesPage}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <Logo variant="full" size="sm" subtitle="Ověření celoživotní licence" />
          </button>

          <button
            onClick={onNavigateToSalesPage}
            className="text-xs font-semibold text-slate-300 hover:text-slate-100"
          >
            ← Zpět na nabídku
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 max-w-sm mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-100 mb-1 tracking-tight">
            Ověření licence
          </h1>
          <p className="text-xs text-slate-400 mb-6">
            Zadej svůj nákupní e-mail nebo přístupový kód a odemkni svou celoživotní PWA.
          </p>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Licence ověřena! Otevírám tvůj prostor...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nákupní e-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tvuj@email.cz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kód licence / Přístupový kód
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Klíč licence nebo přístupový kód"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Ověřuji licenci...' : success ? 'Přístup povolen' : 'Odemknout aplikaci'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-2">Nemáš ještě celoživotní licenci?</p>
            <button
              onClick={onNavigateToSalesPage}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4"
            >
              Získat celoživotní přístup za 390 Kč →
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500">
        Dopamine OS · Celoživotní edice
      </footer>
    </div>
  );
};
