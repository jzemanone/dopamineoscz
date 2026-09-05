import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Stripe lazily / safely
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

// API Health route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Stripe Checkout creation endpoint
app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { product, origin, landingPage = '/' } = req.body;
    const reqOrigin = origin || `${req.protocol}://${req.get('host')}`;

    // Server-side strict allow-list pricing
    let lineItemName = 'Dopamine OS — Lifetime Access';
    let lineItemDescription = 'Energy-matched tasks, XP, Brain Dump & 2-min focus engine';
    let unitAmountCents = 2700; // $27.00

    if (product === 'base_with_vault') {
      lineItemName = 'Dopamine OS + ADHD Prompt Vault Bundle';
      lineItemDescription = 'Dopamine OS PWA + 50 Copy-Paste ChatGPT Prompts for ADHD brains';
      unitAmountCents = 4400; // $44.00 ($27 + $17)
    } else if (product !== 'base') {
      return res.status(400).json({ error: 'Invalid product key provided' });
    }

    const stripe = getStripe();

    if (!stripe) {
      // Graceful fallback for preview / demo mode when STRIPE_SECRET_KEY is not configured
      console.log(`[Stripe Checkout Demo] Product: ${product}, Total: $${unitAmountCents / 100}`);
      const demoSuccessUrl = `${reqOrigin}/purchase-complete?product=${product}&demo=true`;
      return res.json({ url: demoSuccessUrl });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: lineItemName,
              description: lineItemDescription,
            },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        product_key: product,
        landing_page: landingPage,
      },
      success_url: `${reqOrigin}/purchase-complete?session_id={CHECKOUT_SESSION_ID}&product=${product}`,
      cancel_url: `${reqOrigin}${landingPage}`,
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to create checkout session' });
  }
});

// Gemini LLM Decompose endpoint
app.post('/api/decompose', async (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
  try {
    const { task, energyLevel, mode = 'BALANCED_FLOW', simpler = false } = req.body || {};
    if (!task || typeof task !== 'string' || !task.trim()) {
      return res.status(400).json({ error: 'Task string is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Normalize biological energy level
    const rawEnergy = String(energyLevel || mode || 'BALANCED_FLOW').toUpperCase();
    let normalizedEnergy: 'LOW_BATTERY' | 'BALANCED_FLOW' | 'PEAK_PERFORMANCE' = 'BALANCED_FLOW';
    if (rawEnergy.includes('LOW') || rawEnergy.includes('FREEZE') || rawEnergy.includes('SURVIVAL') || simpler) {
      normalizedEnergy = 'LOW_BATTERY';
    } else if (rawEnergy.includes('PEAK') || rawEnergy.includes('HIGH') || rawEnergy.includes('HYPERFOCUS')) {
      normalizedEnergy = 'PEAK_PERFORMANCE';
    }

    const prompt = `Uživatelský úkol: "${task.trim()}"\nÚroveň biologické energie uživatele: ${normalizedEnergy}\nRozpadni tento úkol na přesně 3 okamžitě proveditelné mikro-kroky v češtině pro člověka s těžkým ADHD.`;

    const systemPrompt = `Jsi nekompromisní asistent pro exekutivní funkce pro uživatele s těžkým ADHD.
Vždy odpovídej V ČEŠTINĚ a VŽDY UŽIVATELI TYKEJ.
Rozpadni úkol podle úrovně energie: ${normalizedEnergy}.

PŘÍSNÁ PRAVIDLA:
- ŽÁDNÉ psychologické rady (žádné 'zhluboka se nadechni', 'uprav postoj', 'připrav se bez hodnocení' - to je PŘÍSNĚ ZAKÁZÁNO).
- Každý krok MUSÍ být konkrétní fyzický pohyb těla nebo jeden klik v digitálním rozhraní v češtině.
- Pro LOW_BATTERY: Kroky musí být směšně jednoduché (např. 'Polož 1 hrnek do dřezu', 'Napiš doslova 3 slova').
- Pro BALANCED: Přímá exekuce (Otevři aplikaci -> První věta -> Odeslat).
- Pro PEAK: Okamžitý blok s nejvyšší pákou.

Vrať čistý JSON: { "steps": ["krok 1", "krok 2", "krok 3"], "category": "communication" | "chore" | "deep_work" | "fuel" }`;

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
      return res.json({
        steps: parsed.steps.slice(0, 3).map((s: any) => String(s).trim()),
        category: validCategories.includes(parsed.category) ? parsed.category : 'deep_work',
        source: 'gemini',
      });
    }

    return res.status(500).json({ error: 'Invalid response structure from Gemini' });
  } catch (err: any) {
    console.warn('[Express /api/decompose] Error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Failed to decompose task with LLM' });
  }
});

// Gemini LLM Brain Dump + Open Loops classifier
app.post('/api/classify-dump', async (req, res) => {
  try {
    const { rawText } = req.body || {};
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Raw ADHD Dump:\n"""\n${rawText.trim()}\n"""`,
      config: {
        systemInstruction: `You are an ADHD executive function co-pilot for "Dopamine OS". Analyze raw dump text and separate it into:
1. Immediate tasks (warm-up, needle-mover, maintenance)
2. Open Loops: Commitments involving other people (names/contacts like Petr, Mom, Client, Boss) or specific deadlines (e.g., "by Friday", "tomorrow").

Return STRICT JSON:
{
  "tasks": [
    { "title": "string", "energyLevel": "low" | "medium" | "high", "estimatedMinutes": number, "category": "work" | "personal" | "admin" | "quick-fix" | "health" }
  ],
  "openLoops": [
    { "title": "string", "person": "string or null", "dueDate": "YYYY-MM-DD or null", "softUrgency": "today" | "tomorrow" | "few_days" | "this_week" | "someday" }
  ]
}`,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      openLoops: Array.isArray(parsed.openLoops) ? parsed.openLoops : [],
      source: 'gemini',
    });
  } catch (err: any) {
    console.warn('[Express /api/classify-dump] Error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Failed to classify dump' });
  }
});

async function startServer() {
  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dopamine OS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
