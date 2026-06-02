import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    console.log("API Key exists:", !!process.env.GEMINI_API_KEY);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent("Hello");
    const response = result.response;

    console.log(response.text());
  } catch (error) {
    console.error("TEST ERROR:", error);
  }
}

run();