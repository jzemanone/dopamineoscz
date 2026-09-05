/**
 * Utility to detect in-app browsers (Instagram, TikTok, Facebook, Messenger, etc.)
 * and generic iOS/Android WebViews where localStorage, PWA installation, or standard
 * browser features may be restricted.
 */

export function isInAppBrowser(customUserAgent?: string): boolean {
  if (typeof window === 'undefined' && !customUserAgent) {
    return false;
  }

  const ua = (customUserAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '').toLowerCase();
  if (!ua) return false;

  // 1. Specific social media in-app browsers
  const isInstagram = ua.includes('instagram');
  const isFacebook = ua.includes('fbav') || ua.includes('fban') || ua.includes('fb_iab') || ua.includes('fb4a') || ua.includes('fbios');
  const isTikTok = ua.includes('musical_ly') || ua.includes('bytelocale') || ua.includes('bytefulllocale') || ua.includes('tiktok');
  const isTwitter = ua.includes('twitter');
  const isLinkedIn = ua.includes('linkedinapp');
  const isSnapchat = ua.includes('snapchat');
  const isPinterest = ua.includes('pinterest');
  const isWeChat = ua.includes('micromessenger');
  const isLine = ua.includes('line/');

  if (
    isInstagram ||
    isFacebook ||
    isTikTok ||
    isTwitter ||
    isLinkedIn ||
    isSnapchat ||
    isPinterest ||
    isWeChat ||
    isLine
  ) {
    return true;
  }

  // 2. Android WebView detection
  // Modern Android WebViews append '; wv)' to the User-Agent
  const isAndroidWebView = ua.includes('; wv') || (ua.includes('android') && ua.includes('version/') && ua.includes('chrome/'));
  if (isAndroidWebView) {
    return true;
  }

  // 3. iOS UIWebView / WKWebView detection
  // In iOS Safari, the UA contains "Safari". WebViews based on UIWebView / WKWebView
  // often contain "AppleWebKit" and "Mobile" but lack the word "Safari", or have specific WebView markers.
  const isIOS = /iphone|ipod|ipad/.test(ua);
  if (isIOS) {
    const hasSafari = ua.includes('safari');
    const isWebKit = ua.includes('applewebkit');
    const isCriOS = ua.includes('crios'); // Chrome on iOS is a valid user browser, not in-app
    const isFxiOS = ua.includes('fxios'); // Firefox on iOS
    const isEdgiOS = ua.includes('edgios'); // Edge on iOS

    // If on iOS WebKit without standard browsers and without "Safari", it is an in-app WebView
    if (isWebKit && !hasSafari && !isCriOS && !isFxiOS && !isEdgiOS) {
      return true;
    }
  }

  return false;
}
