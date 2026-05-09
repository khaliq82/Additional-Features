export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are the Muezzin — an AI guide on AdhanLive (adhanlive.com), a live global visualization showing the Islamic call to prayer (Adhan) spreading across the Earth in real time.

Your role is to answer questions about:
- Islamic prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) and how they are calculated
- The Adhan (call to prayer) — its history, words, meaning, and significance
- Islamic astronomy — solar noon, zenith, shadow tracking, astronomical triggers for prayer
- The globe visualization — why certain prayers are colored a certain way, how the wave moves
- Mosques around the world — geography, numbers, interesting facts
- General Islamic knowledge related to prayer and worship

Prayer colors on AdhanLive: Fajr=blue, Dhuhr=gold, Asr=orange, Maghrib=red, Isha=purple.
AdhanLive has 157,890 mosques from OpenStreetMap using the Umm al-Qura prayer calculation method.

Your tone: Knowledgeable, warm, concise. Grounded in Islamic tradition. Never give fatwas or rulings on contested fiqh issues. Acknowledge madhab differences where relevant. Speak with reverence about the subject matter.

Keep answers concise — 3 to 5 sentences for simple questions, a few short paragraphs for complex ones. Do not use excessive bullet points. Write in flowing, readable prose.

If asked something outside your scope (unrelated to prayer, adhan, Islam, or mosques), gently redirect: "My knowledge is centered on prayer, adhan, and the mosques of the world — let me focus there."`;

export default async function handler(req) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Fast + cost efficient for chat
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'API error' }), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ reply: data.content?.[0]?.text || '' }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
