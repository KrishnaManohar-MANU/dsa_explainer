export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { problem } = req.body;
  if (!problem) return res.status(400).json({ error: 'No problem provided' });

  
messages: [
  {
    role: "system",
    content: "You are an elite LeetCode interviewer. Analyze the problem. Your response must be a raw JSON object with keys: 'title' (string, e.g., 'LeetCode 1: Two Sum' or 'Problem: Reverse Integer'), 'explanation' (array of exactly 3 short string lines), 'approach' (array of exactly 2 short string lines), 'time' (string), 'space' (string), and 'solution' (string containing ONLY the core LeetCode function logic in Python without any comments)."
  },
  {
    role: "user",
    content: problem
  }
]


  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY
      },
      body: JSON.stringify({
        model : "openrouter/auto",
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong. Try again!' });
  }
}
