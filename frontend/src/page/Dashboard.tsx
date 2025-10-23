import { useState } from "react";
import "./Dashboard.css";

// Define a type for messages
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const Dashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const sendMessage = async () => {
  if (!input.trim()) return;

  const newMessages: Message[] = [...messages, { role: "user", content: input }];
  setMessages(newMessages);
  setInput("");

  try {
    const res = await fetch(API_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    // Prepare to stream response chunks
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let assistantReply = "";
    let buffer = "";

    if (!reader) throw new Error("No reader available from response body");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      // Add new chunk to buffer
      buffer += chunk;

      // Split the stream by newlines — Ollama sends one JSON per line
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete line for next chunk

      for (const line of lines) {
        if (!line.trim() || line === "[STREAM_END]") continue;

        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            assistantReply += data.message.content;

            // Update messages in real time
            setMessages([
              ...newMessages,
              { role: "assistant", content: assistantReply },
            ]);
          }
        } catch {
          // Ignore incomplete JSON lines
        }
      }
    }

    // Finalize message when stream ends
    setMessages([...newMessages, { role: "assistant", content: assistantReply }]);
  } catch (err) {
    console.error("Chat error:", err);
  }
};


  return (
    <div className="chat-container">
      <h2 className="title">Ollama Chat</h2>

      <div className="chat-box">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message ${m.role === "user" ? "user" : "assistant"}`}
          >
            <strong>{m.role === "user" ? "You" : "Ollama"}:</strong>{" "}
            {m.content}
          </div>
        ))}
      </div>

      <div className="input-box">
        <input
          type="text"
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};
