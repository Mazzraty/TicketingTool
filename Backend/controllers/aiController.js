export const askAI = async (req, res) => {
  try {
    console.log("🔥 AI REQUEST HIT");

    const { message } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "OPENAI_API_KEY missing in Render env",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an ERP assistant for HelpyFy helpdesk system.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return res.json({
      reply: response.choices[0].message.content,
    });

  } catch (err) {
    console.error("🔥 AI ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};