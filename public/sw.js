// Service Worker for Dopamine OS PWA Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Broadcast channel for instantaneous cross-tab and background communication
const channel = new BroadcastChannel('focus_flow_notifications');

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const loopId = notification.data?.loopId;
  const pauseId = notification.data?.pauseId;

  notification.close();

  if (action === 'complete') {
    // Send message to open application tabs
    channel.postMessage({
      type: 'COMPLETE_LOOP',
      loopId: loopId,
      timestamp: Date.now(),
    });

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'COMPLETE_LOOP',
            loopId: loopId,
          });
        }
      })
    );
  } else if (action === 'postpone') {
    // Postpone loop by 1 day
    channel.postMessage({
      type: 'POSTPONE_LOOP',
      loopId: loopId,
      timestamp: Date.now(),
    });

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'POSTPONE_LOOP',
            loopId: loopId,
          });
        }
      })
    );
  } else if (action === 'buy' || action === 'skip') {
    // Spending Pause action: direct 1-tap resolution without opening app
    const outcome = action === 'buy' ? 'bought' : 'skipped';
    channel.postMessage({
      type: 'RESOLVE_SPENDING_PAUSE',
      pauseId: pauseId,
      outcome: outcome,
      timestamp: Date.now(),
    });

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'RESOLVE_SPENDING_PAUSE',
            pauseId: pauseId,
            outcome: outcome,
          });
        }
      })
    );
  } else {
    // Focus or open window
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});
