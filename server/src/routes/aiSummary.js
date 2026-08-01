const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai"); 
const activityService = require("../services/activity.service"); 
const Lead = require("../models/Lead");        
const Company = require("../models/Company");
const Deal = require("../models/Deal");
const Ticket = require("../models/Ticket");

let openai = null;
// Configured to use OpenRouter instead of default OpenAI
if (process.env.OPENROUTER_API_KEY) {
  openai = new OpenAI({ 
    baseURL: "https://openrouter.ai/api/v1", 
    apiKey: process.env.OPENROUTER_API_KEY 
  });
}

const entityModels = {
  lead: Lead, company: Company, deal: Deal, ticket: Ticket,
};

router.get("/:entityType/:id/ai-summary", async (req, res) => {
  try {
    const { entityType, id } = req.params;
    const Model = entityModels[entityType];

    if (!Model) return res.status(400).json({ error: "Invalid entity type" });
    
    const entity = await Model.findById(id);
    if (!entity) return res.status(404).json({ error: `${entityType} not found` });

    const timeline = await activityService.getEntityTimeline(entityType, id);

    if (!timeline || timeline.length === 0) {
      return res.json({ summary: `No activities found for this ${entityType}.` });
    }

    if (!openai) {
      return res.status(401).json({ error: "OPENROUTER_API_KEY missing inside your server's .env file." });
    }

    const activityLines = timeline.map((a) => {
      const date = a.activityDate || a.itemRef?.dueDate || a.itemRef?.startDate || a.createdAt;
      const desc = a.description || a.itemRef?.subject || a.itemRef?.note || a.itemRef?.taskName || a.itemRef?.title || "";
      return `- [${a.type}] ${desc} (${date ? new Date(date).toDateString() : "no date"})`;
    }).join("\n");

    const entityName = entity.firstName ? `${entity.firstName} ${entity.lastName || ""}`.trim() : entity.companyName || entity.name || entity.ticketName || "this record";

    const prompt = `You are a CRM assistant. Write a concise summary of this ${entityType}'s activity history.
Entity name: ${entityName}
Activity log:
${activityLines}`;

    const response = await openai.chat.completions.create({
      model: "cohere/north-mini-code:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    res.json({ summary: response.choices[0].message.content.trim() });

  } catch (error) {
    console.error("🔥 DETAILED API ERROR:", error);
    res.status(500).json({ 
      error: "AI Generation Failed", 
      reason: error.message, 
      details: error.response?.data || null 
    });
  }
});

module.exports = router;