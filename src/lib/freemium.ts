/**
 * Dopamine OS Freemium & Lifetime Access Engine
 * Zero-friction anonymous guest persistence, daily task limits (3/3),
 * Stripe payment redirect listener, and cross-browser license restoration.
 */

export interface FreemiumState {
  completedTasksCount: number;
  lastActiveDate: string; // YYYY-MM-DD
  isPro: boolean;
  licenseKey?: string;
  activatedAt?: number;
}

const STORAGE_KEY = 'dopamine_access_v1';
export const DAILY_FREE_TASK_LIMIT = 3;
export const STRIPE_STANDARD_URL = 'https://buy.stripe.com/28E14n5FHfuedtr3JB0co01';
export const STRIPE_ULTIMATE_URL = 'https://buy.stripe.com/8x23cv6JLfuegFDeof0co02';
export const STRIPE_CHECKOUT_URL = STRIPE_STANDARD_URL;

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Reads the current freemium state from local storage.
 * Automatically resets the completedTasksCount if a new calendar day has started for free users.
 */
export const getFreemiumState = (): FreemiumState => {
  const today = getTodayDateString();
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const initialState: FreemiumState = {
      completedTasksCount: 0,
      lastActiveDate: today,
      isPro: false,
    };
    saveFreemiumState(initialState);
    return initialState;
  }

  try {
    const parsed: FreemiumState = JSON.parse(raw);

    // If day rolled over and user is not Pro, reset daily counter
    if (parsed.lastActiveDate !== today && !parsed.isPro) {
      const resetState: FreemiumState = {
        ...parsed,
        completedTasksCount: 0,
        lastActiveDate: today,
      };
      saveFreemiumState(resetState);
      return resetState;
    }

    return parsed;
  } catch {
    const fallbackState: FreemiumState = {
      completedTasksCount: 0,
      lastActiveDate: today,
      isPro: false,
    };
    saveFreemiumState(fallbackState);
    return fallbackState;
  }
};

/**
 * Saves freemium state and notifies active components via a custom browser event.
 */
export const saveFreemiumState = (state: FreemiumState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<FreemiumState>('dopamine_freemium_updated', {
        detail: state,
      })
    );
  }
};

/**
 * Checks if the user is allowed to execute/decompose another task today.
 * Returns true if user has Pro lifetime license OR has completed fewer than 3 tasks today.
 */
export const canExecuteTask = (): boolean => {
  const state = getFreemiumState();
  if (state.isPro) return true;
  return state.completedTasksCount < DAILY_FREE_TASK_LIMIT;
};

/**
 * Returns the number of remaining free tasks for today.
 */
export const getRemainingFreeTasks = (): number => {
  const state = getFreemiumState();
  if (state.isPro) return Infinity;
  return Math.max(0, DAILY_FREE_TASK_LIMIT - state.completedTasksCount);
};

/**
 * Increments the daily completed task counter.
 */
export const recordTaskCompletion = (): FreemiumState => {
  const state = getFreemiumState();
  const updatedState: FreemiumState = {
    ...state,
    completedTasksCount: state.completedTasksCount + 1,
    lastActiveDate: getTodayDateString(),
  };
  saveFreemiumState(updatedState);
  return updatedState;
};

/**
 * Activates Pro status using a 6+ alphanumeric key or token.
 */
export const activateProWithKey = (
  rawKey: string
): { success: boolean; error?: string } => {
  const cleaned = (rawKey || '').trim().toUpperCase();

  // Validate format (at least 6 characters, alphanumeric with optional dashes)
  const isValidFormat = /^[A-Z0-9-]{6,}$/i.test(cleaned);

  if (!cleaned || !isValidFormat) {
    return {
      success: false,
      error: 'Zadej platný licenční klíč nebo kód účtenky (alespoň 6 znaků).',
    };
  }

  const currentState = getFreemiumState();
  const newState: FreemiumState = {
    ...currentState,
    isPro: true,
    licenseKey: cleaned,
    activatedAt: Date.now(),
  };

  saveFreemiumState(newState);
  return { success: true };
};

/**
 * Inspects URL parameters for Stripe success redirects (?success=true, ?pro=true, ?bump=true, ?license=...)
 * or purchase confirmation route (/purchase-complete).
 * Automatically unlocks Pro and cleans the URL without reloading the page when appropriate.
 */
export const initPaymentCheck = (
  force = false
): {
  activated: boolean;
  licenseKey?: string;
} => {
  if (typeof window === 'undefined') {
    return { activated: false };
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const isPurchaseCompletePath =
      window.location.pathname.includes('purchase-complete');

    const hasSuccessParam =
      force ||
      isPurchaseCompletePath ||
      urlParams.get('success') === 'true' ||
      urlParams.get('pro') === 'true' ||
      urlParams.get('bump') === 'true' ||
      urlParams.get('payment_success') === 'true' ||
      urlParams.get('paid') === 'true' ||
      urlParams.has('license') ||
      urlParams.has('license_key') ||
      urlParams.has('session_id') ||
      urlParams.has('product');

    if (hasSuccessParam) {
      const explicitKey =
        urlParams.get('license') ||
        urlParams.get('license_key') ||
        urlParams.get('session_id') ||
        `DOP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const currentState = getFreemiumState();
      const updatedState: FreemiumState = {
        ...currentState,
        isPro: true,
        licenseKey: currentState.licenseKey || explicitKey,
        activatedAt: currentState.activatedAt || Date.now(),
      };
      saveFreemiumState(updatedState);

      // Synchronize with general access token storage
      try {
        localStorage.setItem('dopamine_has_access', 'true');
        localStorage.setItem('focus_access_token', 'DOPAMINE-VIP-2026');
      } catch {
        // Storage safe fallback
      }

      // Clean query params only if on standard app path with success flags
      if (
        !isPurchaseCompletePath &&
        (urlParams.get('success') === 'true' || urlParams.get('pro') === 'true')
      ) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      return { activated: true, licenseKey: updatedState.licenseKey };
    }
  } catch {
    // Non-blocking fallback
  }

  return { activated: false };
};
