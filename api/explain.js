export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { problem } = req.body;
  if (!problem) {
    return res.status(400).json({ error: 'Problem content is required' });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return res.status(500).json({ error: 'System Error: API Key missing from Vercel dashboard.' });
  }

  try {
    const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sigmasensei.dev",
        "X-Title": "DSA Explainer"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an elite DSA tutor and LeetCode expert. Analyze the given problem and respond ONLY with a raw JSON object — no markdown, no backticks, no extra text. The JSON must have exactly these keys:

- title: string — the problem name
- difficulty: string — exactly one of "Easy", "Medium", or "Hard" (infer if not stated)
- explanation: array of 3-4 short strings — plain English breakdown of what the problem is asking
- approach: array of 3-4 short strings — how to think about solving it, intuition first
- steps: array of 4-5 short strings — concrete step-by-step algorithm in plain English
- patterns: array of 2-4 strings — DS/algo patterns involved (e.g. "Sliding Window", "Two Pointers", "BFS", "Dynamic Programming")
- pitfalls: array of 2-3 short strings — common mistakes beginners make on this problem
- hints: array of 2-3 short strings — interview tips, edge cases to mention, or tricks to impress
- similar: array of 2-3 objects each with keys "name" (string) and "difficulty" (string) — related LeetCode problems to practice
- time: string — time complexity e.g. "O(n log n)"
- timeNote: string — one short sentence explaining why
- space: string — space complexity e.g. "O(n)"
- spaceNote: string — one short sentence explaining why
- solution: string — clean Python 3 solution with ONLY the core function body, no class definition, no boilerplate, no comments`
          },
          {
            role: "user",
            content: problem
          }
        ]
      })
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.json().catch(() => ({}));
      throw new Error(`OpenRouter error ${apiResponse.status}: ${errBody?.error?.message || 'unknown'}`);
    }

    const completion = await apiResponse.json();
    let resultText = completion.choices[0].message.content.trim();

    // strip markdown fences if model ignores response_format
    resultText = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    const structuredData = JSON.parse(resultText);
    return res.status(200).json(structuredData);

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}