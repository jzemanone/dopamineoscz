import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { isInAppBrowser } from '../utils/inAppBrowser';

interface InAppBrowserWarningProps {
  /** Optional custom message override */
  message?: string;
  /** Optional callback when banner is dismissed */
  onDismiss?: () => void;
}

export const InAppBrowserWarning: React.FC<InAppBrowserWarningProps> = ({
  message = "⚠️ Pro správné fungování a možnost uložit apku na plochu klikni na menu (tři tečky) a zvol 'Otevřít v prohlížeči'.",
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only display if the user is visiting through an in-app browser
    // and hasn't dismissed it in the current session
    const isDismissed = sessionStorage.getItem('dismissed_inapp_warning') === 'true';
    if (!isDismissed && isInAppBrowser()) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('dismissed_inapp_warning', 'true');
    } catch {
      // Ignore storage errors in restricted WebView environments
    }
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      id="in-app-browser-warning"
      role="alert"
      className="sticky top-0 z-50 w-full bg-gray-900/95 text-white border-b border-amber-500/30 backdrop-blur-sm px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-center sm:text-left">
        <p className="flex-1 text-xs sm:text-sm font-medium leading-snug text-slate-200">
          {message}
        </p>

        <button
          type="button"
          id="btn-close-inapp-warning"
          onClick={handleClose}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          aria-label="Zavřít upozornění"
          title="Zavřít"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
