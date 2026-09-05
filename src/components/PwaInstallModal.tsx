import React, { useState } from 'react';
import { Smartphone, Download, X, CheckCircle2, Share, PlusSquare, Info } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA Install choice:', outcome);
      } catch (err) {
        console.error('Error triggering PWA install:', err);
      }
      localStorage.setItem('dopamine_pwa_dismissed', 'true');
      onClose();
    } else {
      // Show manual iOS / Android guide
      setShowInstructions(true);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('dopamine_pwa_dismissed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
          <Smartphone className="w-7 h-7" />
        </div>

        {/* Header */}
        <h3 className="text-lg font-black text-slate-100 mb-2">
          Přidat Dopamine OS na plochu?
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          Získej okamžitý přístup jedním klepnutím, rychlý offline časovač soustředění a čistou obrazovku bez lišt prohlížeče.
        </p>

        {!showInstructions ? (
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Ano, přidat na plochu</span>
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-2.5 px-4 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 font-semibold text-xs rounded-xl transition-all"
            >
              Zatím přeskočit
            </button>
          </div>
        ) : (
          <div className="text-left bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
              <Info className="w-4 h-4" />
              <span>Návod na ruční přidání</span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 block mb-0.5">📱 iOS (Safari):</span>
                Klepni na tlačítko <Share className="w-3 h-3 inline text-indigo-400 mx-0.5" /> Sdílet v Safari a zvol <PlusSquare className="w-3 h-3 inline text-amber-400 mx-0.5" /> <strong>"Přidat na plochu"</strong>.
              </div>

              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 block mb-0.5">🤖 Android / Chrome:</span>
                Klepni na nabídku prohlížeče <strong>(⋮)</strong> vpravo nahoře a zvol <strong>"Instalovat aplikaci"</strong> nebo <strong>"Přidat na plochu"</strong>.
              </div>
            </div>

            <button
              onClick={handleSkip}
              className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl text-center transition-all"
            >
              Rozumím, zavřít
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-500 mt-4">
          Aplikaci můžeš kdykoliv nainstalovat i později v Nastavení.
        </p>
      </div>
    </div>
  );
};
