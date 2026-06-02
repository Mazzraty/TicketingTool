import OpenAI from "openai";

export const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "OpenAI API key missing in .env",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an ERP assistant for IT helpdesk system.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: response.choices[0].message.content,
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({
      message: "AI service failed",
    });
  }
};