import { useState } from "react";
import "./Dashboard.css";
import { streamChat } from "../api/chatAPI";
import type { Message } from "../api/chatAPI";

export const Dashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user" as const, content: input },
    ];

    setMessages(newMessages);
    setInput("");

    let partialReply = "";

    try {
      const finalReply = await streamChat(API_URL, newMessages, (partial) => {
        partialReply = partial;

        // ✅ No unused variable warning (removed unused 'prev')
        setMessages([
          ...newMessages,
          { role: "assistant" as const, content: partialReply },
        ]);
      });

      setMessages([
        ...newMessages,
        { role: "assistant" as const, content: finalReply },
      ]);
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
