import { GEMINI_KEY } from '../constants.js';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`;

const GEMINI_SYSTEM = `You are a Google Maps travel planner. Return ONLY a raw JSON array — no markdown fences, no explanation, nothing else.

Use EXACTLY this schema for every element:
{"id":"ai1","name":"Place Name","category":"scenic","lat":64.32,"lng":-20.12,"rating":4.7,"desc":"Short 1-2 sentence description.","seed":101}

Rules:
- "id": unique string, "ai1" through "aiN"
- "category": must be exactly one of: scenic | restaurant | hotel
- "lat"/"lng": accurate real-world decimal coordinates
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
  if (start !== -1 && end !== -1) json = json.slice(start, end + 1);
  const places = JSON.parse(json);
  return places.map((p, i) => ({ ...p, id: `ai-${Date.now()}-${i}`, seed: (i + 1) * 97 + 3 }));
}

export async function callGemini(history) {
  const contents = history.map(m => ({
    role:  m.role,
    parts: [{ text: m.text }],
  }));
  const resp = await fetch(GEMINI_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: GEMINI_SYSTEM }] },
      contents,
    }),
  });
  if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}`);
  const data = await resp.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  return parsePlaces(raw);
}
