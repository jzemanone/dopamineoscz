import React, { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { SalesPage } from './components/SalesPage';
import { FocusApp } from './components/FocusApp';
import { PurchaseComplete } from './components/PurchaseComplete';
import { LoginPage } from './components/LoginPage';
import { InAppBrowserWarning } from './components/InAppBrowserWarning';
import { checkHasAccess, processUrlAccessParam, grantAccess } from './utils/storage';
import { getFreemiumState } from './lib/freemium';
import { initUtmTracking } from './lib/analytics';

// Route protection component for /app
function AppRouteGuard() {
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      // Stripe payment return detection: ?success=true
      if (urlParams.get('success') === 'true') {
        try {
          localStorage.setItem('dopamine_os_premium', 'true');
        } catch {}
        grantAccess();
        return true;
      }
      // 0. Check for direct DM / ManyChat campaign launch (?start= / ?utm_source=manychat)
      if (urlParams.has('start') || urlParams.get('utm_source') === 'manychat') {
        grantAccess();
        return true;
      }
    }
    // 1. Process ?access= URL parameter if present
    const unlockedViaUrl = processUrlAccessParam();
    // 2. Check if user has access in localStorage or Pro license
    return (
      unlockedViaUrl ||
      checkHasAccess() ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('dopamine_os_premium') === 'true') ||
      getFreemiumState().isPro
    );
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      try {
        localStorage.setItem('dopamine_os_premium', 'true');
      } catch {}
      grantAccess();
      setIsAuthorized(true);
      return;
    }

    const shouldDirectLaunch = urlParams.has('start') || urlParams.get('utm_source') === 'manychat';
    if (shouldDirectLaunch) {
      grantAccess();
      setIsAuthorized(true);
      return;
    }

    const hasAccess =
      processUrlAccessParam() ||
      checkHasAccess() ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('dopamine_os_premium') === 'true') ||
      getFreemiumState().isPro;

    if (!hasAccess) {
      // Redirect to sales page with auth_error flag
      setLocation('/?auth_error=true');
    } else {
      setIsAuthorized(true);
    }
  }, [setLocation]);

  if (!isAuthorized) {
    return null; // Will redirect via useEffect
  }

  return <FocusApp onNavigateToSalesPage={() => setLocation('/')} />;
}

export default function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    initUtmTracking();

    // Inspect URL search params on mount
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);

      // Handle Stripe success redirect if landed on / instead of /app
      if (urlParams.get('success') === 'true') {
        try {
          localStorage.setItem('dopamine_os_premium', 'true');
        } catch {}
        grantAccess();
        if (location !== '/app') {
          setLocation('/app' + window.location.search);
        }
      }

      // Handle direct campaign launches
      const shouldDirectLaunch = urlParams.has('start') || urlParams.get('utm_source') === 'manychat';
      if (shouldDirectLaunch && location !== '/app') {
        grantAccess();
        const search = window.location.search;
        setLocation('/app' + search);
      }
    }
  }, [location, setLocation]);

  const handleNavigateToApp = () => {
    grantAccess();
    setLocation('/app');
  };

  return (
    <>
      <InAppBrowserWarning />
      <Switch>
        <Route path="/">
          <SalesPage
            onNavigateToApp={handleNavigateToApp}
            onNavigateToLogin={() => setLocation('/login')}
          />
        </Route>

        <Route path="/app">
          <AppRouteGuard />
        </Route>

        <Route path="/purchase-complete">
          <PurchaseComplete onNavigateToApp={() => setLocation('/app')} />
        </Route>

        <Route path="/login">
          <LoginPage
            onNavigateToApp={() => setLocation('/app')}
            onNavigateToSalesPage={() => setLocation('/')}
          />
        </Route>

        {/* Fallback route */}
        <Route>
          <SalesPage
            onNavigateToApp={handleNavigateToApp}
            onNavigateToLogin={() => setLocation('/login')}
          />
        </Route>
      </Switch>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
