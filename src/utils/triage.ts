import { Task, EnergyLevel, TaskCategory, OpenLoop } from '../types';

export interface TriagedTasksResult {
  warmUp: Task[];
  needleMover: Task[];
  maintenance: Task[];
  orderedTasks: Task[];
  extractedLoops: OpenLoop[];
}

// Keywords identifying warm-up / micro dopaminergic starters
const WARM_UP_KEYWORDS = [
  'water', 'drink', 'hydrate', 'stretch', 'shoes', 'breathe', 'vitamins', 'coffee', 'tea',
  'music', 'spotify', 'stand', 'walk', 'posture', 'glasses', 'tabs', 'quick', 'open', 'start',
  'desk', 'reply to 1', 'ping', 'check phone', 'prepare workspace', 'wash face'
];

// Keywords identifying core high-impact needle movers
const NEEDLE_MOVER_KEYWORDS = [
  'write', 'code', 'build', 'draft', 'design', 'proposal', 'project', 'client', 'pitch',
  'study', 'exam', 'presentation', 'slides', 'report', 'analyze', 'feature', 'refactor',
  'finish', 'complete', 'review contract', 'tax', 'budget', 'launch', 'gym', 'workout'
];

// Keywords identifying maintenance / administrative tasks
const MAINTENANCE_KEYWORDS = [
  'email', 'inbox', 'clean', 'trash', 'organize', 'file', 'downloads', 'schedule', 'calendar',
  'laundry', 'dishes', 'receipt', 'invoice', 'sort', 'tidy', 'groceries', 'order', 'message'
];

// Common person markers / relational tags in ADHD brain dumps
const PERSON_MARKERS = [
  'mámě', 'máma', 'tátovi', 'táta', 'petr', 'petrovi', 'honza', 'honzovi', 'klient', 'šéf',
  'jana', 'janě', 'tomáš', 'tomášovi', 'doktor', 'doktorovi', 'účetní', 'martin', 'martinovi',
  'lucie', 'evě', 'eva', 'kolega', 'kolegovi', 'dan', 'david', 'alena', 'lenka', 'máma', 'mámu',
  'mámy', 'táty', 'babička', 'babičce', 'klientovi', 'zákazník', 'zákazníkovi', 'terapeut',
  'partner', 'manželka', 'manžel'
];

// Time / Deadline indicators
const TIME_DEADLINE_KEYWORDS = [
  'do pátku', 'do pondělí', 'do zítra', 'dnes', 'zítra', 'tomorrow', 'today', 'friday',
  'do 15:00', 'do 18:00', 'příští týden', 'termín', 'deadline', 'urgent', 'hoří'
];

/**
 * Checks if a string contains another person tag or hard deadline
 */
export function detectLoopMetadata(text: string): { person?: string; dueDate?: string; softUrgency?: string; isLoop: boolean } {
  const lower = text.toLowerCase();
  
  // Detect Person
  let foundPerson: string | undefined = undefined;
  for (const marker of PERSON_MARKERS) {
    const regex = new RegExp(`\\b${marker}\\b`, 'i');
    if (regex.test(lower)) {
      foundPerson = marker.charAt(0).toUpperCase() + marker.slice(1);
      break;
    }
  }

  // Check explicit @mention syntax
  const atMatch = text.match(/@([a-zA-Z0-9_\u00C0-\u017F]+)/);
  if (atMatch && atMatch[1]) {
    foundPerson = atMatch[1];
  }

  // Detect Deadline / Urgency
  let dueDate: string | undefined = undefined;
  let softUrgency: string | undefined = undefined;

  if (lower.includes('dnes') || lower.includes('today')) {
    dueDate = new Date().toISOString().split('T')[0];
    softUrgency = 'today';
  } else if (lower.includes('zítra') || lower.includes('tomorrow') || lower.includes('do zítra')) {
    dueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    softUrgency = 'tomorrow';
  } else if (TIME_DEADLINE_KEYWORDS.some((kw) => lower.includes(kw))) {
    softUrgency = 'few_days';
  }

  const isLoop = Boolean(foundPerson || dueDate || softUrgency);
  return { person: foundPerson, dueDate, softUrgency, isLoop };
}

export function autoTriageRawInput(
  rawText: string,
  targetEnergy: EnergyLevel = 'medium'
): TriagedTasksResult {
  const lines = rawText
    .split(/\n|,|;/)
    .map((l) => l.trim().replace(/^[-*•\d.)\]\s]+/, ''))
    .filter((l) => l.length > 1);

  if (lines.length === 0) {
    return { warmUp: [], needleMover: [], maintenance: [], orderedTasks: [], extractedLoops: [] };
  }

  const extractedLoops: OpenLoop[] = [];

  const rawTasks: Array<{ title: string; categoryType: 'warm-up' | 'needle-mover' | 'maintenance'; score: number; meta: ReturnType<typeof detectLoopMetadata> }> = lines.map((line) => {
    const lower = line.toLowerCase();
    const meta = detectLoopMetadata(line);

    if (meta.isLoop) {
      extractedLoops.push({
        id: `loop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: line,
        person: meta.person,
        dueDate: meta.dueDate,
        softUrgency: meta.softUrgency || 'this_week',
        createdAt: Date.now(),
        parkedCount: 0,
        status: 'open',
        sourceType: 'brain_dump',
      });
    }
    
    // Check warm up
    const isWarmUp = WARM_UP_KEYWORDS.some((kw) => lower.includes(kw));
    const isNeedle = NEEDLE_MOVER_KEYWORDS.some((kw) => lower.includes(kw)) || Boolean(meta.dueDate);
    const isMaint = MAINTENANCE_KEYWORDS.some((kw) => lower.includes(kw));

    if (isWarmUp && !isNeedle) {
      return { title: line, categoryType: 'warm-up', score: 1, meta };
    }
    if (isNeedle) {
      return { title: line, categoryType: 'needle-mover', score: 3, meta };
    }
    if (isMaint) {
      return { title: line, categoryType: 'maintenance', score: 2, meta };
    }

    // Heuristic by length / words
    if (line.length <= 25) {
      return { title: line, categoryType: 'warm-up', score: 1, meta };
    }
    return { title: line, categoryType: 'needle-mover', score: 3, meta };
  });

  // Ensure we have at least 1 warm up, 1 needle mover if multiple items exist
  const warmUpItems: Task[] = [];
  const needleMoverItems: Task[] = [];
  const maintenanceItems: Task[] = [];

  // Group
  rawTasks.forEach((item, idx) => {
    const timestamp = Date.now() + idx * 10;
    if (item.categoryType === 'warm-up') {
      warmUpItems.push({
        id: `t-warm-${timestamp}`,
        title: item.title,
        estimatedMinutes: 2,
        energyLevel: 'low',
        category: 'quick-fix',
        completed: false,
        createdAt: timestamp,
        xpReward: 25,
        parkedCount: 0,
        person: item.meta.person,
        dueDate: item.meta.dueDate,
      });
    } else if (item.categoryType === 'needle-mover') {
      needleMoverItems.push({
        id: `t-needle-${timestamp}`,
        title: item.title,
        estimatedMinutes: targetEnergy === 'high' ? 25 : targetEnergy === 'medium' ? 15 : 10,
        energyLevel: targetEnergy,
        category: 'work',
        completed: false,
        createdAt: timestamp,
        xpReward: 50,
        parkedCount: 0,
        person: item.meta.person,
        dueDate: item.meta.dueDate,
        isDeadlinePromoted: Boolean(item.meta.dueDate),
      });
    } else {
      maintenanceItems.push({
        id: `t-maint-${timestamp}`,
        title: item.title,
        estimatedMinutes: 5,
        energyLevel: 'medium',
        category: 'admin',
        completed: false,
        createdAt: timestamp,
        xpReward: 35,
        parkedCount: 0,
        person: item.meta.person,
        dueDate: item.meta.dueDate,
      });
    }
  });

  // If user only entered needle movers or only maintenance, make the first one a warm up if there are > 1 tasks
  if (warmUpItems.length === 0 && needleMoverItems.length > 1) {
    const first = needleMoverItems.shift()!;
    warmUpItems.push({
      ...first,
      estimatedMinutes: 3,
      energyLevel: 'low',
      category: 'quick-fix',
      xpReward: 30,
    });
  }

  // Final continuous ADHD timeline sequence: 1. Warm-Up -> 2. Needle Mover(s) -> 3. Maintenance / Quick Wins
  const orderedTasks: Task[] = [
    ...warmUpItems,
    ...needleMoverItems,
    ...maintenanceItems,
  ];

  return {
    warmUp: warmUpItems,
    needleMover: needleMoverItems,
    maintenance: maintenanceItems,
    orderedTasks,
    extractedLoops,
  };
}

/**
 * Sorts pending tasks with Deadline-Aware promotion for the LIFE layer.
 * Any task with isDeadlinePromoted or dueDate within <= 48h is bumped to the top of Needle Movers!
 */
export function autoTriageTaskList(tasks: Task[]): Task[] {
  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const now = Date.now();
  const fortyEightHoursMs = 48 * 3600 * 1000;

  // Deadline Promoted items (urgent due dates < 48 hours or isDeadlinePromoted flag)
  const deadlinePromoted: Task[] = [];
  const standardPending: Task[] = [];

  pending.forEach((t) => {
    let isUrgent = t.isDeadlinePromoted;
    if (!isUrgent && t.dueDate) {
      const dueTime = new Date(t.dueDate).getTime();
      if (!isNaN(dueTime) && dueTime - now <= fortyEightHoursMs) {
        isUrgent = true;
      }
    }
    if (isUrgent) {
      deadlinePromoted.push(t);
    } else {
      standardPending.push(t);
    }
  });

  // Separate standard pending into warm-ups, needle movers, quick wins
  const warmUps = standardPending.filter((t) => t.energyLevel === 'low' || t.estimatedMinutes <= 3);
  const needleMovers = standardPending.filter((t) => t.energyLevel === 'high' || (t.energyLevel === 'medium' && t.estimatedMinutes > 10));
  const quickWins = standardPending.filter((t) => !warmUps.includes(t) && !needleMovers.includes(t));

  // Sequence: Warm-Up -> [Deadline-Promoted Loops & Needle Movers] -> Standard Needle Movers -> Quick Wins -> Completed
  return [
    ...warmUps,
    ...deadlinePromoted,
    ...needleMovers,
    ...quickWins,
    ...completed,
  ];
}
