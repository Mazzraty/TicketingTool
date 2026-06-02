import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const models = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ];

    let reply = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
        });

        const result = await model.generateContent(message);
        reply = result.response.text();

        console.log(`Success using ${modelName}`);
        break;
      } catch (err) {
        console.log(`Failed: ${modelName}`, err.status);
      }
    }

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