import { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Sparkles, Send, X, Trash2 } from "lucide-react";

// quick starters shown on the empty chat (they only fill the input box)
const SUGGESTIONS = [
  "How do I reset my password?",
  "My printer is not working",
  "How do I request a new laptop?",
];

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
        aria-label="Ask AI"
        className="
          fixed bottom-5 right-5 z-[99998]
          flex items-center gap-2
          bg-[#1f4a35] hover:bg-[#173a29]
          shadow-lg hover:shadow-xl rounded-full
          pl-3 pr-4 h-11
          text-sm font-medium text-white
          transition-all duration-200
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f4a35]
        "
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d4a94c] text-[#14251c]">
          <Sparkles size={14} />
        </span>
        Ask AI
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
        <div className="flex items-center justify-between px-4 h-14 bg-[#14251c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#d4a94c] text-[#14251c] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">AI assistant</p>
              <p className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Clear chat"
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 h-8 rounded-md hover:bg-white/10 transition-colors"
            >
              <Trash2 size={13} />
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f4f6f5] space-y-3">
          {chat.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-10">
              <div className="w-12 h-12 rounded-full bg-[#eef3ee] text-[#1f4a35] flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <p className="text-sm font-semibold text-gray-800">How can I help you?</p>
              <p className="text-xs text-gray-500 max-w-[240px]">
                Ask about IT support, assets, tickets, or anything else.
              </p>
              <div className="flex flex-col gap-2 mt-2 w-full max-w-[260px]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setMessage(s)}
                    className="text-left text-xs text-gray-700 bg-white border border-gray-200 hover:border-[#1f4a35] hover:bg-[#f4f8f4] rounded-md px-3 py-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-[#d4a94c] text-[#14251c] flex items-center justify-center text-[10px] font-bold mr-2 mt-1 shrink-0">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2.5 rounded-lg text-sm leading-relaxed break-words ${
                  msg.role === "user"
                    ? "bg-[#1f4a35] text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-[#d4a94c] text-[#14251c] flex items-center justify-center text-[10px] font-bold mr-2 mt-1 shrink-0">
                AI
              </div>
              <div className="bg-white border border-gray-200 px-3 py-3 rounded-lg rounded-bl-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="border-t border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md pl-3 pr-1.5 py-1.5 focus-within:border-[#1f4a35] focus-within:ring-1 focus-within:ring-[#1f4a35] transition">
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
              aria-label="Send message"
              className="
                w-8 h-8 flex items-center justify-center
                bg-[#1f4a35] hover:bg-[#173a29]
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white rounded-md transition-colors
                shrink-0
              "
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-2">AI may make mistakes. Verify important info.</p>
        </div>
      </div>
    </>
  );
}