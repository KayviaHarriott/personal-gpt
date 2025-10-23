import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // Choose any theme from highlight.js/styles

type Role = "user" | "assistant" | "system";

export const ChatBubble = ({
  role,
  content,
}: {
  role: Role;
  content: string;
}) => {
  const isUser = role === "user";

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      <Box
        sx={{
          padding: "8px",
          backgroundColor: isUser ? "#A162F7" : "#F5F7FA",
          color: isUser ? "white" : "black",
          boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowX: "auto",
        }}
      >
        {isUser ? (
          content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              ol: (props) => (
                <ol className="list-decimal list-inside ml-4" {...props} />
              ),
              ul: (props) => (
                <ul className="list-disc list-inside ml-4" {...props} />
              ),
              code: ({ className, children }) => (
                <code
                  className={`bg-gray-100 px-1 py-0.5 rounded text-sm font-mono ${
                    className ?? ""
                  }`}
                >
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </Box>
    </div>
  );
};
