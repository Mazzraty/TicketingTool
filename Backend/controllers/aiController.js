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
        message: "GEMINI_API_KEY missing in environment",
      });
    }

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are an ERP assistant for HelpyFy IT system.

User question:
${message}
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