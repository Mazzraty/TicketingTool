import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 🤖 ERP AI ASSISTANT CONTROLLER (Gemini)
 * Used for HelpyFy helpdesk system
 */
export const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    // 🔐 Check API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key missing in environment",
      });
    }

    // 🤖 Initialize AI
    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // 🧠 ERP SYSTEM PROMPT (IMPORTANT)
    const prompt = `
You are an ERP AI assistant for an IT Helpdesk system called HelpyFy.

You help users with:
- IT tickets
- Asset management (laptops, printers, devices)
- Employee queries
- System navigation help

Rules:
- Be short and professional
- ERP style response (like SAP assistant)
- If unsure, ask clarification
- Do not generate harmful content

User Question:
${message}
`;

    // ⚡ Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({
      success: true,
      reply: text,
    });

  } catch (err) {
    console.error("🔥 AI CONTROLLER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "AI service failed",
    });
  }
};