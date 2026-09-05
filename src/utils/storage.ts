import { Task, UserStats, AppSettings, FocusFlowState, EnergyLevel, INITIAL_STATS, INITIAL_SETTINGS, MealIdea, OpenLoop, SpendingPause } from '../types';

export const UNIFIED_STORAGE_KEY = 'focus_flow_v3';
export const CUSTOM_MEALS_KEY = 'focus_custom_meals';
export const OPEN_LOOPS_KEY = 'focus_open_loops_v1';
export const SPENDING_PAUSES_KEY = 'focus_spending_pauses_v1';

const LEGACY_STORAGE_KEYS = {
  V2: 'focus_flow_v2',
  PREV_UNIFIED: 'focus_flow_state',
  TASKS: 'focusflow_tasks_v2',
  STATS: 'focusflow_stats_v2',
  SETTINGS: 'focusflow_settings_v2',
  ACTIVE_TASK_ID: 'focusflow_active_task_id_v2',
};

// Initial sample Open Loops for LIFE layer continuity
export const DAILY_SUMMARIES_KEY = 'focus_daily_summaries_v1';

export const DEFAULT_OPEN_LOOPS: OpenLoop[] = [
  {
    id: 'loop-1',
    title: 'Reply to Peter regarding the proposal',
    person: 'Peter',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    softUrgency: 'tomorrow',
    createdAt: Date.now() - 86400000,
    parkedCount: 1,
    status: 'open',
    sourceType: 'brain_dump',
    notes: 'Just 2 sentences and confirming the timeline.',
  },
  {
    id: 'loop-2',
    title: 'Call mom this weekend',
    person: 'Mom',
    softUrgency: 'this_week',
    createdAt: Date.now() - 172800000,
    parkedCount: 0,
    status: 'open',
    sourceType: 'manual',
  },
];

// Initial default tasks if none exist
export const DEFAULT_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Reply to 1 priority message or email',
    estimatedMinutes: 2,
    energyLevel: 'low',
    category: 'work',
    completed: false,
    createdAt: Date.now() - 3600000,
    xpReward: 30,
    notes: 'Keep it brief - 3 sentences max.',
    parkedCount: 0,
  },
  {
    id: 't-2',
    title: 'Hydrate & stretch shoulders (2 min win)',
    estimatedMinutes: 2,
    energyLevel: 'low',
    category: 'health',
    completed: false,
    createdAt: Date.now() - 3000000,
    xpReward: 25,
    parkedCount: 0,
  },
  {
    id: 't-3',
    title: 'Review & clear 5 download files',
    estimatedMinutes: 5,
    energyLevel: 'medium',
    category: 'admin',
    completed: false,
    createdAt: Date.now() - 2000000,
    xpReward: 45,
    parkedCount: 0,
  },
  {
    id: 't-4',
    title: 'Draft key paragraph for focus goal',
    estimatedMinutes: 15,
    energyLevel: 'high',
    category: 'work',
    completed: false,
    createdAt: Date.now() - 1000000,
    xpReward: 90,
    parkedCount: 0,
  },
];

export const INITIAL_APP_STATE: FocusFlowState = {
  tasks: DEFAULT_TASKS,
  openLoops: DEFAULT_OPEN_LOOPS,
  stats: INITIAL_STATS,
  settings: INITIAL_SETTINGS,
  currentCapacity: 'low',
  activeTaskId: 't-1',
  lastCheckInDate: '',
};

export function loadAppState(): FocusFlowState {
  if (typeof window === 'undefined') return INITIAL_APP_STATE;
  try {
    const raw = localStorage.getItem(UNIFIED_STORAGE_KEY);
    if (raw) {
      const parsed: FocusFlowState = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];

      // Handle daily streak & Streak Forgiveness (anti-shame mechanics)
      const stats: UserStats = {
        ...INITIAL_STATS,
        ...(parsed.stats || {}),
      };

      if (stats.lastActiveDate !== today) {
        const last = new Date(stats.lastActiveDate || today);
        const curr = new Date(today);
        const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          // Consecutive active day
          stats.streakStatus = 'active';
        } else if (diffDays === 2) {
          // Missed 1 day -> check weekly streak freeze or 1-day grace period
          const daysSinceFreeze = stats.lastStreakFreezeDate
            ? Math.round((curr.getTime() - new Date(stats.lastStreakFreezeDate).getTime()) / (1000 * 3600 * 24))
            : 99;

          if (stats.streak > 0 && (stats.streakFreezesAvailable > 0 || daysSinceFreeze >= 7)) {
            // Auto-trigger streak freeze protection!
            stats.streakStatus = 'frozen';
            stats.streakFreezesAvailable = 0;
            stats.lastStreakFreezeDate = today;
          } else if (stats.streak > 0) {
            // 1-day grace pause
            stats.streakStatus = 'paused';
          } else {
            stats.streakStatus = 'new_start';
            stats.streak = 0;
          }
        } else if (diffDays > 2) {
          // More than 2 days: Gentle quiet reset without shaming copy
          stats.streakStatus = 'new_start';
          stats.streak = 0;
          // Replenish weekly freeze
          stats.streakFreezesAvailable = 1;
        }

        stats.tasksCompletedToday = 0;
        stats.lastActiveDate = today;
      }

      // Load open loops
      let openLoops = parsed.openLoops;
      if (!openLoops || !Array.isArray(openLoops)) {
        const rawLoops = localStorage.getItem(OPEN_LOOPS_KEY);
        openLoops = rawLoops ? JSON.parse(rawLoops) : DEFAULT_OPEN_LOOPS;
      }

      // Load spending pauses
      let spendingPauses = parsed.spendingPauses;
      if (!spendingPauses || !Array.isArray(spendingPauses)) {
        const rawPauses = localStorage.getItem(SPENDING_PAUSES_KEY);
        spendingPauses = rawPauses ? JSON.parse(rawPauses) : [];
      }

      // Load custom meals
      let customMeals = parsed.customMeals;
      if (!customMeals || !Array.isArray(customMeals)) {
        const rawMeals = localStorage.getItem(CUSTOM_MEALS_KEY);
        customMeals = rawMeals ? JSON.parse(rawMeals) : [];
      }

      // Load daily summaries
      let dailySummaries = parsed.dailySummaries;
      if (!dailySummaries || typeof dailySummaries !== 'object') {
        const rawSummaries = localStorage.getItem(DAILY_SUMMARIES_KEY);
        dailySummaries = rawSummaries ? JSON.parse(rawSummaries) : {};
      }

      const isDayClosed = parsed.lastClosedDay === today;

      return {
        tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : DEFAULT_TASKS,
        openLoops,
        spendingPauses,
        customMeals,
        stats,
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
        currentCapacity: parsed.currentCapacity || 'low',
        activeTaskId: parsed.activeTaskId || null,
        lastCheckInDate: parsed.lastCheckInDate || '',
        lastClosedDay: parsed.lastClosedDay || '',
        isDayClosed,
        dailySummaries,
      };
    }

    // Migrate from v2 or legacy keys if available
    const v2Raw = localStorage.getItem(LEGACY_STORAGE_KEYS.V2) || localStorage.getItem(LEGACY_STORAGE_KEYS.PREV_UNIFIED);
    if (v2Raw) {
      try {
        const parsedV2: FocusFlowState = JSON.parse(v2Raw);
        const migratedState: FocusFlowState = {
          tasks: Array.isArray(parsedV2.tasks) && parsedV2.tasks.length > 0 ? parsedV2.tasks : DEFAULT_TASKS,
          openLoops: DEFAULT_OPEN_LOOPS,
          spendingPauses: [],
          customMeals: [],
          stats: { ...INITIAL_STATS, ...(parsedV2.stats || {}) },
          settings: { ...INITIAL_SETTINGS, ...(parsedV2.settings || {}) },
          currentCapacity: parsedV2.currentCapacity || 'low',
          activeTaskId: parsedV2.activeTaskId || (DEFAULT_TASKS[0]?.id ?? null),
          lastCheckInDate: parsedV2.lastCheckInDate || '',
        };
        saveAppState(migratedState);
        return migratedState;
      } catch (err) {
        console.warn('Could not parse v2 storage state', err);
      }
    }

    const legacyTasksRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.TASKS);
    const legacyStatsRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.STATS);
    const legacySettingsRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.SETTINGS);
    const legacyActiveTask = localStorage.getItem(LEGACY_STORAGE_KEYS.ACTIVE_TASK_ID);

    const migratedState: FocusFlowState = {
      tasks: legacyTasksRaw ? JSON.parse(legacyTasksRaw) : DEFAULT_TASKS,
      openLoops: DEFAULT_OPEN_LOOPS,
      spendingPauses: [],
      customMeals: [],
      stats: legacyStatsRaw ? JSON.parse(legacyStatsRaw) : INITIAL_STATS,
      settings: legacySettingsRaw ? JSON.parse(legacySettingsRaw) : INITIAL_SETTINGS,
      currentCapacity: 'low',
      activeTaskId: legacyActiveTask || (DEFAULT_TASKS[0]?.id ?? null),
      lastCheckInDate: '',
    };

    saveAppState(migratedState);
    return migratedState;
  } catch (e) {
    console.error('Failed to load app state', e);
    return INITIAL_APP_STATE;
  }
}

export function saveAppState(state: FocusFlowState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(state));
    if (state.openLoops) {
      localStorage.setItem(OPEN_LOOPS_KEY, JSON.stringify(state.openLoops));
    }
    if (state.spendingPauses) {
      localStorage.setItem(SPENDING_PAUSES_KEY, JSON.stringify(state.spendingPauses));
    }
    if (state.customMeals) {
      localStorage.setItem(CUSTOM_MEALS_KEY, JSON.stringify(state.customMeals));
    }
    if (state.dailySummaries) {
      localStorage.setItem(DAILY_SUMMARIES_KEY, JSON.stringify(state.dailySummaries));
    }
    // Also sync legacy keys for backward safety
    localStorage.setItem(LEGACY_STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    localStorage.setItem(LEGACY_STORAGE_KEYS.STATS, JSON.stringify(state.stats));
    localStorage.setItem(LEGACY_STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    if (state.activeTaskId) {
      localStorage.setItem(LEGACY_STORAGE_KEYS.ACTIVE_TASK_ID, state.activeTaskId);
    } else {
      localStorage.removeItem(LEGACY_STORAGE_KEYS.ACTIVE_TASK_ID);
    }
  } catch (e) {
    console.error('Failed to save unified app state', e);
  }
}

export function loadTasksFromStorage(): Task[] {
  return loadAppState().tasks;
}

export function saveTasksToStorage(tasks: Task[]): void {
  const current = loadAppState();
  saveAppState({ ...current, tasks });
}

export function loadOpenLoopsFromStorage(): OpenLoop[] {
  return loadAppState().openLoops || DEFAULT_OPEN_LOOPS;
}

export function saveOpenLoopsToStorage(openLoops: OpenLoop[]): void {
  const current = loadAppState();
  saveAppState({ ...current, openLoops });
}

export function loadSpendingPausesFromStorage(): SpendingPause[] {
  return loadAppState().spendingPauses || [];
}

export function saveSpendingPausesToStorage(spendingPauses: SpendingPause[]): void {
  const current = loadAppState();
  saveAppState({ ...current, spendingPauses });
}

export function loadStatsFromStorage(): UserStats {
  return loadAppState().stats;
}

export function saveStatsToStorage(stats: UserStats): void {
  const current = loadAppState();
  saveAppState({ ...current, stats });
}

export function loadSettingsFromStorage(): AppSettings {
  return loadAppState().settings;
}

export function saveSettingsToStorage(settings: AppSettings): void {
  const current = loadAppState();
  saveAppState({ ...current, settings });
}

export function loadActiveTaskIdFromStorage(): string | null {
  return loadAppState().activeTaskId;
}

export function saveActiveTaskIdToStorage(id: string | null): void {
  const current = loadAppState();
  saveAppState({ ...current, activeTaskId: id });
}

export function loadCustomMeals(): MealIdea[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_MEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load custom meals', e);
    return [];
  }
}

export function saveCustomMeals(meals: MealIdea[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_MEALS_KEY, JSON.stringify(meals));
  } catch (e) {
    console.error('Failed to save custom meals', e);
  }
}

export function clearAllDataFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(UNIFIED_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.TASKS);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.STATS);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.ACTIVE_TASK_ID);
    localStorage.removeItem('dopamine_pwa_dismissed');
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
}

export const PRIMARY_MASTER_KEY = 'DOPAMINE_FLOW_ACCESS';

export const MASTER_ACCESS_CODES = [
  'DOPAMINE_FLOW_ACCESS',
  'DOPAMINE-FLOW-ACCESS',
  'FOCUS_VIP_2026',
  'FOCUS-VIP-2026',
  'DOPAMINE-VIP-2026',
  'FOCUS-LIFETIME-ACCESS',
  'ADHD-FLOW-2026',
  'VIP2026',
  'LIFETIME2026',
];

export function checkHasAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dopamine_has_access') === 'true';
}

export function isValidAccessKey(key: string): boolean {
  if (!key) return false;
  const clean = key.toUpperCase().trim().replace(/\s+/g, '_');
  const cleanHyphen = key.toUpperCase().trim().replace(/_/g, '-');
  return (
    MASTER_ACCESS_CODES.includes(clean) ||
    MASTER_ACCESS_CODES.includes(cleanHyphen) ||
    clean === PRIMARY_MASTER_KEY
  );
}

export function unlockAccessWithKey(key: string, email?: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!isValidAccessKey(key)) return false;

  localStorage.setItem('dopamine_has_access', 'true');
  localStorage.setItem('focus_access_token', PRIMARY_MASTER_KEY);

  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    localStorage.setItem('dopamine_user_email', cleanEmail);
    const current = getPurchasedEmails();
    if (!current.includes(cleanEmail)) {
      current.push(cleanEmail);
      localStorage.setItem('dopamine_purchased_emails', JSON.stringify(current));
    }
  }

  return true;
}

export function processUrlAccessParam(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const accessKey = urlParams.get('access') || urlParams.get('key') || urlParams.get('token');

    if (accessKey && isValidAccessKey(accessKey)) {
      localStorage.setItem('dopamine_has_access', 'true');
      localStorage.setItem('focus_access_token', PRIMARY_MASTER_KEY);
      
      // Clean the URL parameter without reloading
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', '/app');
      }
      return true;
    }
  } catch (e) {
    console.error('Error processing URL access parameter:', e);
  }
  return false;
}

export function getPurchasedEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dopamine_purchased_emails');
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list;
  } catch (e) {
    return [];
  }
}

export function grantAccess(email?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dopamine_has_access', 'true');
  localStorage.setItem('focus_access_token', PRIMARY_MASTER_KEY);
  if (email) {
    const clean = email.toLowerCase().trim();
    localStorage.setItem('dopamine_user_email', clean);
    const current = getPurchasedEmails();
    if (!current.includes(clean)) {
      current.push(clean);
      localStorage.setItem('dopamine_purchased_emails', JSON.stringify(current));
    }
  }
}

export function verifyLicenseCredentials(email: string, code: string): boolean {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toUpperCase().trim();

  // Check master VIP access codes
  if (isValidAccessKey(cleanCode)) {
    return true;
  }

  // Check purchased emails list
  const purchased = getPurchasedEmails();
  if (purchased.includes(cleanEmail)) {
    return true;
  }

  // Check if current session email matches
  const sessionEmail = localStorage.getItem('dopamine_user_email');
  if (sessionEmail && sessionEmail.toLowerCase() === cleanEmail) {
    return true;
  }

  return false;
}

