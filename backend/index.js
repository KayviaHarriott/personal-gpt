import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// ✅ Allow all origins (for testing). Restrict in production
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL;
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_POD_ID = process.env.RUNPOD_POD_ID;
const PORT = process.env.PORT || 3000;

if (!OLLAMA_URL) {
  console.error("❌ Missing OLLAMA_URL in .env");
  process.exit(1);
}

if (!RUNPOD_API_KEY || !RUNPOD_POD_ID) {
  console.warn("⚠️ RunPod API credentials missing — pod control disabled");
}

// ------------------------
// ⚡ POD CONTROL ENDPOINTS
// ------------------------

async function runPodMutation(mutation) {
  const res = await fetch("https://api.runpod.io/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RUNPOD_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: mutation }),
  });
  return res.json();
}

app.post("/pod/start", async (req, res) => {
  if (!RUNPOD_API_KEY || !RUNPOD_POD_ID)
    return res.status(500).json({ error: "Missing RunPod credentials" });

  try {
    const query = `
      mutation {
        podResume(input: { podId: "${RUNPOD_POD_ID}" }) {
          id
          desiredStatus
        }
      }
    `;
    const data = await runPodMutation(query);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Failed to start pod:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/pod/stop", async (req, res) => {
  if (!RUNPOD_API_KEY || !RUNPOD_POD_ID)
    return res.status(500).json({ error: "Missing RunPod credentials" });

  try {
    const query = `
      mutation {
        podStop(input: { podId: "${RUNPOD_POD_ID}" }) {
          id
          desiredStatus
        }
      }
    `;
    const data = await runPodMutation(query);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Failed to stop pod:", err);
    res.status(500).json({ error: err.message });
  }
});

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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

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

    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

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
