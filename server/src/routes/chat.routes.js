const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages, system } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "messages array is required" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "cohere/north-mini-code:free",




        messages: [
          { role: "system", content: system || "You are a helpful CRM assistant." },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2)); // ← ഇത് add ചെയ്യൂ

    console.log("FULL DATA:", JSON.stringify(data));
const reply = data.choices?.[0]?.message?.content 
           || data.choices?.[0]?.text 
           || data.output 
           || JSON.stringify(data);
    return res.status(200).json({ success: true, reply });

  } catch (error) {
    console.error("❌ Chat API error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;