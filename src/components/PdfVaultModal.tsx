import React from 'react';
import { Download, Sparkles, FileText, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface PdfVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadClick?: () => void;
  // Optional custom download link, defaults to local pdf asset or Google Drive placeholder
  downloadUrl?: string;
}

export const PdfVaultModal: React.FC<PdfVaultModalProps> = ({
  isOpen,
  onClose,
  onDownloadClick,
  downloadUrl = '/prompt-vault.pdf',
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (onDownloadClick) onDownloadClick();

    // Trigger download / open link
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'ADHD-AI-Prompt-Vault.pdf');
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleCloseAndWork = () => {
    // Save state flag that vault has been viewed/unlocked
    try {
      localStorage.setItem('dopamine_os_vault_unlocked', 'true');
      localStorage.setItem('dopamine_os_premium', 'true');
    } catch {
      // Storage safe
    }
    onClose();
  };

  return (
    <div
      id="pdf-vault-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-vault-title"
    >
      <div
        className="w-full max-w-xl bg-gradient-to-b from-[#131B2A] via-[#0E1522] to-[#080C14] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 text-slate-100 relative my-auto overflow-hidden ring-1 ring-emerald-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Celebration Badge & Icon */}
        <div className="flex flex-col items-center text-center space-y-3 mb-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 text-slate-950 font-black flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-bounce-subtle">
              <Sparkles className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2]" />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-emerald-500/40 text-[10px] font-black text-emerald-400 uppercase tracking-wider shadow-md">
              Order Bump
            </span>
          </div>

          <div className="space-y-1.5">
            <h2
              id="pdf-vault-title"
              className="text-xl sm:text-2xl md:text-3xl font-black text-slate-100 tracking-tight"
            >
              ✨ Odemčeno + TVŮJ AI VAULT
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Díky za nákup! Tady je přímý odkaz na stažení tvých 50 krizových promptů.
            </p>
          </div>
        </div>

        {/* Vault Overview Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 mb-6">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-850">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>ADHD AI Prompt Trezor (50 promptů)</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              PDF Dokument
            </span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Okamžité prolomení paralýzy:</strong> 15 záchranných promptů pro dny, kdy se mozek zasekne.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Zero-decision jídelníčky & nákupy:</strong> Prompty pro rychlé nasycení mozku bez rozhodovací únavy.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Záchrana přehlceného e-mailu & úkolů:</strong> Prompty, které za tebe zformulují těžké odpovědi.</span>
            </li>
          </ul>

          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Kdykoliv dostupné i později ze sekce Statistiky & Nastavení.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Main Download CTA Button */}
          <button
            id="download-pdf-vault-btn"
            type="button"
            onClick={handleDownload}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>STÁHNOUT PDF PROMPTY</span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>

          {/* Close and start working button */}
          <button
            id="close-vault-modal-btn"
            type="button"
            onClick={handleCloseAndWork}
            className="w-full py-3.5 px-5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Zavřít a začít makat</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
