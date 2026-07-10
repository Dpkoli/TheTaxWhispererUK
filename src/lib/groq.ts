import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export const CHAT_MODEL = process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile";
