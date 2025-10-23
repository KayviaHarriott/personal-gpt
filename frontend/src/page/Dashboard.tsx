import { useState } from "react";
import "./Dashboard.css";
import { streamChat } from "../api/chatAPI";
import type { Message } from "../api/chatAPI";
import { Box, Button, TextField } from "@mui/material";
import { ChatBubble } from "../components/ChatBubble";

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
    <div className="h-screen flexjustify-center items-center w-full">
      <div className="w-full text-center font-bold">
        <h2 className="">PersNote</h2>
      </div>

      <div className="max-w-[800px] flex flex-col justify-between h-full pb-4">
        <Box
          className="h-full overflow-scroll"
          sx={{
            width: "100%",
          }}
        >
          <Box>
            {" "}
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <ChatBubble role={m.role} content={m.content} key={i} />
              ))}
            </div>
            {/* <div className="input-box">
                    <input
                      type="text"
                      value={input}
                      placeholder="Type a message..."
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage}>Send</button>
                  </div> */}
          </Box>
        </Box>

        <div className="flex gap-2">
          <TextField
            // label="Your Label"
            sx={{ width: "100%" }}
            variant="outlined"
            slotProps={{ inputLabel: { shrink: false } }}
            value={input}
            placeholder="Type a message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button
            variant="contained"
            sx={{ textTransform: "none", boxShadow: "none" }}
            onClick={sendMessage}
            className="w-1/6"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
