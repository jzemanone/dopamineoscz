import React, { useState } from 'react';
import { X, Award, Flame, Zap, Trophy, Sparkles, CheckCircle2, Clock, Smartphone, RotateCcw, Settings, AlertTriangle, Volume2, VolumeX, Vibrate, Key, ShieldCheck, FileText } from 'lucide-react';
import { UserStats, AppSettings, BADGES_LIST, getLevelTitle } from '../types';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  settings?: AppSettings;
  onToggleSound?: () => void;
  onToggleHaptics?: () => void;
  onPlayClick: () => void;
  onTriggerPwaInstall?: () => void;
  onResetAllData?: () => void;
  isPro?: boolean;
  licenseKey?: string;
  onOpenPaywall?: () => void;
  onOpenRestoreLicense?: () => void;
  onOpenPdfVault?: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  stats,
  settings,
  onToggleSound,
  onToggleHaptics,
  onPlayClick,
  onTriggerPwaInstall,
  onResetAllData,
  isPro = false,
  licenseKey,
  onOpenPaywall,
  onOpenRestoreLicense,
  onOpenPdfVault,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const xpForCurrentLevel = (stats.level - 1) * 100;
  const xpNextLevel = stats.level * 100;
  const xpToNext = Math.max(0, xpNextLevel - stats.xp);
  const levelProgress = Math.min(
    100,
    Math.max(0, ((stats.xp - xpForCurrentLevel) / (xpNextLevel - xpForCurrentLevel)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Statistiky soustředění & trofeje</h3>
              <p className="text-[11px] text-slate-400">Sleduj své momentum a úroveň</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Level Progress Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950/60 border border-indigo-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 font-black text-sm flex items-center justify-center border border-indigo-500/40">
                  L{stats.level}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Úroveň {stats.level}:</span>
                    <span className="text-amber-400">{getLevelTitle(stats.level)}</span>
                  </h4>
                  <p className="text-[11px] text-indigo-300">{stats.xp} XP získáno celkem</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400">{xpToNext} XP do úrovně {stats.level + 1}</span>
            </div>

            {/* Level Bar */}
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-indigo-500/20">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>

          {/* Key Metric Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1 fill-amber-400/20" />
              <span className="text-lg font-black text-slate-100 block">{stats.streak}d</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                {stats.streakStatus === 'frozen' ? 'Zmrazeno 🛡️' : stats.streakStatus === 'paused' ? 'Pozastaveno ⏸️' : 'Streak'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-lg font-black text-slate-100 block">{stats.totalTasksCompleted}</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Dokončeno</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <Clock className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <span className="text-lg font-black text-slate-100 block">{stats.totalFocusMinutes}m</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Čas soustředění</span>
            </div>
          </div>

          {/* Achievements Badges */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Odznaky & trofeje
            </h4>

            <div className="space-y-2">
              {BADGES_LIST.map((badge) => {
                const isUnlocked = stats.unlockedBadges.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-slate-950 border-amber-500/30 text-slate-100'
                        : 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isUnlocked
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-900 text-slate-600 border border-slate-800'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{badge.name}</span>
                        {isUnlocked && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            ODEMČENO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* App Settings & PWA Installation Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-indigo-400" />
              PWA & nastavení aplikace
            </h4>

            {/* Pro Lifetime License Status / Upgrade */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      {isPro ? 'Doživotní Pro aktivní' : 'Zkušební verze (3 úkoly/den)'}
                      {isPro && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {isPro ? (licenseKey ? `Klíč: ${licenseKey.slice(0, 8)}...` : 'Neomezené AI rozpadání úkolů') : '3 mikro-úkoly denně'}
                    </p>
                  </div>
                </div>

                {isPro ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    NEOMEZENĚ
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onPlayClick();
                      onClose();
                      if (onOpenPaywall) onOpenPaywall();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    Odemknout za 390 Kč
                  </button>
                )}
              </div>

              {!isPro && onOpenRestoreLicense && (
                <button
                  onClick={() => {
                    onPlayClick();
                    onClose();
                    onOpenRestoreLicense();
                  }}
                  className="w-full py-1.5 text-center text-[11px] text-slate-400 hover:text-amber-300 font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Key className="w-3 h-3" />
                  <span>Obnovit doživotní licenční klíč</span>
                </button>
              )}

              {onOpenPdfVault && (
                <button
                  onClick={() => {
                    onPlayClick();
                    onClose();
                    onOpenPdfVault();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-[11px] font-bold flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>50 krizových promptů (PDF Vault)</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    STÁHNOUT
                  </span>
                </button>
              )}
            </div>

            {/* Sound & Haptic Preferences */}
            {settings && onToggleSound && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onPlayClick();
                    onToggleSound();
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    settings.soundEnabled
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
                  <span>{settings.soundEnabled ? 'Zvuky zapnuty' : 'Zvuky vypnuty'}</span>
                </button>

                {onToggleHaptics && (
                  <button
                    onClick={() => {
                      onPlayClick();
                      onToggleHaptics();
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      settings.hapticEnabled
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Vibrate className="w-4 h-4 text-indigo-400" />
                    <span>{settings.hapticEnabled ? 'Vibrace zapnuty' : 'Vibrace vypnuty'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Permanent PWA Install Button */}
            {onTriggerPwaInstall && (
              <button
                onClick={() => {
                  onPlayClick();
                  onTriggerPwaInstall();
                }}
                className="w-full py-3 px-4 bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-between transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Přidat na plochu / Instalovat PWA</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full">
                  PWA
                </span>
              </button>
            )}

            {/* Reset All App Data & Streaks Button */}
            {onResetAllData && (
              <div className="pt-2">
                {!showResetConfirm ? (
                  <button
                    onClick={() => {
                      onPlayClick();
                      setShowResetConfirm(true);
                    }}
                    className="w-full py-2.5 px-3 bg-slate-950 border border-rose-500/20 hover:border-rose-500/50 rounded-xl text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:bg-rose-500/5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resetovat všechna data aplikace & Streak</span>
                  </button>
                ) : (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Fakt to chceš udělat? Vymaže se veškeré XP i úkoly.</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onPlayClick();
                          setShowResetConfirm(false);
                          onResetAllData();
                        }}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Ano, smazat všechno
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-all"
                      >
                        Zrušit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
