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
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (data?.message?.content) {
        setMessages([...newMessages, data.message]);
      } else if (data?.response) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.response },
        ]);
      }
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
