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
    
    const apiResponse = await fetch("openrouter.ai", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model : "openrouter/auto",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an elite LeetCode interviewer. Analyze the problem. Your response must be a valid, raw JSON object with keys: 'title' (string), 'explanation' (array of exactly 3 short string lines), 'approach' (array of exactly 2 short string lines), 'time' (string), 'space' (string), and 'solution' (string containing ONLY the core LeetCode function logic in Python without any comments). Do not wrap the JSON in markdown code blocks."
          },
          {
            role: "user",
            content: problem
          }
        ]
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`OpenRouter returned status ${apiResponse.status}`);
    }

    const completion = await apiResponse.json();
    let resultText = completion.choices.message.content.trim();
    
    if (resultText.startsWith("```")) {
      resultText = resultText.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    const structuredData = JSON.parse(resultText);
    return res.status(200).json(structuredData);

  } catch (error) {
    console.error("Backend runtime crash error:", error);
    return res.status(500).json({ error: "Internal API data processing fault" });
  }
}
