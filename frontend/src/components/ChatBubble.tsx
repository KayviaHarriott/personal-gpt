import { Box } from "@mui/material";

export const ChatBubble = ({ role, content }: { role: "user" | "assistant" | "system"; content: string }) => {
  return (
    <div className={`message ${role === "user" ? "user" : "assistant"}`}>
      {role === "user" ? (
        <Box
          sx={{
            padding: "8px",
            backgroundColor: "#A162F7",
            color: "white",
            boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          {content}
        </Box>
      ) : (
        <Box
          sx={{
            padding: "8px",
            backgroundColor: "#F5F7FA",
            boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          {content}
        </Box>
      )}
    </div>
  );
};