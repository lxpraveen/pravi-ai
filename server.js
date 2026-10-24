import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "Gemini API key missing. Add GEMINI_API_KEY to your .env file and restart the server."
    });
  }

  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Please send at least one message." });
  }

  // Limit the amount of conversation sent to the model.
  const recentMessages = messages.slice(-20);
  const contents = [];

  for (const item of recentMessages) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") {
      return res.status(400).json({ error: "Invalid message format." });
    }

    const content = item.content.trim().slice(0, 12000);
    if (!content) continue;

    contents.push({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: content }]
    });
  }

  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return res.status(400).json({ error: "Your latest message must be from the user." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: "You are Pravi AI, a helpful, friendly AI assistant. Answer clearly and accurately. If the user writes in Hinglish or Hindi, respond in the same language when practical. If you are uncertain, say so."
      }
    });

    const answer = response.text?.trim();
    if (!answer) {
      return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    }

    return res.json({ answer });
  } catch (error) {
    console.error("Gemini request failed:", error?.message || error);
    return res.status(502).json({
      error: "AI request failed. Check your API key, model access, internet connection, and API quota, then try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Pravi AI is running at http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log("Setup needed: add GEMINI_API_KEY to your .env file.");
  }
});
