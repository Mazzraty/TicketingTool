import { GoogleGenerativeAI } from "@google/generative-ai";
import Ticket from "../models/ticketSchema.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"];

// Shared helper: tries each model in order, returns first successful text response
async function generateWithFallback(prompt) {
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      console.log(`Success using ${modelName}`);
      return result.response.text();
    } catch (err) {
      console.log(`Failed: ${modelName}`, err.status);
    }
  }
  return null;
}

// Strips ```json fences etc. before parsing
function safeParseJSON(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const reply = await generateWithFallback(message);

    if (!reply) {
      return res.status(503).json({
        error: "Gemini service is busy. Please try again in a few moments.",
      });
    }

    res.json({ reply });
  } catch (error) {
    console.error("AI ERROR:", error);

    res.status(500).json({
      error: "AI service failed",
      details: error.message,
    });
  }
};

export const getTicketRecommendation = async (req, res) => {
  try {
    const { title, description, relatedTo } = req.body;
    const companyId = req.user?.companyId;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required",
      });
    }

    if (!companyId) {
      return res.status(401).json({
        error: "Company context missing from authenticated user",
      });
    }

    // --- Step 1: find similar past tickets in this company ---
    let similarTickets = [];
    try {
      similarTickets = await Ticket.find(
        {
          companyId,
          $text: { $search: `${title} ${description}` },
        },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(5)
        .select("ticketNumber title relatedTo priority resolutionNote status");
    } catch (searchErr) {
      // If the text index doesn't exist yet, don't fail the whole request —
      // just proceed without similar-ticket context.
      console.log("Similar ticket search failed:", searchErr.message);
    }

    // --- Step 2: build prompt for Gemini ---
    const similarTicketsContext = similarTickets.length
      ? similarTickets
          .map(
            (t, i) =>
              `${i + 1}. [${t.ticketNumber}] "${t.title}" — category: ${t.relatedTo}, priority: ${t.priority}, resolution: ${t.resolutionNote || "N/A"}`
          )
          .join("\n")
      : "No similar past tickets found.";

    const prompt = `
You are an IT helpdesk assistant. A new support ticket has been submitted.

New ticket:
Title: ${title}
Description: ${description}
${relatedTo ? `Category hint: ${relatedTo}` : ""}

Similar past tickets from this company:
${similarTicketsContext}

Based on this, respond with ONLY a valid JSON object (no markdown, no preamble) in exactly this shape:
{
  "category": one of ["Laptop/Desktop","ERP","Email","HHT","HHT Printer","Syncwise","Printer","Network","Software","Hardware","Others"],
  "priority": one of ["Low","Medium","High","Critical"],
  "suggestedSolution": "a short, actionable suggestion (2-3 sentences max)",
  "confidence": one of ["Low","Medium","High"]
}
`.trim();

    // --- Step 3: call Gemini with fallback ---
    const rawReply = await generateWithFallback(prompt);

    if (!rawReply) {
      return res.status(503).json({
        error: "Gemini service is busy. Please try again in a few moments.",
      });
    }

    const parsed = safeParseJSON(rawReply);

    if (!parsed) {
      return res.status(502).json({
        error: "AI returned an unexpected format",
        raw: rawReply,
      });
    }

    // --- Step 4: return structured recommendation + similar ticket refs ---
    res.json({
      recommendation: parsed,
      similarTickets: similarTickets.map((t) => ({
        ticketNumber: t.ticketNumber,
        title: t.title,
        status: t.status,
      })),
      similarTicketCount: similarTickets.length,
    });
  } catch (error) {
    console.error("TICKET AI RECOMMENDATION ERROR:", error);
    res.status(500).json({
      error: "AI recommendation failed",
      details: error.message,
    });
  }
};