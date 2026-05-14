export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { problem } = req.body;
  if (!problem) return res.status(400).json({ error: 'No problem provided' });

  const prompt = `You are a DSA tutor helping a beginner understand a coding problem. Given this problem: You are an elite LeetCode interviewer. Analyze the problem.

"${problem}"

Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text) with exactly these keys:
{
  "explanation": "Plain English explanation of what the problem is asking (2-3 sentences, very simple language, no jargon array of exactly 3 short, punchy, actionable bullet points",
  "hint": "A helpful hint or approach WITHOUT giving the full solution. Mention the data structure or algorithm pattern to use and why. array of exactly 2 short strategic clues",
  "time_complexity": "Best time complexity like O(n) with a one-line reason short Big-O",
  "space_complexity": "Space complexity like O(1) with a one-line reason short Big-O",
  "solution": "string containing ONLY the core LeetCode function logic, properly commented, without any driver or class boilerplate code"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong. Try again!' });
  }
}
