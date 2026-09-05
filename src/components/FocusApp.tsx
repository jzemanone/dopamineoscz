import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sprout } from 'lucide-react';
import {
  Task,
  UserStats,
  AppSettings,
  EnergyLevel,
  BADGES_LIST,
  INITIAL_STATS,
  INITIAL_SETTINGS,
  FocusFlowState,
  OpenLoop,
  SoftUrgency,
  DailySummary,
  SpendingPause,
  MealIdea,
} from '../types';
import {
  loadAppState,
  saveAppState,
  clearAllDataFromStorage,
  DEFAULT_TASKS,
  DEFAULT_OPEN_LOOPS,
} from '../utils/storage';
import { soundManager } from '../utils/audio';
import { launchConfetti } from '../utils/confetti';

import { Header } from './Header';
import { Step2CapacitySelector } from './Step2CapacitySelector';
import { TodayFlow } from './TodayFlow';
import { BacklogView } from './BacklogView';
import { SosView } from './SosView';
import { ToolkitView } from './ToolkitView';
import { BottomNavBar, MainTabType } from './BottomNavBar';
import { MorningNavigator } from './MorningNavigator';
import { StatsDrawer } from './StatsDrawer';
import { BulkDumpModal } from './BulkDumpModal';
import { StepDecomposer } from './StepDecomposer';
import { PwaInstallModal } from './PwaInstallModal';
import { OpenLoopsDrawer } from './OpenLoopsDrawer';
import { EveningRecapModal } from './EveningRecapModal';
import { PaywallModal } from './PaywallModal';
import { RestoreLicenseModal } from './RestoreLicenseModal';
import { PdfVaultModal } from './PdfVaultModal';
import {
  getFreemiumState,
  recordTaskCompletion,
  initPaymentCheck,
  canExecuteTask,
  FreemiumState,
} from '../lib/freemium';
import { DecomposeMode } from '../services/decomposer';
import { autoTriageRawInput, autoTriageTaskList } from '../utils/triage';
import {
  registerServiceWorker,
  checkDueLoopsForNotification,
  checkDueSpendingPausesForNotification,
  setupNotificationActionListener,
} from '../utils/notifications';
import { postponeDueDateByOneDay, normalizeDueDateTime } from '../utils/dateTime';

interface FocusAppProps {
  onNavigateToSalesPage?: () => void;
}

export const FocusApp: React.FC<FocusAppProps> = ({ onNavigateToSalesPage }) => {
  // Load unified state (persisted under focus_flow_v3)
  const [initialState] = useState<FocusFlowState>(loadAppState);

  const [tasks, setTasks] = useState<Task[]>(initialState.tasks);
  const [openLoops, setOpenLoops] = useState<OpenLoop[]>(
    initialState.openLoops && initialState.openLoops.length > 0
      ? initialState.openLoops
      : DEFAULT_OPEN_LOOPS
  );
  const [spendingPauses, setSpendingPauses] = useState<SpendingPause[]>(
    initialState.spendingPauses || []
  );
  const [customMeals, setCustomMeals] = useState<MealIdea[]>(
    initialState.customMeals || []
  );
  const [stats, setStats] = useState<UserStats>(initialState.stats);
  const [settings, setSettings] = useState<AppSettings>(initialState.settings);
  const [currentCapacity, setCurrentCapacity] = useState<EnergyLevel>(
    initialState.currentCapacity
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(
    initialState.activeTaskId
  );

  const [isDayClosed, setIsDayClosed] = useState<boolean>(
    initialState.isDayClosed ||
      (initialState.lastClosedDay === new Date().toISOString().split('T')[0])
  );
  const [dailySummaries, setDailySummaries] = useState<Record<string, DailySummary>>(
    initialState.dailySummaries || {}
  );

  // Main Tabs: 'today' | 'backlog' | 'toolkit' | 'sos'
  const [activeTab, setActiveTab] = useState<MainTabType>('today');

  // Floating real-time XP notification
  const [recentXpGain, setRecentXpGain] = useState<{
    amount: number;
    reason: string;
  } | null>(null);
  const xpToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal / Drawer states
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isBulkDumpOpen, setIsBulkDumpOpen] = useState<boolean>(false);
  const [decomposeTaskId, setDecomposeTaskId] = useState<string | null>(null);
  const [isMorningNavigatorOpen, setIsMorningNavigatorOpen] = useState<boolean>(false);
  const [isLoopsDrawerOpen, setIsLoopsDrawerOpen] = useState<boolean>(false);
  const [isEveningRecapOpen, setIsEveningRecapOpen] = useState<boolean>(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstallOpen, setIsPwaInstallOpen] = useState<boolean>(false);

  // Freemium & Lifetime Monetization state
  const [freemium, setFreemium] = useState<FreemiumState>(getFreemiumState);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [isRestoreLicenseOpen, setIsRestoreLicenseOpen] = useState<boolean>(false);
  const [isPdfVaultModalOpen, setIsPdfVaultModalOpen] = useState<boolean>(false);

  // Initial load checks: Morning Day Navigator & PWA prompt & Service Worker & Payment check
  useEffect(() => {
    // 1. Inspect URL parameters for Stripe success redirects & bump detection
    const urlParams = new URLSearchParams(window.location.search);
    const hasSuccessParam = urlParams.get('success') === 'true';
    const hasBumpParam = urlParams.get('bump') === 'true';

    // If success=true is present in URL, immediately save dopamine_os_premium = true into localStorage
    if (hasSuccessParam) {
      try {
        localStorage.setItem('dopamine_os_premium', 'true');
        localStorage.setItem('dopamine_has_access', 'true');
      } catch {
        // Storage safe fallback
      }
    }

    // Check Stripe checkout redirect tokens or success params
    const paymentResult = initPaymentCheck();
    if (paymentResult.activated || hasSuccessParam) {
      const activeState = getFreemiumState();
      setFreemium(activeState);
      soundManager.playLevelUp(true);
      launchConfetti();
      triggerXpToast(100, 'Doživotní Pro aktivováno (+100 XP)!');
      handleAwardXp(100, 'Aktivace doživotního Pro (+100 XP)');

      // If bump=true was in the URL (Order Bump purchased), open the PDF Vault modal
      if (hasBumpParam || paymentResult.isBump) {
        setIsPdfVaultModalOpen(true);
        try {
          localStorage.setItem('dopamine_os_vault_unlocked', 'true');
        } catch {
          // Storage safe fallback
        }
      }
    }

    // Clean URL address bar using window.history.replaceState so success and bump don't linger
    if (hasSuccessParam || hasBumpParam) {
      try {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch {
        // Storage safe fallback
      }
    }

    // Subscribe to multi-tab or intra-app freemium state sync
    const handleFreemiumSync = (e: any) => {
      if (e.detail) {
        setFreemium(e.detail);
      }
    };
    window.addEventListener('dopamine_freemium_updated', handleFreemiumSync);

    // Register Service Worker for PWA / push notifications
    registerServiceWorker();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const todayStr = new Date().toISOString().split('T')[0];
    const hasCheckedInToday = stats.lastCheckInDate === todayStr;

    // Show Morning Day Navigator if not checked in today OR if directly launched via campaign (?start= / ?utm_source=manychat)
    const shouldDirectLaunch = urlParams.has('start') || urlParams.get('utm_source') === 'manychat';

    if (shouldDirectLaunch || !hasCheckedInToday) {
      setIsMorningNavigatorOpen(true);
    } else {
      // Onboarding PWA modal check if already checked in
      const isDismissed = localStorage.getItem('dopamine_pwa_dismissed') === 'true';
      if (!isDismissed) {
        setIsPwaInstallOpen(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('dopamine_freemium_updated', handleFreemiumSync);
    };
  }, []);

  // Cross-tab and Service Worker Notification action button handler
  useEffect(() => {
    const cleanup = setupNotificationActionListener(
      (loopId) => {
        handleCompleteOpenLoop(loopId);
      },
      (loopId) => {
        handlePostponeOpenLoop(loopId);
      },
      (pauseId, outcome) => {
        handleResolveSpendingPause(pauseId, outcome);
      }
    );

    return () => cleanup();
  }, []);

  // Check for due loops and spending pauses that opted into notifications
  useEffect(() => {
    checkDueLoopsForNotification(
      openLoops,
      handleMarkLoopNotified,
      handleCompleteOpenLoop,
      handlePostponeOpenLoop
    );
    checkDueSpendingPausesForNotification(
      spendingPauses,
      handleMarkPauseNotified,
      handleResolveSpendingPause
    );

    const interval = setInterval(() => {
      checkDueLoopsForNotification(
        openLoops,
        handleMarkLoopNotified,
        handleCompleteOpenLoop,
        handlePostponeOpenLoop
      );
      checkDueSpendingPausesForNotification(
        spendingPauses,
        handleMarkPauseNotified,
        handleResolveSpendingPause
      );
    }, 30000);

    return () => clearInterval(interval);
  }, [openLoops, spendingPauses]);

  // Save to unified local storage
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    saveAppState({
      tasks,
      openLoops,
      stats,
      settings,
      currentCapacity,
      activeTaskId,
      lastCheckInDate: stats.lastCheckInDate || todayStr,
      lastClosedDay: isDayClosed ? todayStr : '',
      isDayClosed,
      dailySummaries,
      spendingPauses,
      customMeals,
    });
  }, [
    tasks,
    openLoops,
    stats,
    settings,
    currentCapacity,
    activeTaskId,
    isDayClosed,
    dailySummaries,
    spendingPauses,
    customMeals,
  ]);

  // Determine active task & continuous queue
  const pendingTasks = tasks.filter((t) => !t.completed);

  let activeTask = tasks.find((t) => t.id === activeTaskId && !t.completed) || null;

  // Auto-pull fallback: Never leave user stranded if pending tasks exist!
  if (!activeTask && pendingTasks.length > 0) {
    const matching = pendingTasks.find(
      (t) =>
        t.energyLevel === currentCapacity ||
        (currentCapacity === 'low' && t.estimatedMinutes <= 2) ||
        (currentCapacity === 'medium' &&
          t.estimatedMinutes > 2 &&
          t.estimatedMinutes <= 10) ||
        (currentCapacity === 'high' && t.estimatedMinutes > 10)
    );
    activeTask = matching || pendingTasks[0];
  }

  const upNextTasks = pendingTasks.filter((t) => t.id !== activeTask?.id);

  // Audio & Haptic Feedback Helpers
  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    soundManager.playClick(updated.soundEnabled);
  };

  const handleToggleHaptic = () => {
    const updated = { ...settings, hapticEnabled: !settings.hapticEnabled };
    setSettings(updated);
    soundManager.triggerHaptic(updated.hapticEnabled);
  };

  const handlePlayClick = () => {
    soundManager.playClick(settings.soundEnabled);
    soundManager.triggerHaptic(settings.hapticEnabled);
  };

  const handleTick = () => {
    soundManager.playTick(settings.soundEnabled);
  };

  // Helper to trigger floating XP toast
  const triggerXpToast = (amount: number, reason: string) => {
    if (xpToastTimeoutRef.current) clearTimeout(xpToastTimeoutRef.current);
    setRecentXpGain({ amount, reason });
    xpToastTimeoutRef.current = setTimeout(() => {
      setRecentXpGain(null);
    }, 2500);
  };

  // General XP award engine (used by timer, check-in, reset, tasks)
  const handleAwardXp = (amount: number, reason: string) => {
    triggerXpToast(amount, reason);

    const newTotalXp = stats.xp + amount;
    const newLevel = Math.floor(newTotalXp / 100) + 1;
    if (newLevel > stats.level) {
      setTimeout(() => soundManager.playLevelUp(settings.soundEnabled), 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check newly unlocked badges
    const newlyUnlockedBadges = [...stats.unlockedBadges];
    BADGES_LIST.forEach((b) => {
      if (!newlyUnlockedBadges.includes(b.id)) {
        if (b.reqType === 'level' && newLevel >= b.reqValue) {
          newlyUnlockedBadges.push(b.id);
        } else if (b.reqType === 'xp' && newTotalXp >= b.reqValue) {
          newlyUnlockedBadges.push(b.id);
        }
      }
    });

    setStats((prev) => ({
      ...prev,
      xp: newTotalXp,
      level: newLevel,
      lastActiveDate: todayStr,
      unlockedBadges: newlyUnlockedBadges,
    }));
  };

  // Direct Task Parking: Send task to the very end of queue & increment parkedCount
  const handleParkTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    soundManager.playClick(settings.soundEnabled);
    const updatedCount = (target.parkedCount || 0) + 1;
    const otherTasks = tasks.filter((t) => t.id !== taskId);
    const updatedTask = { ...target, parkedCount: updatedCount };

    // Move to end
    const reordered = [...otherTasks, updatedTask];
    setTasks(reordered);

    // Auto-advance active task to next in queue
    const remainingPending = reordered.filter((t) => !t.completed && t.id !== taskId);
    if (remainingPending.length > 0) {
      setActiveTaskId(remainingPending[0].id);
    }
  };

  // Drop Task: Quietly relieve mental load without guilt
  const handleDropTask = (taskId: string) => {
    soundManager.playClick(settings.soundEnabled);
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    // Delete or mark dropped
    const remaining = tasks.filter((t) => t.id !== taskId);
    setTasks(remaining);

    if (activeTaskId === taskId) {
      const remainingPending = remaining.filter((t) => !t.completed);
      setActiveTaskId(remainingPending.length > 0 ? remainingPending[0].id : null);
    }
  };

  // OPEN LOOPS (LIFE LAYER) HANDLERS
  const handleAddOpenLoop = (
    title: string,
    person?: string,
    dueDate?: string,
    softUrgency?: SoftUrgency,
    remindOnDueDate?: boolean
  ) => {
    const normalizedDueDate = dueDate ? normalizeDueDateTime(dueDate) : undefined;
    const newLoop: OpenLoop = {
      id: `loop-${Date.now()}`,
      title,
      person,
      dueDate: normalizedDueDate,
      softUrgency: softUrgency || 'few_days',
      createdAt: Date.now(),
      parkedCount: 0,
      status: 'open',
      sourceType: 'manual',
      remindOnDueDate: normalizedDueDate ? (remindOnDueDate ?? true) : false,
      notified: false,
    };
    setOpenLoops((prev) => [newLoop, ...prev]);
    soundManager.playSuccess(settings.soundEnabled);
    triggerXpToast(10, 'Závazek bezpečně uložen do LIFE vrstvy');
  };

  const handleCompleteOpenLoop = (loopId: string) => {
    soundManager.playSuccess(settings.soundEnabled);
    soundManager.triggerHaptic(settings.hapticEnabled);
    launchConfetti();
    handleAwardXp(30, 'Otevřená smyčka vyřešena (+30 XP)');

    setOpenLoops((prev) =>
      prev.map((l) =>
        l.id === loopId
          ? { ...l, status: 'done', completedAt: Date.now() }
          : l
      )
    );
  };

  const handlePostponeOpenLoop = (loopId: string) => {
    setOpenLoops((prev) =>
      prev.map((l) => {
        if (l.id === loopId) {
          const nextDueStr = postponeDueDateByOneDay(l.dueDate);
          return {
            ...l,
            dueDate: nextDueStr,
            parkedCount: (l.parkedCount || 0) + 1,
            notified: false, // Reset single notification rule for the new due date
          };
        }
        return l;
      })
    );
    soundManager.playClick(settings.soundEnabled);
    triggerXpToast(10, 'Smyčka odložena o +1 den');
  };

  const handleMarkLoopNotified = (loopId: string) => {
    setOpenLoops((prev) =>
      prev.map((l) =>
        l.id === loopId
          ? { ...l, notified: true, notifiedAt: Date.now() }
          : l
      )
    );
  };

  const handleDropOpenLoop = (loopId: string) => {
    soundManager.playClick(settings.soundEnabled);
    setOpenLoops((prev) =>
      prev.map((l) => (l.id === loopId ? { ...l, status: 'dropped' } : l))
    );
  };

  const handlePromoteLoopToToday = (loop: OpenLoop) => {
    soundManager.playSuccess(settings.soundEnabled);
    // Create immediate high-priority task for Today Flow
    const newTask: Task = {
      id: `t-loop-${Date.now()}`,
      title: loop.title,
      estimatedMinutes: 10,
      energyLevel: 'medium',
      category: 'work',
      completed: false,
      createdAt: Date.now(),
      person: loop.person,
      dueDate: loop.dueDate,
      isDeadlinePromoted: !!loop.dueDate,
      xpReward: 35,
    };

    setTasks((prev) => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
    setIsLoopsDrawerOpen(false);
    setActiveTab('today');
    triggerXpToast(15, 'Smyčka přesunuta do dnešní fronty!');
  };

  // SPENDING PAUSE & TOOLKIT HANDLERS
  const handleAddSpendingPause = (itemName: string, cost: number) => {
    const newPause: SpendingPause = {
      id: `sp-${Date.now()}`,
      itemName,
      cost,
      createdAt: Date.now(),
      outcome: null,
      notified: false,
    };
    setSpendingPauses((prev) => [newPause, ...prev]);
    soundManager.playSuccess(settings.soundEnabled);
    triggerXpToast(10, '24h stopka spuštěna. Vyhodnocení zítra.');
  };

  const handleResolveSpendingPause = (pauseId: string, outcome: 'bought' | 'skipped') => {
    setSpendingPauses((prev) =>
      prev.map((p) =>
        p.id === pauseId
          ? {
              ...p,
              outcome,
              resolvedAt: Date.now(),
            }
          : p
      )
    );

    if (outcome === 'skipped') {
      soundManager.playSuccess(settings.soundEnabled);
      soundManager.triggerHaptic(settings.hapticEnabled);
      launchConfetti();
      handleAwardXp(15, 'Nákup odložen a ušetřeno (+15 XP)');
    } else {
      soundManager.playClick(settings.soundEnabled);
    }
  };

  const handleMarkPauseNotified = (pauseId: string) => {
    setSpendingPauses((prev) =>
      prev.map((p) =>
        p.id === pauseId
          ? { ...p, notified: true, notifiedAt: Date.now() }
          : p
      )
    );
  };

  const handleAddCustomMeal = (mealData: Omit<MealIdea, 'id'>) => {
    const newMeal: MealIdea = {
      ...mealData,
      id: `custom-meal-${Date.now()}`,
    };
    setCustomMeals((prev) => [newMeal, ...prev]);
    soundManager.playSuccess(settings.soundEnabled);
    triggerXpToast(10, 'Přidáno do jídel bez rozhodování!');
  };

  const handleQueueMealTask = (meal: MealIdea) => {
    soundManager.playSuccess(settings.soundEnabled);

    // Attach predefined physical micro-steps or generate tangible fuel steps
    const microSteps =
      meal.steps && meal.steps.length >= 3
        ? meal.steps
        : [
            `Vstaň a jdi k lince pro suroviny na ${meal.name}`,
            `Příprava: ${meal.tips.slice(0, 65)}`,
            `Dej na talíř nebo do misky a dej si první sousto`,
          ];

    const newTask: Task = {
      id: `t-meal-${Date.now()}`,
      title: `Jídlo: ${meal.name}`,
      estimatedMinutes: meal.energyLevel === 'low' ? 2 : meal.energyLevel === 'medium' ? 5 : 15,
      energyLevel: meal.energyLevel,
      category: 'fuel',
      completed: false,
      createdAt: Date.now(),
      xpReward: 10,
      isDecomposed: true,
      subtasks: microSteps.map((s, idx) => ({
        id: `st-meal-${Date.now()}-${idx}`,
        title: s,
        completed: false,
      })),
    };
    setTasks((prev) => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
    setActiveTab('today');
    triggerXpToast(10, 'Jídlo zařazeno s mikro-kroky do dnešní fronty!');
  };

  const handleCookMeal = (meal: MealIdea) => {
    soundManager.playSuccess(settings.soundEnabled);
    soundManager.triggerHaptic(settings.hapticEnabled);
    launchConfetti();
    handleAwardXp(10, `Příprava rychlého jídla hotova (+10 XP)`);
  };

  // Morning Day Navigator Launch Handler with Smart Auto-Triage
  const handleLaunchMorningFlow = (data: {
    mode: DecomposeMode;
    capacity: EnergyLevel;
    primaryTask: string;
    steps: string[];
    warmUpTask?: string;
    orbitalStash: string[];
    category: 'physical' | 'digital' | 'admin' | 'fuel';
    source: 'gemini' | 'heuristic_fallback';
    createdLoops?: OpenLoop[];
  }) => {
    setCurrentCapacity(data.capacity);

    const createdList: Task[] = [];

    // 1. Optional Warm-Up Starter Task
    if (data.warmUpTask) {
      createdList.push({
        id: `t-warm-${Date.now()}`,
        title: data.warmUpTask,
        estimatedMinutes: 2,
        energyLevel: 'low',
        category: 'quick-fix',
        completed: false,
        createdAt: Date.now() - 100,
        xpReward: 25,
      });
    }

    // 2. Primary Needle Mover Task (with decomposed 3 steps)
    const subtasks = data.steps.map((title, idx) => ({
      id: `sub-nav-${Date.now()}-${idx}`,
      title,
      completed: false,
    }));

    const primaryTaskObj: Task = {
      id: `t-nav-${Date.now()}`,
      title: data.primaryTask,
      estimatedMinutes: data.capacity === 'low' ? 2 : data.capacity === 'medium' ? 10 : 25,
      energyLevel: data.capacity,
      category:
        data.category === 'physical'
          ? 'health'
          : data.category === 'digital'
          ? 'work'
          : data.category === 'admin'
          ? 'admin'
          : 'health',
      completed: false,
      createdAt: Date.now(),
      subtasks,
      xpReward: 40,
    };
    createdList.push(primaryTaskObj);

    // 3. Stash tasks
    const stashTasks: Task[] = data.orbitalStash.map((thought, idx) => ({
      id: `t-stash-${Date.now()}-${idx}`,
      title: thought,
      estimatedMinutes: 5,
      energyLevel: 'medium',
      category: 'work',
      completed: false,
      createdAt: Date.now() + idx + 1,
      xpReward: 20,
    }));
    createdList.push(...stashTasks);

    const updatedTasks = [...createdList, ...tasks];
    setTasks(updatedTasks);
    setActiveTaskId(createdList[0].id);

    // If loops were identified during launchpad brain dump, store them
    if (data.createdLoops && data.createdLoops.length > 0) {
      setOpenLoops((prev) => [...data.createdLoops!, ...prev]);
    }

    // 4. Mark check-in & award +25 XP
    const todayStr = new Date().toISOString().split('T')[0];
    soundManager.playSuccess(settings.soundEnabled);
    soundManager.triggerHaptic(settings.hapticEnabled);
    launchConfetti();
    handleAwardXp(25, 'Ranní start (+25 XP)');

    setStats((prev) => {
      const isNewCheckIn = prev.lastCheckInDate !== todayStr;
      const newStreak = prev.streak === 0 ? 1 : isNewCheckIn ? prev.streak + 1 : prev.streak;
      return {
        ...prev,
        lastCheckInDate: todayStr,
        lastActiveDate: todayStr,
        streak: newStreak,
        streakStatus: 'active',
      };
    });

    setIsDayClosed(false);
    setIsMorningNavigatorOpen(false);
    setActiveTab('today');
  };

  const handleCloseDay = () => {
    const today = new Date().toISOString().split('T')[0];
    const activeLoopsCount = openLoops.filter((l) => l.status === 'open').length;
    const summary: DailySummary = {
      date: today,
      completedTasksCount: stats.tasksCompletedToday,
      openLoopsCount: activeLoopsCount,
      xpEarnedToday: stats.xp,
      closedAt: Date.now(),
    };

    const updatedSummaries = {
      ...dailySummaries,
      [today]: summary,
    };
    setDailySummaries(updatedSummaries);
    setIsDayClosed(true);
    setIsEveningRecapOpen(false);

    soundManager.playSuccess(settings.soundEnabled);
    soundManager.triggerHaptic(settings.hapticEnabled);
    triggerXpToast(25, 'Den uzavřen! Hlava je čistá.');
    handleAwardXp(25, 'Večerní uzavření dne (+25 XP)');
  };

  const handleStartNewDay = () => {
    handlePlayClick();
    setIsMorningNavigatorOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = stats.lastCheckInDate === todayStr;

  const handlePerformCheckIn = () => {
    handlePlayClick();
    setIsMorningNavigatorOpen(true);
  };

  // Continuous Autopilot Task Completion Flow
  const handleCompleteTask = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    soundManager.playSuccess(settings.soundEnabled);
    soundManager.triggerHaptic(settings.hapticEnabled);
    launchConfetti();

    // Mark task completed
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: true, completedAt: Date.now() } : t
    );
    setTasks(updatedTasks);

    const earnedXp = targetTask.xpReward || 30;
    triggerXpToast(earnedXp, `Dokončeno: "${targetTask.title.slice(0, 20)}..."`);

    // Update stats & badges
    const today = new Date().toISOString().split('T')[0];
    const isConsecutive =
      stats.lastActiveDate &&
      new Date(today).getTime() - new Date(stats.lastActiveDate).getTime() <=
        86400000 * 2;

    const newStreak =
      stats.lastActiveDate === today
        ? stats.streak
        : isConsecutive
        ? stats.streak + 1
        : 1;

    const newTotalXp = stats.xp + earnedXp;
    const newLevel = Math.floor(newTotalXp / 100) + 1;
    const newTasksCompletedToday = stats.tasksCompletedToday + 1;
    const newTotalTasksCompleted = stats.totalTasksCompleted + 1;

    if (newLevel > stats.level) {
      setTimeout(() => soundManager.playLevelUp(settings.soundEnabled), 400);
    }

    const newlyUnlockedBadges = [...stats.unlockedBadges];
    BADGES_LIST.forEach((b) => {
      if (!newlyUnlockedBadges.includes(b.id)) {
        if (b.reqType === 'completed' && newTotalTasksCompleted >= b.reqValue) {
          newlyUnlockedBadges.push(b.id);
        } else if (b.reqType === 'streak' && newStreak >= b.reqValue) {
          newlyUnlockedBadges.push(b.id);
        } else if (b.reqType === 'level' && newLevel >= b.reqValue) {
          newlyUnlockedBadges.push(b.id);
        } else if (b.reqType === 'xp' && newTotalXp >= b.reqValue) {
          newlyUnlockedBadges.push(b.id);
        }
      }
    });

    setStats({
      ...stats,
      xp: newTotalXp,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: today,
      tasksCompletedToday: newTasksCompletedToday,
      totalTasksCompleted: newTotalTasksCompleted,
      unlockedBadges: newlyUnlockedBadges,
    });

    // Record freemium completion and check 3-task momentum limit
    const updatedFreemium = recordTaskCompletion();
    setFreemium(updatedFreemium);

    if (!updatedFreemium.isPro && updatedFreemium.completedTasksCount >= 3) {
      setTimeout(() => {
        setIsPaywallOpen(true);
      }, 700);
    }

    // Auto-advance to next queued task in Autopilot queue!
    const remainingPending = updatedTasks.filter((t) => !t.completed);
    if (remainingPending.length > 0) {
      const nextMatching = remainingPending.find(
        (t) =>
          t.energyLevel === currentCapacity ||
          (currentCapacity === 'low' && t.estimatedMinutes <= 2)
      );
      setActiveTaskId(nextMatching ? nextMatching.id : remainingPending[0].id);
    } else {
      setActiveTaskId(null);
    }
  };

  const handleSkipTask = () => {
    if (!activeTask) return;
    const otherTasks = pendingTasks.filter((t) => t.id !== activeTask!.id);
    if (otherTasks.length > 0) {
      setActiveTaskId(otherTasks[0].id);
    }
  };

  const handleQuickAddTask = (title: string, energy: EnergyLevel) => {
    const newTask: Task = {
      id: `t-quick-${Date.now()}`,
      title,
      estimatedMinutes: energy === 'low' ? 2 : energy === 'medium' ? 10 : 25,
      energyLevel: energy,
      category: 'work',
      completed: false,
      createdAt: Date.now(),
      xpReward: 30,
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    setActiveTaskId(newTask.id);
  };

  const handleAddBulkTasks = (
    newTasksData: Omit<Task, 'id' | 'createdAt' | 'completed'>[]
  ) => {
    const createdTasks: Task[] = newTasksData.map((d, idx) => ({
      ...d,
      id: `t-bulk-${Date.now()}-${idx}`,
      completed: false,
      createdAt: Date.now() + idx,
    }));

    const updatedTasks = [...tasks, ...createdTasks];
    setTasks(updatedTasks);
    if (!activeTaskId && createdTasks.length > 0) {
      setActiveTaskId(createdTasks[0].id);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId && t.subtasks) {
        const updatedSubs = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    });
    setTasks(updatedTasks);
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const subs = t.subtasks || [];
        const newSub = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title,
          completed: false,
        };
        return { ...t, subtasks: [...subs, newSub] };
      }
      return t;
    });
    setTasks(updatedTasks);
  };

  const handleUpdateTaskSubtasks = (taskId: string, subtaskTitles: string[]) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const newSubs = subtaskTitles.map((title, idx) => ({
          id: `sub-dec-${Date.now()}-${idx}`,
          title,
          completed: false,
        }));
        return { ...t, subtasks: newSubs };
      }
      return t;
    });
    setTasks(updatedTasks);
  };

  const handleConfirmDecompose = (taskId: string, subtaskTitles: string[]) => {
    handleUpdateTaskSubtasks(taskId, subtaskTitles);
    soundManager.playSuccess(settings.soundEnabled);
    triggerXpToast(15, 'Rozsekano na 2min mikro-kroky!');
    handleAwardXp(15, 'Rozsekání na mikro-kroky (+15 XP)');
  };

  const handleTimerComplete = (minutes: number) => {
    const bonusXp = Math.max(10, Math.round(minutes * 5));
    handleAwardXp(bonusXp, `Časovač dokončen (${minutes} min fokusu)`);
    setStats((prev) => ({
      ...prev,
      totalFocusMinutes: prev.totalFocusMinutes + Math.round(minutes),
    }));
  };

  const handleToggleComplete = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    if (!target.completed) {
      handleCompleteTask(taskId);
    } else {
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, completed: false } : t))
      );
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const remaining = tasks.filter((t) => t.id !== taskId);
    setTasks(remaining);
    if (activeTaskId === taskId) {
      const remainingPending = remaining.filter((t) => !t.completed);
      setActiveTaskId(remainingPending.length > 0 ? remainingPending[0].id : null);
    }
  };

  const handleReorderTasks = (newOrderedTasks: Task[]) => {
    setTasks(newOrderedTasks);
    const firstPending = newOrderedTasks.find((t) => !t.completed);
    if (firstPending) {
      setActiveTaskId(firstPending.id);
    }
  };

  const handleResetAllData = () => {
    clearAllDataFromStorage();
    setTasks(DEFAULT_TASKS);
    setOpenLoops(DEFAULT_OPEN_LOOPS);
    setStats(INITIAL_STATS);
    setSettings(INITIAL_SETTINGS);
    setCurrentCapacity('low');
    setActiveTaskId(DEFAULT_TASKS[0].id);
    setIsStatsOpen(false);
    soundManager.playLevelUp(true);
  };

  const taskToDecompose = tasks.find((t) => t.id === decomposeTaskId) || null;

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex flex-col justify-between p-3 sm:p-4 bg-black text-white font-sans select-none">
      {/* Pristine Sticky Top Bar (Status Only: Brand & XP Badge) */}
      <Header
        stats={stats}
        isDayClosed={isDayClosed}
        onOpenMorningLaunchpad={handleStartNewDay}
        onOpenStats={() => {
          handlePlayClick();
          setIsStatsOpen(true);
        }}
        onOpenEveningRecap={() => {
          handlePlayClick();
          setIsEveningRecapOpen(true);
        }}
        recentXpGain={recentXpGain}
      />

      {/* Main Container Column */}
      <main className="flex-1 max-w-md w-full mx-auto flex flex-col min-h-0 py-0.5 overflow-hidden">
        {/* ========================================================================= */}
        {/* TAB 1: TODAY AUTOPILOT FLOW */}
        {/* ========================================================================= */}
        {activeTab === 'today' && (
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            {isDayClosed ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 text-center space-y-4 shadow-xl">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                    Den uzavřen · Klidná mysl
                  </span>
                  <h2 className="text-base font-black text-white">
                    Tvoje pracovní paměť je v bezpečí
                  </h2>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                    Dnešní postup je bezpečně uložen.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleStartNewDay}
                    className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sprout className="w-4 h-4 stroke-[2.5]" />
                    <span>Začít nový den</span>
                  </button>
                </div>
              </div>
            ) : (
              <TodayFlow
                activeTask={activeTask}
                upNextTasks={upNextTasks}
                onCompleteTask={handleCompleteTask}
                onSkipTask={handleSkipTask}
                onParkTask={handleParkTask}
                onDropTask={handleDropTask}
                onSelectTask={(id) => {
                  handlePlayClick();
                  setActiveTaskId(id);
                }}
                onDecomposeTask={(id) => {
                  handlePlayClick();
                  setDecomposeTaskId(id);
                }}
                onUpdateTaskSubtasks={handleUpdateTaskSubtasks}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={handleToggleSubtask}
                onQuickAddTask={handleQuickAddTask}
                onOpenDumpModal={() => setIsBulkDumpOpen(true)}
                onPlayClick={handlePlayClick}
                onTick={handleTick}
                onTimerComplete={handleTimerComplete}
                onAwardXp={handleAwardXp}
                currentCapacity={currentCapacity}
                soundEnabled={settings.soundEnabled}
                hapticEnabled={settings.hapticEnabled}
                totalPendingCount={pendingTasks.length}
                isPro={freemium.isPro}
                completedTasksCountToday={freemium.completedTasksCount}
                onOpenPaywall={() => setIsPaywallOpen(true)}
                onOpenRestoreLicense={() => setIsRestoreLicenseOpen(true)}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BACKLOG & INBOX (Includes Daily Tasks & Open Loops) */}
        {/* ========================================================================= */}
        {activeTab === 'backlog' && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
            <BacklogView
              tasks={tasks}
              activeTaskId={activeTask?.id || null}
              openLoops={openLoops}
              isPro={freemium.isPro}
              onOpenPaywall={() => setIsPaywallOpen(true)}
              onSelectActiveTask={(id) => {
                setActiveTaskId(id);
                setActiveTab('today');
              }}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onAddBulkTasks={handleAddBulkTasks}
              onReorderTasks={handleReorderTasks}
              onDecomposeTask={(id) => {
                handlePlayClick();
                setDecomposeTaskId(id);
              }}
              onAddOpenLoop={handleAddOpenLoop}
              onCompleteOpenLoop={handleCompleteOpenLoop}
              onDropOpenLoop={handleDropOpenLoop}
              onPromoteLoopToToday={handlePromoteLoopToToday}
              onPlayClick={handlePlayClick}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TOOLKIT (Calm Utilities: Meal Prep & Spending Pause) */}
        {/* ========================================================================= */}
        {activeTab === 'toolkit' && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
            <ToolkitView
              currentCapacity={currentCapacity}
              customMeals={customMeals}
              spendingPauses={spendingPauses}
              isPro={freemium.isPro}
              onOpenPaywall={() => setIsPaywallOpen(true)}
              onAddCustomMeal={handleAddCustomMeal}
              onQueueMealTask={handleQueueMealTask}
              onCookMeal={handleCookMeal}
              onAddSpendingPause={handleAddSpendingPause}
              onResolveSpendingPause={handleResolveSpendingPause}
              onPlayClick={handlePlayClick}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SOS STATE & RECHARGE */}
        {/* ========================================================================= */}
        {activeTab === 'sos' && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
            <SosView
              onAwardXp={handleAwardXp}
              onSetCapacity={(cap) => setCurrentCapacity(cap)}
              onAddQuickTask={(taskData) => {
                const newTask: Task = {
                  ...taskData,
                  id: `t-fuel-${Date.now()}`,
                  completed: false,
                  createdAt: Date.now(),
                };
                setTasks([newTask, ...tasks]);
                setActiveTaskId(newTask.id);
              }}
              onNavigateToToday={() => setActiveTab('today')}
              soundEnabled={settings.soundEnabled}
              hapticEnabled={settings.hapticEnabled}
              onPlayClick={handlePlayClick}
            />
          </div>
        )}
      </main>

      {/* 4-Tab Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        pendingCount={pendingTasks.length}
        onOpenQuickDump={() => setIsBulkDumpOpen(true)}
        onPlayClick={handlePlayClick}
      />

      {/* Morning Day Navigator ("ADHD Launchpad") Modal */}
      <MorningNavigator
        isOpen={isMorningNavigatorOpen}
        onClose={() => setIsMorningNavigatorOpen(false)}
        openLoops={openLoops}
        onCompleteOpenLoop={handleCompleteOpenLoop}
        onLaunchFlow={handleLaunchMorningFlow}
        onPlayClick={handlePlayClick}
        currentStreak={stats.streak}
      />

      {/* Stats Drawer */}
      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        settings={settings}
        onToggleSound={handleToggleSound}
        onToggleHaptics={handleToggleHaptic}
        onPlayClick={handlePlayClick}
        onTriggerPwaInstall={() => setIsPwaInstallOpen(true)}
        onResetAllData={handleResetAllData}
        isPro={freemium.isPro}
        licenseKey={freemium.licenseKey}
        onOpenPaywall={() => setIsPaywallOpen(true)}
        onOpenRestoreLicense={() => setIsRestoreLicenseOpen(true)}
        onOpenPdfVault={() => setIsPdfVaultModalOpen(true)}
      />

      {/* Open Loops Drawer (LIFE Layer) */}
      <OpenLoopsDrawer
        isOpen={isLoopsDrawerOpen}
        onClose={() => setIsLoopsDrawerOpen(false)}
        openLoops={openLoops}
        onAddOpenLoop={handleAddOpenLoop}
        onCompleteOpenLoop={handleCompleteOpenLoop}
        onDropOpenLoop={handleDropOpenLoop}
        onPromoteLoopToToday={handlePromoteLoopToToday}
        onPlayClick={handlePlayClick}
      />

      {/* Evening Recap Modal */}
      <EveningRecapModal
        isOpen={isEveningRecapOpen}
        onClose={() => setIsEveningRecapOpen(false)}
        onCloseDay={handleCloseDay}
        completedTasksCountToday={stats.tasksCompletedToday}
        openLoops={openLoops}
        stats={stats}
        spendingPauses={spendingPauses}
        onPlayClick={handlePlayClick}
      />

      {/* Bulk Dump Modal */}
      <BulkDumpModal
        isOpen={isBulkDumpOpen}
        onClose={() => setIsBulkDumpOpen(false)}
        onAddBulkTasks={handleAddBulkTasks}
        onPlayClick={handlePlayClick}
      />

      {/* Step Decomposer Modal (Manual Split) */}
      <StepDecomposer
        isOpen={decomposeTaskId !== null}
        onClose={() => setDecomposeTaskId(null)}
        task={taskToDecompose}
        onConfirmDecompose={handleConfirmDecompose}
        onPlayClick={handlePlayClick}
      />

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isPwaInstallOpen}
        onClose={() => setIsPwaInstallOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Freemium Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onOpenRestoreKey={() => setIsRestoreLicenseOpen(true)}
        onPlayClick={handlePlayClick}
        completedTasksCount={freemium.completedTasksCount}
      />

      {/* Restore License Key Modal */}
      <RestoreLicenseModal
        isOpen={isRestoreLicenseOpen}
        onClose={() => setIsRestoreLicenseOpen(false)}
        onSuccessUnlock={() => {
          const updated = getFreemiumState();
          setFreemium(updated);
          soundManager.playLevelUp(settings.soundEnabled);
          launchConfetti();
          triggerXpToast(100, 'Lifetime Pro Activated (+100 XP)!');
          handleAwardXp(100, 'Lifetime Pro Activation (+100 XP)');
        }}
        onPlayClick={handlePlayClick}
      />

      {/* PDF Vault Download Modal (Order Bump) */}
      <PdfVaultModal
        isOpen={isPdfVaultModalOpen}
        onClose={() => setIsPdfVaultModalOpen(false)}
      />
    </div>
  );
};
