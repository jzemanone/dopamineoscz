import { track } from '@vercel/analytics';

export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
  first_touch_time?: string;
}

const UTM_STORAGE_KEY = 'dopamine_utm_params';
const SOURCE_STORAGE_KEY = 'dopamine_utm_source';

/**
 * Detects organic referrer channel if explicit UTM source isn't in query params.
 */
function detectOrganicSource(referrer: string): string | undefined {
  if (!referrer) return undefined;
  const ref = referrer.toLowerCase();
  if (ref.includes('tiktok.com')) return 'tiktok_organic';
  if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) return 'instagram_organic';
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'youtube_organic';
  if (ref.includes('t.co') || ref.includes('x.com') || ref.includes('twitter.com')) return 'x_twitter_organic';
  if (ref.includes('reddit.com')) return 'reddit_organic';
  if (ref.includes('google.com')) return 'google_organic';
  if (ref.includes('linkedin.com')) return 'linkedin_organic';
  if (ref.includes('threads.net')) return 'threads_organic';
  return undefined;
}

/**
 * Parse and persist UTM parameters in localStorage for lifetime multi-touch attribution.
 */
export function initUtmTracking(): UtmData {
  if (typeof window === 'undefined') return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const rawReferrer = document.referrer || '';
    const detectedSource = urlParams.get('utm_source') || detectOrganicSource(rawReferrer);

    // Retrieve existing first-touch params if present
    const existingRaw = localStorage.getItem(UTM_STORAGE_KEY);
    let existingData: UtmData = existingRaw ? JSON.parse(existingRaw) : {};

    const incomingData: UtmData = {
      utm_source: detectedSource || existingData.utm_source || 'direct',
      utm_medium: urlParams.get('utm_medium') || (detectedSource?.endsWith('_organic') ? 'social' : existingData.utm_medium) || 'none',
      utm_campaign: urlParams.get('utm_campaign') || existingData.utm_campaign || 'general',
      utm_term: urlParams.get('utm_term') || existingData.utm_term,
      utm_content: urlParams.get('utm_content') || existingData.utm_content,
      referrer: rawReferrer || existingData.referrer || 'direct',
      landing_path: window.location.pathname + window.location.search,
      first_touch_time: existingData.first_touch_time || new Date().toISOString(),
    };

    // Clean undefined keys
    const sanitized: UtmData = Object.fromEntries(
      Object.entries(incomingData).filter(([_, v]) => v !== undefined)
    ) as UtmData;

    // Persist unified object + convenience individual key
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(sanitized));
    if (sanitized.utm_source) {
      localStorage.setItem(SOURCE_STORAGE_KEY, sanitized.utm_source);
    }

    return sanitized;
  } catch (err) {
    console.warn('[Analytics] Failed to initialize UTM storage:', err);
    return {};
  }
}

/**
 * Get stored UTM parameters for appending to Stripe links or custom events.
 */
export function getStoredUtmParams(): UtmData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Core event tracking helper with automatic UTM metadata merging.
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  try {
    const utm = getStoredUtmParams();
    const payload = {
      ...properties,
      utm_source: properties.utm_source || utm.utm_source || 'direct',
      utm_medium: properties.utm_medium || utm.utm_medium || 'none',
      utm_campaign: properties.utm_campaign || utm.utm_campaign || 'general',
      referrer: properties.referrer || utm.referrer || 'direct',
      timestamp: new Date().toISOString(),
    };

    // Send to Vercel Analytics
    track(eventName, payload);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 [Event Tracked: ${eventName}]`, payload);
    }
  } catch (err) {
    console.warn(`[Analytics] Error tracking event "${eventName}":`, err);
  }
}

/**
 * 1. Landing Page View Event
 */
export function trackLandingPageView(customProps: Record<string, any> = {}) {
  const utm = getStoredUtmParams();
  trackEvent('landing_page_view', {
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    screen_width: typeof window !== 'undefined' ? window.innerWidth : 0,
    ...utm,
    ...customProps,
  });
}

/**
 * 2. CTA Click Buy Event (Tracks clicks on buy / checkout triggers)
 */
export function trackCtaClickBuy(
  location: string,
  price: number = 27,
  product: string = 'dopamine_os_lifetime'
) {
  trackEvent('cta_click_buy', {
    cta_location: location,
    product_name: product,
    price,
  });
}

/**
 * 3. Checkout Redirect Event (Tracks when user transitions to Stripe checkout)
 */
export function trackCheckoutRedirect(
  product: string = 'base',
  price: number = 27,
  hasOrderBump: boolean = false
) {
  trackEvent('checkout_redirect', {
    product,
    price,
    has_order_bump: hasOrderBump,
  });
}

/**
 * 4. Morning Launchpad Activation Metric
 */
export function trackMorningLaunchpadCompleted(data: {
  mode: string;
  primaryTask: string;
  stepsCount: number;
  capacity: string;
}) {
  trackEvent('morning_launchpad_completed', {
    mode: data.mode,
    steps_count: data.stepsCount,
    capacity: data.capacity,
    has_primary_task: Boolean(data.primaryTask),
  });
}

/**
 * 5. Step Completed (XP Loop Engagement)
 */
export function trackStepCompleted(data: {
  stepIndex: number;
  totalSteps: number;
  taskTitle: string;
  xpEarned: number;
}) {
  trackEvent('step_completed', {
    step_number: data.stepIndex + 1,
    total_steps: data.totalSteps,
    xp_earned: data.xpEarned,
  });
}

/**
 * Task Completed Event
 */
export function trackTaskCompleted(data: {
  taskId: string;
  taskTitle: string;
  xpEarned: number;
  energyLevel: string;
}) {
  trackEvent('task_completed', {
    task_id: data.taskId,
    energy_level: data.energyLevel,
    xp_earned: data.xpEarned,
  });
}
