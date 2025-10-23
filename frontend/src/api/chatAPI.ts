// src/server/chatAPI.ts

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Streams a chat conversation with the backend Ollama proxy.
 */
export async function streamChat(
  API_URL: string,
  messages: Message[],
  onUpdate: (partial: string) => void
): Promise<string> {
  const res = await fetch(API_URL + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let assistantReply = "";
  let buffer = "";

  if (!reader) throw new Error("No reader available from response body");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim() || line === "[STREAM_END]") continue;
      try {
        const data = JSON.parse(line);
        if (data.message?.content) {
          assistantReply += data.message.content;
          onUpdate(assistantReply); // Notify frontend to update live
        }
      } catch {
        // Ignore partial JSON lines
      }
    }
  }

  return assistantReply;
}
