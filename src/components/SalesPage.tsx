import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Sparkles,
  ArrowRight,
  Zap,
  BatteryCharging,
  Flame,
  Key,
  AlertCircle,
} from 'lucide-react';
import { MemberAccessModal } from './MemberAccessModal';
import { Logo } from './Logo';
import { trackLandingPageView } from '../lib/analytics';
import { grantAccess } from '../utils/storage';

interface SalesPageProps {
  onNavigateToApp: () => void;
  onNavigateToLogin: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({ onNavigateToApp, onNavigateToLogin }) => {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [isMemberAccessOpen, setIsMemberAccessOpen] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Router abstraction as requested
  const router = {
    push: (path: string) => {
      grantAccess(email.trim());
      if (onNavigateToApp) {
        onNavigateToApp();
      } else {
        setLocation(path);
      }
    },
  };

  React.useEffect(() => {
    // Track Landing Page View with organic traffic / UTM attribution
    trackLandingPageView();

    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_error') === 'true') {
      setAuthError(true);
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push('/app');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <Logo variant="full" size="sm" subtitle="Focus Engine" />

          {/* Member Login / Key Access */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMemberAccessOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-amber-400 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Vstup pro členy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Auth Error Banner if redirected */}
      {authError && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Máš už aktivovanou licenci?</span>
          <button
            onClick={() => setIsMemberAccessOpen(true)}
            className="font-bold underline underline-offset-2 hover:text-white"
          >
            Zadej svůj licenční klíč zde →
          </button>
        </div>
      )}

      {/* 2. Main Hero Section (Freemium Opt-in) */}
      <main className="flex-1 flex flex-col justify-center pt-8 pb-16 px-4 max-w-4xl mx-auto text-center relative overflow-hidden w-full">
        {/* Ambient Glow background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pro lidi s ADHD a chronickou prokrastinací</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.15] max-w-3xl mx-auto mb-6">
          Úkoly se kupí.{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            A ty zase jen hodiny koukáš do zdi.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          Dopamine OS není další složitý systém na udržování. Zadej úkol, nech ho rozsekat na mikro-kroky a dostaň dopamin za každý splněný kousek. Začni hned.
        </p>

        {/* Email Opt-in Form */}
        <div className="w-full max-w-md mx-auto mb-6">
          <form
            onSubmit={handleFormSubmit}
            className="flex flex-col sm:flex-row gap-2.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-full shadow-2xl backdrop-blur-sm"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tvůj nejlepší e-mail..."
              className="flex-1 px-4 py-3.5 rounded-xl sm:rounded-full bg-slate-950 border border-slate-800/80 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wide rounded-xl sm:rounded-full shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Získat přístup ZDARMA</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Proof / Feature checkmarks */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-300 max-w-2xl mx-auto mb-10">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <span>Žádná instalace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <span>Vytvořeno vývojářem s ADHD</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <span>Základní verze (3 úkoly/den) navždy ZDARMA</span>
          </div>
        </div>

        {/* Minimalist Visual App Preview */}
        <div className="max-w-sm mx-auto relative opacity-95">
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl">
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 text-left">
              {/* App notch & small header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                    DOS
                  </div>
                  <span className="text-xs font-bold text-slate-200">Dopamine OS</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  ⚡ 2min mikro-krok
                </span>
              </div>

              {/* Mini capacity */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-center">
                  <Zap className="w-3 h-3 fill-emerald-400 stroke-none mx-auto" />
                  <span className="text-[9px] font-bold text-emerald-300 block">Nízká energie</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center opacity-50">
                  <BatteryCharging className="w-3 h-3 text-amber-400 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-400 block">Střední</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center opacity-50">
                  <Flame className="w-3 h-3 text-rose-400 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-400 block">Plný fokus</span>
                </div>
              </div>

              {/* Task card */}
              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Aktivní úkol
                </span>
                <p className="text-xs font-bold text-slate-100 mb-2">
                  Odpovědět na 1 důležitou zprávu a napít se vody
                </p>
                <div className="py-1.5 bg-emerald-400 text-slate-950 font-extrabold text-[11px] rounded-lg">
                  ✓ Hotovo (+30 XP)
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Member Access Unlock Modal */}
      <MemberAccessModal
        isOpen={isMemberAccessOpen}
        onClose={() => setIsMemberAccessOpen(false)}
        onSuccess={() => {
          setIsMemberAccessOpen(false);
          router.push('/app');
        }}
      />
    </div>
  );
};
