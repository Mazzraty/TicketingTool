import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      toast.error("AI failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 w-96 bg-white shadow-xl rounded-xl border flex flex-col">

      {/* HEADER */}
      <div className="bg-blue-600 text-white p-3 rounded-t-xl">
        AI Assistant
      </div>

      {/* CHAT AREA */}
      <div className="h-80 overflow-y-auto p-3 space-y-2">
        {chat.map((c, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg text-sm ${
              c.role === "user"
                ? "bg-blue-100 text-right"
                : "bg-gray-100"
            }`}
          >
            {c.text}
          </div>
        ))}

        {loading && (
          <div className="text-gray-400 text-sm">
            AI is typing...
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="flex border-t p-2">
        <input
          className="flex-1 p-2 outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}