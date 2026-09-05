import React, { useState } from 'react';
import {
  Zap,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BatteryCharging,
  Flame,
  Clock,
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle2,
  Brain,
  Coffee,
  RotateCcw,
  Utensils,
  Award,
  Layers,
  Smartphone,
  SmartphoneNfc,
  Lock,
  Key,
  AlertCircle,
} from 'lucide-react';
import { OrderBumpModal } from './OrderBumpModal';
import { MemberAccessModal } from './MemberAccessModal';
import { Logo } from './Logo';
import { trackLandingPageView, trackCtaClickBuy } from '../lib/analytics';

interface SalesPageProps {
  onNavigateToApp: () => void;
  onNavigateToLogin: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({ onNavigateToApp, onNavigateToLogin }) => {
  const [isOrderBumpOpen, setIsOrderBumpOpen] = useState(false);
  const [isMemberAccessOpen, setIsMemberAccessOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [authError, setAuthError] = useState(false);

  React.useEffect(() => {
    // 1. Track Landing Page View with organic traffic / UTM attribution
    trackLandingPageView();

    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_error') === 'true') {
      setAuthError(true);
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  const openOrderBump = (location: string = 'general') => {
    trackCtaClickBuy(location, 27);
    setIsOrderBumpOpen(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqList = [
    {
      q: 'Is there a download needed?',
      a: 'No, Dopamine OS is a micro-PWA that opens instantly in any browser on your phone, tablet, or laptop. You can add it to your home screen with one tap.',
    },
    {
      q: 'Is this a subscription?',
      a: 'No. You pay $27 once and get lifetime access. No recurring charges, ever.',
    },
    {
      q: 'What happens after I purchase?',
      a: 'You immediately get instant access to your Dopamine OS web app, account login credentials, and lifetime updates.',
    },
    {
      q: 'What if I have very low energy today?',
      a: "That's exactly why Dopamine OS was built. The capacity selector finds 2-minute micro steps so you can gain momentum without guilt.",
    },
    {
      q: 'Can I use this on my phone and computer?',
      a: 'Yes! It syncs seamlessly across all your devices via your browser or installed PWA.',
    },
    {
      q: 'What is the refund policy?',
      a: "We offer a 30-day money-back guarantee. If Dopamine OS doesn't help you start tasks faster, send us an email for a full 100% refund—no questions asked.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <Logo variant="full" size="sm" subtitle="Focus Engine" />

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMemberAccessOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-amber-400 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Member Access</span>
            </button>

            <button
              onClick={() => openOrderBump('header_nav')}
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/15 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Get Lifetime Access — $27</span>
            </button>
          </div>
        </div>
      </header>

      {/* Auth Error Banner if redirected from /app */}
      {authError && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Lifetime license required for /app. Have a key?</span>
          <button
            onClick={() => setIsMemberAccessOpen(true)}
            className="font-bold underline underline-offset-2 hover:text-white"
          >
            Enter your key here →
          </button>
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="pt-12 pb-16 px-4 max-w-5xl mx-auto text-center relative overflow-hidden">
        {/* Ambient Glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>For people who have tried every productivity app</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6">
          Your to-do list is full.{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            You still cannot pick a starting point.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          Dopamine OS gives you one small next task based on the energy you have today. No setup marathon. No new routine to maintain. Just a clear next step you can actually start.
        </p>

        {/* Stacked Proof Points */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-200 mb-8 max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</span>
            <span>Open it in your browser — nothing to download</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</span>
            <span>Works on phone, laptop, or tablet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</span>
            <span>$27 once. Lifetime access. No subscription.</span>
          </div>
        </div>

        {/* Hero CTA Button */}
        <div className="mb-4">
          <button
            onClick={() => openOrderBump('hero_cta')}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Get Dopamine OS — $27</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Trust Line */}
        <p className="text-[11px] sm:text-xs text-slate-400 flex items-center justify-center flex-wrap gap-2 max-w-lg mx-auto">
          <span>$27 once</span>
          <span>·</span>
          <span>Lifetime access</span>
          <span>·</span>
          <span>No subscription</span>
          <span>·</span>
          <span>30-day money-back guarantee</span>
          <span>·</span>
          <span>Apple Pay · PayPal · Card</span>
        </p>

        {/* Visual Mockup Section */}
        <div className="mt-12 max-w-md mx-auto relative">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-[38px] shadow-2xl relative">
            <div className="bg-slate-950 rounded-[30px] p-5 border border-slate-800 text-left">
              {/* Phone Notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-4 border border-slate-800/80" />

              {/* Mockup Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    DOS
                  </div>
                  <span className="text-xs font-bold text-slate-200">Dopamine OS Engine</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  ⚡ 2-Min Mode
                </span>
              </div>

              {/* Mockup Energy selector */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center">
                  <Zap className="w-3.5 h-3.5 fill-emerald-400 stroke-none mx-auto mb-0.5" />
                  <span className="text-[10px] font-bold text-emerald-300 block">Low Energy</span>
                  <span className="text-[9px] text-slate-400">2-min win</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center opacity-60">
                  <BatteryCharging className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-300 block">Medium</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center opacity-60">
                  <Flame className="w-3.5 h-3.5 text-rose-400 mx-auto mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-300 block">High</span>
                </div>
              </div>

              {/* Active Task Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border-2 border-amber-500/40 shadow-lg text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Active Focus Task
                </span>
                <p className="text-sm font-bold text-slate-100 mb-2">
                  Reply to 1 priority message & drink water
                </p>
                <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex flex-col items-center justify-center mx-auto my-2 bg-slate-950">
                  <span className="text-lg font-black text-slate-100 font-mono">01:54</span>
                  <span className="text-[9px] text-amber-400 font-bold">FOCUS</span>
                </div>
                <div className="mt-3 py-2 bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl">
                  ✓ Complete Task (+30 XP)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: The Real Friction */}
      <section className="py-16 px-4 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 mb-6 tracking-tight">
            Planning is not the problem. Starting is.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto mb-12">
            A huge list does not make the day clearer. It gives every task the same urgency, makes the first step harder to choose, and turns a five-minute job into a full-day avoidance loop. Dopamine OS does not ask you to organize your whole life. It asks one useful question: what can you realistically start with the energy you have right now?
          </p>

          {/* Visual Comparison Grid */}
          <div className="grid sm:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
            {/* Left: Traditional Apps */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-rose-500/30 relative">
              <div className="flex items-center gap-2 mb-4 text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Crowded Generic Task List</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                50 items shouting at you at once. High cognitive load, red deadlines, decision paralysis.
              </p>
              <div className="space-y-2 opacity-60">
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex justify-between">
                  <span>🚨 Urgent: Q3 Tax Filings</span>
                  <span className="text-[10px] font-bold">OVERDUE</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  📁 Reorganize entire Notion workspace
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  ✉️ 142 Unread inbox messages
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  📊 Create quarterly projection deck
                </div>
              </div>
            </div>

            {/* Right: Dopamine OS */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 relative shadow-xl shadow-emerald-500/5">
              <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Dopamine OS Experience</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                1 single task matching your current energy. Zero noise, clear timer, instant momentum.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                  ⚡ Low Energy Mode
                </span>
                <p className="text-sm font-bold text-slate-100 mb-2">
                  Clear desktop downloads folder (2 min win)
                </p>
                <div className="py-1 px-3 bg-amber-500/10 text-amber-300 font-mono text-xs rounded-lg inline-block border border-amber-500/20">
                  ⏱️ 02:00 Focus Timer
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: How It Works (3 Steps) */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            How Dopamine OS Works
          </h2>
          <p className="text-sm text-slate-400 mt-2">Three frictionless steps to end task paralysis</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left relative">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center mb-4 border border-amber-500/30">
              1
            </span>
            <h3 className="text-base font-bold text-slate-100 mb-2">Check in</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pick the kind of day you are having. No score. No guilt.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left relative">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-sm flex items-center justify-center mb-4 border border-indigo-500/30">
              2
            </span>
            <h3 className="text-base font-bold text-slate-100 mb-2">Quick Capture</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Put the clutter somewhere outside your head. Do not organize it first.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left relative">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-4 border border-emerald-500/30">
              3
            </span>
            <h3 className="text-base font-bold text-slate-100 mb-2">Start small</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Get one task that fits the moment. Start there.
            </p>
          </div>
        </div>

        {/* Micro-CTA */}
        <div className="text-center">
          <button
            onClick={() => openOrderBump('how_it_works_cta')}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <span>Give me one next step — $27</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </section>

      {/* 5. Section: What Is Inside (Features Grid) */}
      <section className="py-16 px-4 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Built for the moments normal task apps make worse.
            </h2>
            <p className="text-sm text-slate-400 mt-2">Every tool designed specifically for executive momentum</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <BatteryCharging className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">Energy Check-in</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Match tasks to Low, Medium, or High capacity so you never force high-focus work on low-energy days.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <Brain className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">Quick Capture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dump clutter out of your mind instantly without worrying about tags, dates, or complex folder structures.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <Zap className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">One-Task Focus</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Displays exactly one actionable task on screen at a time to completely eliminate decision paralysis.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <Clock className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">Focus Timer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Built-in 2-minute to 15-minute timers with audio feedback and micro-steps to get moving quickly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <RotateCcw className="w-6 h-6 text-rose-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">Reset Menu</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emergency options when you feel completely stuck, overwhelmed, or frozen in place.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <Coffee className="w-6 h-6 text-teal-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">Quick Reset</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                60-second breathing exercises and physiological state resets to calm mental friction.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <Utensils className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">Zero-Decision Meals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Low-effort meal ideas for executive dysfunction days when even deciding what to eat feels hard.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <Award className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-100 mb-1">Reminders and XP</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gamified streak rewards, unlockable badges, and XP for every small win to fuel positive momentum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section: Product Fit */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-8">
          {/* This is for you if... */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30">
            <h3 className="text-lg font-extrabold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>This is for you if…</span>
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>You feel overwhelmed by traditional 50-item task managers & complex Notion templates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>You experience executive dysfunction, ADHD paralysis, or low energy days.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>You want a friction-free tool that works instantly in your phone/browser with no setup.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>You want a one-time purchase with lifetime access and zero monthly subscription fees.</span>
              </li>
            </ul>
          </div>

          {/* This is NOT for you if... */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-rose-500/30">
            <h3 className="text-lg font-extrabold text-rose-400 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>This is not for you if…</span>
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">•</span>
                <span>You want complex multi-nested project gantt charts or team enterprise dependencies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">•</span>
                <span>You enjoy spending 3 hours tweaking productivity setups instead of doing tasks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">•</span>
                <span>You prefer paying $12/month forever for basic task lists.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. Section: Pricing & FAQ */}
      <section className="py-16 px-4 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto">
          {/* Pricing Box */}
          <div className="p-8 rounded-3xl bg-slate-950 border-2 border-amber-500/40 text-center max-w-xl mx-auto mb-16 shadow-2xl relative overflow-hidden">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider mb-4 border border-amber-500/20">
              ONE-TIME PAYMENT · NO SUBSCRIPTION
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 mb-3 tracking-tight">
              One payment. One place to start.
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Dopamine OS is $27 once. You keep access. There is no recurring bill and no new tool to download.
            </p>

            <div className="text-4xl sm:text-5xl font-black text-amber-400 mb-6 font-mono">
              $27 <span className="text-sm font-sans font-semibold text-slate-400">USD (one-time)</span>
            </div>

            <button
              onClick={() => openOrderBump('pricing_card_cta')}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 mb-4"
            >
              <span>Get Dopamine OS — $27</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <p className="text-[11px] text-slate-400 flex items-center justify-center flex-wrap gap-2">
              <span>$27 once</span>
              <span>·</span>
              <span>Lifetime access</span>
              <span>·</span>
              <span>No subscription</span>
              <span>·</span>
              <span>30-day money-back guarantee</span>
            </p>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 text-center mb-8">
              Frequently Asked Questions
            </h3>

            <div className="space-y-3">
              {faqList.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between text-left gap-4 text-sm font-bold text-slate-200 hover:text-amber-400 transition-colors"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <p className="text-xs text-slate-400 mt-3 leading-relaxed pt-2 border-t border-slate-800/80 animate-fadeIn">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto relative">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 relative shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-100 mb-4 tracking-tight">
            Stop rebuilding your whole system. Start one task.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Break free from task paralysis today with energy-matched micro wins and zero subscription risk.
          </p>

          <button
            onClick={() => openOrderBump('final_banner_cta')}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all inline-flex items-center gap-2"
          >
            <span>Get Dopamine OS — $27</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="full" size="sm" />
            <span className="text-slate-500">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMemberAccessOpen(true)}
              className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 font-semibold"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Member Access</span>
            </button>
            <button onClick={() => openOrderBump('footer_cta')} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              Get Lifetime Access ($27)
            </button>
          </div>
        </div>
      </footer>

      {/* Member Access Unlock Modal */}
      <MemberAccessModal
        isOpen={isMemberAccessOpen}
        onClose={() => setIsMemberAccessOpen(false)}
        onSuccess={() => {
          setIsMemberAccessOpen(false);
          onNavigateToApp();
        }}
      />

      {/* Order Bump Checkout Modal */}
      <OrderBumpModal isOpen={isOrderBumpOpen} onClose={() => setIsOrderBumpOpen(false)} />
    </div>
  );
};
