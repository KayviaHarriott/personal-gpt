import { useEffect, useState } from "react";
import { streamChat, toggleRunPod } from "../api/chatAPI";
import type { Message } from "../api/chatAPI";
import { ChatBubble } from "../components/ChatBubble";
import "./Dashboard.css";

export const Dashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isStreaming, setIsStreaming] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const [podActive, setPodActive] = useState(false); // 🟢 track pod state
  const [loadingPod, setLoadingPod] = useState(false);

  // ... existing functions ...

  const handleTogglePod = async () => {
    try {
      setLoadingPod(true);
      const result = await toggleRunPod(API_URL, !podActive);
      console.log("RunPod result:", result);
      setPodActive(!podActive);
    } catch (err) {
      console.error("Failed to toggle RunPod:", err);
      alert(`Failed to ${!podActive ? "start" : "stop"} RunPod`);
    } finally {
      setLoadingPod(false);
    }
  };


  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user" as const, content: input },
    ];

    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    try {
      let partialReply = "";
      const finalReply = await streamChat(API_URL, newMessages, (partial) => {
        partialReply = partial;
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
      setMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">PN</div>
            <span>PersNote</span>
          </div>
        </div>

        <button
          className="new-chat-btn"
          onClick={() => {
            setMessages([]);
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          New Chat
        </button>

        <div className="chat-history" id="chatHistory">
          {messages.length === 0 && (
            <div className="history-item text-sm text-gray-500">
              No chat history yet
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13z" />
                </svg>
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M6 .278a.768.768 0 0 1 .08.858A7.208 7.208 0 0 0 5.202 4.6a7.2 7.2 0 0 0 7.318 7.277 8.35 8.35 0 0 1-4.175 4.123C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
                </svg>
                <span>Dark Mode</span>
              </>
            )}
          </button>
          <button
            className="theme-toggle"
            onClick={handleTogglePod}
            disabled={loadingPod}
          >
            {loadingPod ? (
              <span>Loading...</span>
            ) : podActive ? (
              <>
                <span style={{ color: "green" }}>🟢 Pod ON</span>
              </>
            ) : (
              <>
                <span style={{ color: "red" }}>🔴 Pod OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        <div className="chat-header">
          <h1 className="chat-title">Chat</h1>
        </div>

        <div className="messages-area">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h2>Welcome to PersNote</h2>
                <p>Start a conversation with your AI assistant</p>
                <div className="suggestion-chips">
                  {[
                    "Tell me about yourself",
                    "What can you help me with?",
                    "Let's have a conversation",
                  ].map((prompt) => (
                    <div
                      key={prompt}
                      className="chip"
                      onClick={() => {
                        setInput(prompt);
                        sendMessage();
                      }}
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <ChatBubble key={i} role={m.role} content={m.content} />
              ))
            )}

            {isStreaming && (
              <div className="message ai">
                <div className="message-avatar">AI</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="input-area">
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                className="message-input"
                placeholder="Message PersNote..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={isStreaming}
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
              >
                <svg
                  className="send-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
