import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const [maximized, setMaximized] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMsg = message;

    setChat((prev) => [
      ...prev,
      { role: "user", text: userMsg },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/ai/ask", {
        message: userMsg,
      });

      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            res.data.reply ||
            "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch (err) {
      toast.error("AI service unavailable");

      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            "AI service is currently unavailable. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChat([]);
    toast.success("Chat cleared");
  };

  /* ================= MINIMIZED ================= */

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="
          fixed
          bottom-5
          right-5
          z-[99999]
          h-16
          w-16
          rounded-full
          bg-[#0a6ed1]
          text-white
          shadow-2xl
          hover:scale-105
          transition
          text-2xl
        "
      >
        🤖
      </button>
    );
  }

  /* ================= OPEN ================= */

  return (
    <div
      className={`
        fixed
        z-[99999]
        bg-white
        shadow-2xl
        border
        rounded-xl
        overflow-hidden
        flex
        flex-col
        transition-all
        duration-300

        ${
          maximized
            ? "top-20 left-20 right-20 bottom-10"
            : "bottom-5 right-5 w-[420px] h-[550px]"
        }
      `}
    >
      {/* HEADER */}
      <div className="bg-[#0a6ed1] text-white px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">
          🤖 HelpyFy AI Assistant
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
          >
            Clear
          </button>

          <button
            onClick={() => setMaximized(!maximized)}
            className="hover:bg-white/20 px-2 rounded"
            title="Maximize"
          >
            {maximized ? "🗗" : "🗖"}
          </button>

          <button
            onClick={() => setMinimized(true)}
            className="hover:bg-white/20 px-2 rounded"
            title="Minimize"
          >
            −
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {chat.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            Ask me anything about HelpyFy, IT support, assets, tickets, or general questions.
          </div>
        )}

        <div className="space-y-3">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm break-words ${
                msg.role === "user"
                  ? "ml-auto bg-blue-100"
                  : "bg-white border"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div className="bg-white border px-3 py-2 rounded-lg text-sm text-gray-500 w-fit">
              AI is typing...
            </div>
          )}
        </div>
      </div>

      {/* INPUT */}
      <div className="border-t bg-white p-3 flex gap-2">
        <input
          type="text"
          value={message}
          placeholder="Ask anything..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && sendMessage()
          }
          className="
            flex-1
            border
            rounded-lg
            px-3
            py-2
            outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="
            bg-[#0a6ed1]
            text-white
            px-5
            rounded-lg
            hover:bg-[#0854a0]
            disabled:opacity-50
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}