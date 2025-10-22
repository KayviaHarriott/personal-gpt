import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config(); // Load variables from .env

const app = express();
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL;
const PORT = process.env.PORT || 3000;

if (!OLLAMA_URL) {
  console.error("❌ Missing OLLAMA_URL in .env");
  process.exit(1);
}

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body; // Expect: [{ role: "user", content: "Hello" }, ...]

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Request body must have a messages array" });
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:8b",
        messages,
        stream: false, // change to true if you want streaming
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error contacting Ollama:", err);
    res.status(500).json({ error: "Failed to reach Ollama API" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Chat server running on port ${PORT}`);
});
