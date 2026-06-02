import { useState } from "react";
import Draggable from "react-draggable";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = message;

    setChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/ai/ask", {
        message: userMsg,
      });

      setChat((prev) => [
        ...prev,
        { role: "ai", text: res.data.reply },
      ]);
    } catch {
      toast.error("AI failed");
    } finally {
      setLoading(false);
    }
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 h-14 w-14 rounded-full bg-blue-600 text-white shadow-xl"
      >
        AI
      </button>
    );
  }

  return (
    <Draggable handle=".drag-handle">
      <div
        className="
          fixed
          w-[420px]
          h-[500px]
          bg-white
          rounded-xl
          shadow-2xl
          border
          flex
          flex-col
          resize
          overflow-hidden
          z-50
        "
      >
        {/* Header */}
        <div className="drag-handle bg-blue-600 text-white p-3 flex justify-between cursor-move">
          <span>AI Assistant</span>

          <button
            onClick={() => setMinimized(true)}
            className="font-bold"
          >
            −
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chat.map((c, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-sm ${
                c.role === "user"
                  ? "bg-blue-100 ml-auto max-w-[80%]"
                  : "bg-gray-100 max-w-[80%]"
              }`}
            >
              {c.text}
            </div>
          ))}

          {loading && (
            <div className="text-gray-400">
              AI is typing...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-2 flex">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 outline-none"
            placeholder="Ask anything..."
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </Draggable>
  );
}