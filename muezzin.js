export const config = {
  runtime: 'nodejs',
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
AdhanLive has 157,890 mosques from OpenStreetMap. Prayer times are calculated using multiple methods depending on region — including Umm al-Qura (Arabian Peninsula), Muslim World League, ISNA (North America), Egyptian General Authority, and others. The appropriate method is applied based on each mosque's location.

Your tone: Knowledgeable, warm, concise. Grounded in Islamic tradition. Never give fatwas or rulings on contested fiqh issues. Acknowledge madhab differences where relevant. Speak with reverence about the subject matter.

Keep answers concise — 3 to 5 sentences for simple questions, a few short paragraphs for complex ones. Do not use excessive bullet points. Write in flowing, readable prose.

If asked something outside your scope (unrelated to prayer, adhan, Islam, or mosques), gently redirect: "My knowledge is centered on prayer, adhan, and the mosques of the world — let me focus there."`;

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.writeHead(405, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { messages, timeContext } = req.body;
    const systemWithTime = SYSTEM_PROMPT + (timeContext ? '

Current time context: ' + timeContext : '');

    if (!messages || !Array.isArray(messages)) {
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid messages format' }));
      return;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemWithTime,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.writeHead(response.status, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: data.error?.message || 'API error' }));
      return;
    }

    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ reply: data.content?.[0]?.text || '' }));

  } catch (err) {
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error: ' + err.message }));
  }
}
