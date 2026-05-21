"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "./actions";

type Msg = {
  id: string;
  body: string;
  attachments: { url: string; name: string; size: number }[];
  createdAt: string;
  isMe: boolean;
  isSystem: boolean;
  senderName: string;
};

export function ThreadPane({
  threadId,
  messages,
}: {
  threadId: string;
  messages: Msg[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Live updates — refresh on any incoming notification (cheap, accurate)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const src = new EventSource("/api/notifications/stream");
    src.addEventListener("notification", () => router.refresh());
    return () => src.close();
  }, [router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  function send() {
    setError(null);
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await sendMessage(threadId, body.trim());
      if (!res.ok) {
        setError(res.error ?? "Could not send");
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="ne-card p-0 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">
            No messages yet — say hi.
          </div>
        ) : null}
        {messages.map((m) =>
          m.isSystem ? (
            <div key={m.id} className="text-center text-xs text-muted-foreground py-2">
              {m.body}
            </div>
          ) : (
            <div
              key={m.id}
              className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                  m.isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {!m.isMe ? (
                  <div className="text-[10px] opacity-70 mb-0.5">{m.senderName}</div>
                ) : null}
                <div className="whitespace-pre-wrap">{m.body}</div>
                {m.attachments.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1">
                    {m.attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline opacity-90"
                      >
                        📎 {a.name}
                      </a>
                    ))}
                  </div>
                ) : null}
                <div className="text-[10px] opacity-60 mt-1">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            rows={2}
            className="ne-input h-auto resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
          />
          <button onClick={send} disabled={pending || !body.trim()} className="ne-btn">
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
        {error ? (
          <div className="mt-1 text-xs text-destructive">{error}</div>
        ) : null}
      </div>
    </div>
  );
}
