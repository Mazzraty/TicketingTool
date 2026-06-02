import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // ✅ FIX HERE
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return res.json({ reply: text });

  } catch (error) {
    console.error("AI ERROR:", error);
    return res.status(500).json({
      error: "AI service failed",
      details: error.message,
    });
  }
};