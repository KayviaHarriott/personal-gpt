import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// ✅ Allow all origins (for testing). Restrict this in production.
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL;
const PORT = process.env.PORT || 3000;

if (!OLLAMA_URL) {
  console.error("❌ Missing OLLAMA_URL in .env");
  process.exit(1);
}

// ------------------------
// 🧠 CHAT STREAM ENDPOINT
// ------------------------
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "Request body must include a 'messages' array" });
    }

    // Tell the browser this will be a streaming response (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.(); // In case Express compression is enabled

    // 🔄 Forward the chat request to Ollama (streaming)
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:8b",
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    // Stream Ollama output line by line to the client
    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      // ✅ Send each chunk as a separate SSE event
      res.write(chunk);
    }

    // Signal end of stream
    res.write("\n[STREAM_END]\n");
    res.end();
  } catch (err) {
    console.error("❌ Error contacting Ollama:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Failed to reach Ollama API", details: err.message });
    } else {
      res.end("\n[STREAM_ERROR]\n");
    }
  }
});

// ------------------------
// 🚀 START SERVER
// ------------------------
app.listen(PORT, () => {
  console.log(`✅ Chat server running on port ${PORT}`);
});
