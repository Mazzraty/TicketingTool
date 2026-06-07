import { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message;
    setChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/ai/ask", { message: userMsg });
      setChat((prev) => [
        ...prev,
        { role: "ai", text: res.data.reply || "Sorry, I couldn't generate a response." },
      ]);
    } catch {
      toast.error("AI service unavailable");
      setChat((prev) => [
        ...prev,
        { role: "ai", text: "AI service is currently unavailable. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChat([]);
    toast.success("Chat cleared");
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          fixed bottom-5 right-5 z-[99998]
          flex items-center gap-2
          bg-white border border-gray-200
          shadow-lg rounded-full
          px-4 py-2.5
          text-sm font-medium text-gray-700
          hover:shadow-xl hover:border-blue-300
          transition-all duration-200
        "
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#0a6ed1] text-white text-xs">
          💬
        </span>
        Ask AI
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-xs font-bold">
          +
        </span>
      </button>

      {/* OVERLAY (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-[99998] bg-black/10 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* RIGHT SIDEBAR PANEL */}
      <div
        className={`
          fixed top-0 right-0 h-full z-[99999]
          w-full sm:w-[380px]
          bg-white shadow-2xl border-l border-gray-200
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#0a6ed1] flex items-center justify-center text-white text-sm">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">AI Assistant</p>
              <p className="text-[10px] text-green-500 font-medium">● Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-lg"
            >
              ×
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-3">
          {chat.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-10">
              <div className="w-12 h-12 rounded-2xl bg-[#0a6ed1]/10 flex items-center justify-center text-2xl">
                🤖
              </div>
              <p className="text-sm font-medium text-gray-700">How can I help you?</p>
              <p className="text-xs text-gray-400 max-w-[220px]">
                Ask about IT support, assets, tickets, or anything else.
              </p>
            </div>
          )}

          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-[#0a6ed1] flex items-center justify-center text-white text-xs mr-2 mt-1 shrink-0">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                  msg.role === "user"
                    ? "bg-[#0a6ed1] text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-[#0a6ed1] flex items-center justify-center text-white text-xs mr-2 mt-1 shrink-0">
                AI
              </div>
              <div className="bg-white border border-gray-200 px-3 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="border-t border-gray-100 bg-white p-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <input
              type="text"
              value={message}
              placeholder="Ask anything..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="
                w-8 h-8 flex items-center justify-center
                bg-[#0a6ed1] hover:bg-[#0854a0]
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white rounded-xl transition
                shrink-0
              "
            >
              ➤
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">AI may make mistakes. Verify important info.</p>
        </div>
      </div>
    </>
  );
}