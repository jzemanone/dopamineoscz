// Notification Manager for Dopamine OS PWA / Web Push
import { OpenLoop, SpendingPause } from '../types';
import { isDueForNotification, formatDueDateTime } from './dateTime';

const NOTIFICATION_CHANNEL_NAME = 'focus_flow_notifications';

// Initialize Service Worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('[PWA Notification] Service worker registration error:', err);
    return null;
  }
};

// Check current notification permission
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

// Request notification permission from user
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.warn('[PWA Notification] Permission request error:', err);
    return false;
  }
};

// Trigger a single actionable notification for a due Open Loop
export const showDueLoopNotification = async (
  loop: OpenLoop,
  onCompleteCallback?: (loopId: string) => void,
  onPostponeCallback?: (loopId: string) => void
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const formatted = formatDueDateTime(loop.dueDate);
  const timeLabel = formatted ? formatted.formattedTime : '';
  const title = `🔔 Due Now: ${loop.title}`;
  const body = loop.person
    ? `${loop.title} (for ${loop.person})${timeLabel ? ` is due at ${timeLabel}` : ' is due now'}.`
    : `${loop.title}${timeLabel ? ` is due at ${timeLabel}` : ' is due now'}.`;

  const options: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `loop-due-${loop.id}`, // Strictly one notification per loop to avoid stacking
    data: {
      loopId: loop.id,
      dueDate: loop.dueDate,
      title: loop.title,
    },
    requireInteraction: true,
    actions: [
      {
        action: 'complete',
        title: '✓ Mark Done',
      },
      {
        action: 'postpone',
        title: '🕒 Postpone +1 Day',
      },
    ],
  };

  try {
    // Try via ServiceWorkerRegistration for rich background action buttons
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }

    // Fallback to standard Notification instance
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      data: options.data,
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('[PWA Notification] Error displaying notification:', err);
    return false;
  }
};

// Scan loops and trigger notification ONLY for loops due now with opt-in enabled and not yet notified
export const checkDueLoopsForNotification = async (
  loops: OpenLoop[],
  onMarkNotified: (loopId: string) => void,
  onCompleteLoop?: (loopId: string) => void,
  onPostponeLoop?: (loopId: string) => void
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const nowMs = Date.now();

  for (const loop of loops) {
    // Requirements:
    // 1. Status is open
    // 2. Has a dueDate
    // 3. User opted in to reminder (remindOnDueDate === true)
    // 4. Exactly one notification rule: not already notified (!loop.notified)
    // 5. exact due date+time has arrived or passed
    if (
      loop.status === 'open' &&
      loop.dueDate &&
      loop.remindOnDueDate &&
      !loop.notified &&
      isDueForNotification(loop.dueDate, nowMs)
    ) {
      const shown = await showDueLoopNotification(loop, onCompleteLoop, onPostponeLoop);
      if (shown) {
        onMarkNotified(loop.id);
      }
    }
  }
};

// Trigger a single actionable notification for a 24h Spending Pause cooldown
export const showSpendingPauseNotification = async (
  pause: SpendingPause,
  onResolveCallback?: (pauseId: string, outcome: 'bought' | 'skipped') => void
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const title = `Still want it?`;
  const body = `${pause.itemName} – $${pause.cost}`;

  const options: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `spending-pause-${pause.id}`, // Strictly one notification per pause
    data: {
      pauseId: pause.id,
      itemName: pause.itemName,
      cost: pause.cost,
    },
    requireInteraction: true,
    actions: [
      {
        action: 'buy',
        title: 'Yes, buy it',
      },
      {
        action: 'skip',
        title: 'No, skip it',
      },
    ],
  };

  try {
    // Try via ServiceWorkerRegistration for rich background action buttons
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }

    // Fallback to standard Notification instance
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      data: options.data,
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('[PWA Notification] Error displaying spending pause notification:', err);
    return false;
  }
};

// Scan spending pauses and trigger notification when 24h cooldown expires
export const checkDueSpendingPausesForNotification = async (
  pauses: SpendingPause[],
  onMarkNotified: (pauseId: string) => void,
  onResolvePause?: (pauseId: string, outcome: 'bought' | 'skipped') => void
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const nowMs = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  for (const pause of pauses) {
    // Requirements:
    // 1. Pending (no outcome set yet)
    // 2. Exactly one notification rule: not already notified (!pause.notified)
    // 3. 24 hours have elapsed since creation
    if (!pause.outcome && !pause.notified && nowMs >= pause.createdAt + TWENTY_FOUR_HOURS_MS) {
      const shown = await showSpendingPauseNotification(pause, onResolvePause);
      if (shown) {
        onMarkNotified(pause.id);
      }
    }
  }
};

// Setup cross-tab / service worker notification action listener
export const setupNotificationActionListener = (
  onCompleteLoop: (loopId: string) => void,
  onPostponeLoop: (loopId: string) => void,
  onResolveSpendingPause?: (pauseId: string, outcome: 'bought' | 'skipped') => void
) => {
  if (typeof window === 'undefined') return () => {};

  // 1. BroadcastChannel Listener
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(NOTIFICATION_CHANNEL_NAME);
    channel.onmessage = (event) => {
      const { type, loopId, pauseId, outcome } = event.data || {};
      if (type === 'COMPLETE_LOOP' && loopId) {
        onCompleteLoop(loopId);
      } else if (type === 'POSTPONE_LOOP' && loopId) {
        onPostponeLoop(loopId);
      } else if (type === 'RESOLVE_SPENDING_PAUSE' && pauseId && outcome && onResolveSpendingPause) {
        onResolveSpendingPause(pauseId, outcome);
      }
    };
  } catch (e) {
    console.warn('[PWA Notification] BroadcastChannel not supported:', e);
  }

  // 2. Service Worker Message Listener
  const handleSwMessage = (event: MessageEvent) => {
    const { type, loopId, pauseId, outcome } = event.data || {};
    if (type === 'COMPLETE_LOOP' && loopId) {
      onCompleteLoop(loopId);
    } else if (type === 'POSTPONE_LOOP' && loopId) {
      onPostponeLoop(loopId);
    } else if (type === 'RESOLVE_SPENDING_PAUSE' && pauseId && outcome && onResolveSpendingPause) {
      onResolveSpendingPause(pauseId, outcome);
    }
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
  }

  // Cleanup function
  return () => {
    if (channel) {
      channel.close();
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  };
};
