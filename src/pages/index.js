import { useEffect, useRef, useState } from "react";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState("disconnected"); // connecting | connected | disconnected
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function connect(name) {
    const urlWebSocket = process.env.NEXT_PUBLIC_URL_WEB_SOCKET
    const ws = new WebSocket(urlWebSocket);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("connected");
      ws.send(JSON.stringify({ type: "join", username: name }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = () => {
      setStatus("disconnected");
    };
  }

  function handleJoin(e) {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    setJoined(true);
    connect(name);
  }

  function handleSend(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "message", text: value }));
    setText("");
  }

  if (!joined) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleJoin}
          className="w-full max-w-sm bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl"
        >
          <h1 className="text-xl font-semibold text-slate-100 mb-1">
            Simple Chat
          </h1>
          <p className="text-sm text-slate-400 mb-5">
            Masukkan nama untuk mulai chat
          </p>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nama kamu..."
            maxLength={30}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 mb-4"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-medium py-2"
          >
            Masuk Chat
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Simple Chat</h1>
          <p className="text-xs text-slate-400">Login sebagai {username}</p>
        </div>
        <span
          className={
            "text-xs px-2 py-1 rounded-full border " +
            (status === "connected"
              ? "text-emerald-400 border-emerald-700 bg-emerald-950/50"
              : status === "connecting"
              ? "text-amber-400 border-amber-700 bg-amber-950/50"
              : "text-red-400 border-red-700 bg-red-950/50")
          }
        >
          {status === "connected"
            ? "Terhubung"
            : status === "connecting"
            ? "Menghubungkan..."
            : "Terputus"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto chat-scroll bg-slate-800/40 border border-slate-700 rounded-2xl p-4 mb-4 space-y-2 min-h-[50vh] max-h-[65vh]">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-10">
            Belum ada pesan. Mulai obrolan!
          </p>
        )}
        {messages.map((msg, i) =>
          msg.type === "system" ? (
            <p
              key={i}
              className="text-center text-xs text-slate-500 italic py-1"
            >
              {msg.text}
            </p>
          ) : (
            <div
              key={i}
              className={
                "max-w-[75%] rounded-xl px-3 py-2 " +
                (msg.username === username
                  ? "ml-auto bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-100")
              }
            >
              {msg.username !== username && (
                <p className="text-xs font-semibold text-indigo-300 mb-0.5">
                  {msg.username}
                </p>
              )}
              <p className="text-sm break-words">{msg.text}</p>
              <p className="text-[10px] opacity-60 mt-0.5 text-right">
                {formatTime(msg.time)}
              </p>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan..."
          maxLength={1000}
          className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={status !== "connected"}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white font-medium px-4"
        >
          Kirim
        </button>
      </form>
    </main>
  );
}
