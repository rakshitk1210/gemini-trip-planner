import { ANTHROPIC_KEY, GEMINI_API_KEY } from '../constants.js';

const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `You are a Google Maps travel planner. Return ONLY a raw JSON array — no markdown fences, no explanation, nothing else.

Use EXACTLY this schema for every element:
{"id":"ai1","name":"Place Name","category":"scenic","lat":64.32,"lng":-20.12,"rating":4.7,"desc":"Short 1-2 sentence description.","seed":101}

Rules:
- "id": unique string, "ai1" through "aiN"
- "category": must be exactly one of: scenic | restaurant | hotel
- "lat"/"lng": coordinates of the exact car-accessible location — a car park, visitor centre, trailhead, or named settlement. NEVER place pins on glaciers, icecaps, mountain summits, rivers, lakes, lava fields, or any terrain more than 1 km from a public road. Use the roadside viewpoint or car park coordinates, not the feature centre.
- "rating": number between 4.0 and 5.0
- "desc": 1-2 sentences max
- "seed": any integer
- For restaurant or hotel add: "price":"$"|"$$"|"$$$"
- Return 8-12 places total, mix categories to match the query
- Output the raw array only, starting with [ and ending with ]`;

export function parsePlaces(text) {
  let json = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = json.indexOf('[');
  const end   = json.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error(`No JSON array in response: ${text.slice(0, 120)}`);
  const places = JSON.parse(json.slice(start, end + 1));
  return places.map((p, i) => ({ ...p, id: `ai-${Date.now()}-${i}`, seed: (i + 1) * 97 + 3 }));
}

// history: [{ role: 'user'|'assistant', text: '...' }]
export async function callClaude(history) {
  const messages = history.map(m => ({
    role:    m.role,
    content: m.text,
  }));

  const resp = await fetch(CLAUDE_URL, {
    method:  'POST',
    headers: {
      'content-type':                              'application/json',
      'x-api-key':                                 ANTHROPIC_KEY,
      'anthropic-version':                         '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Claude HTTP ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = await resp.json();
  if (data.stop_reason === 'max_tokens') console.warn('Claude: response truncated at max_tokens');
  const raw = data.content?.[0]?.text ?? '[]';
  return parsePlaces(raw);
}

// Gemini fallback — same history shape, roles mapped to Gemini's user|model
export async function callGemini(history) {
  const contents = history.map(m => ({
    role:  m.role === 'assistant' ? 'model' : m.role,
    parts: [{ text: m.text }],
  }));

  const resp = await fetch(GEMINI_URL, {
    method:  'POST',
    headers: {
      'content-type':   'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Gemini HTTP ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = await resp.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  return parsePlaces(raw);
}

// Unified entry point: Claude primary, Gemini fallback.
export async function callAI(history) {
  try {
    return await callClaude(history);
  } catch (claudeErr) {
    console.warn('Claude failed, trying Gemini fallback:', claudeErr.message);
    if (!GEMINI_API_KEY) throw claudeErr;
    return await callGemini(history);
  }
}
