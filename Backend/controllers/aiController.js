import { GoogleGenerativeAI } from "@google/generative-ai";

export const askAI = async (req, res) => {
  try {
    console.log("AI REQUEST HIT:", req.body);

    const message = req.body?.message;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "GEMINI_API_KEY missing",
      });
    }

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    // ✅ FIXED MODEL HERE
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
    });

    const prompt = `
You are an ERP AI assistant for HelpyFy system.

User query:
${message}

Respond in short SAP-style ERP format.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({
      success: true,
      reply: text,
    });

  } catch (err) {
    console.error("🔥 AI ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};