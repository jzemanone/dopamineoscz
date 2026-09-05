import { GoogleGenAI } from '@google/genai';

export interface DecomposeRequest {
  task: string;
  energyLevel?: 'LOW_BATTERY' | 'BALANCED_FLOW' | 'PEAK_PERFORMANCE' | string;
  mode?: string;
}

export interface DecomposeResponse {
  steps: string[];
  category: 'communication' | 'chore' | 'deep_work' | 'fuel' | 'physical' | 'digital' | 'admin';
  source?: 'gemini' | 'heuristic_fallback';
}

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function normalizeEnergy(val?: string): 'LOW_BATTERY' | 'BALANCED_FLOW' | 'PEAK_PERFORMANCE' {
  if (!val) return 'BALANCED_FLOW';
  const u = val.toUpperCase();
  if (u.includes('LOW') || u.includes('FREEZE') || u.includes('SURVIVAL')) return 'LOW_BATTERY';
  if (u.includes('PEAK') || u.includes('HIGH') || u.includes('HYPERFOCUS')) return 'PEAK_PERFORMANCE';
  return 'BALANCED_FLOW';
}

export async function processDecomposeTask(
  task: string,
  energyParam: string = 'BALANCED_FLOW'
): Promise<DecomposeResponse> {
  const ai = getAI();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const energyLevel = normalizeEnergy(energyParam);
  const prompt = `User Task: "${task}"\nUser Energy Level: ${energyLevel}\nBreak this down into exactly 3 executable micro-steps for ADHD execution.`;

  const systemPrompt = `You are a strict, no-nonsense executive function copilot for severe ADHD.
Break down the task based on the user's energy level: ${energyLevel}.

STRICT FORMATTING RULES:
- ZERO psychological advice ('change posture', 'prepare with zero judgment' are STRICTLY FORBIDDEN).
- Every step MUST be a physical body motion or a direct digital UI click.
- For LOW_BATTERY: Make steps ridiculously easy (e.g., 'Put 1 cup in sink', 'Type literally 3 words').
- For BALANCED: Direct execution (Open app -> First sentence -> Send).
- For PEAK: Immediate high-value block.

Return pure JSON: { "steps": ["string", "string", "string"], "category": "communication" | "chore" | "deep_work" | "fuel" }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const text = response.text || '';
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed.steps) && parsed.steps.length >= 3) {
    const validCategories = ['communication', 'chore', 'deep_work', 'fuel', 'physical', 'digital', 'admin'];
    return {
      steps: parsed.steps.slice(0, 3).map((s: any) => String(s).trim()),
      category: validCategories.includes(parsed.category) ? parsed.category : 'deep_work',
      source: 'gemini',
    };
  }

  throw new Error('Invalid schema received from Gemini model');
}

// Vercel Serverless / Edge Function Handler
export default async function handler(req: any, res: any) {
  // CORS & Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { task, energyLevel, mode } = req.body || {};
    if (!task || typeof task !== 'string' || !task.trim()) {
      return res.status(400).json({ error: 'Task string is required.' });
    }

    const energy = energyLevel || mode || 'BALANCED_FLOW';
    const result = await processDecomposeTask(task.trim(), energy);
    return res.status(200).json(result);
  } catch (err: any) {
    console.warn('[Vercel Decompose Edge] Falling back due to:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to decompose with Gemini',
    });
  }
}
