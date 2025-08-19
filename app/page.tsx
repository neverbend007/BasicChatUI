"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import clsx from "clsx";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

const generateId = () => crypto.randomUUID();

const Page = () => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const placeholder = useMemo(
    () =>
      isSending
        ? "Sending…"
        : "Ask anything… e.g. \"Summarize this idea\" or \"Draft an email\"",
    [isSending]
  );

  const handleSend = async () => {
    if (!input.trim() || isSending) {
      return;
    }

    const pendingUser: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, pendingUser]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: pendingUser.content }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const errJson = (await res.json()) as { error?: string; detail?: string };
          detail = errJson?.detail || errJson?.error || "";
        } catch {}
        throw new Error(detail || `Request failed with ${res.status}`);
      }
      const data = (await res.json()) as { reply: string };

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: data?.reply ?? "",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content:
          (error instanceof Error && error.message) ||
          "Sorry, something went wrong while contacting the assistant. Please try again.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSignOut = () => {
    void signOut();
  };

  if (status === "loading") {
    return (
      <main className="container-responsive flex min-h-screen flex-col items-center justify-center py-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/15 ring-1 ring-primary/30" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <main className="container-responsive flex min-h-screen flex-col py-6">
      <header className="sticky top-0 z-10 -mx-4 mb-4 bg-background/70 px-4 py-3 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 ring-1 ring-primary/30" />
            <div>
              <p className="text-base font-semibold tracking-tight">Retell AI & N8N Virtual Assistant</p>
              <p className="text-xs text-muted">Chat with an OpenAI assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="text-sm text-muted">{session?.user?.name}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-muted hover:text-foreground transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto rounded-2xl border border-border bg-card/60 p-4 shadow-glass"
        aria-live="polite"
        aria-label="Chat transcript"
        tabIndex={0}
      >
        {!hasMessages ? (
          <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-xl font-semibold">Start a conversation</h1>
            <p className="max-w-md text-sm text-muted">
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((m) => (
              <li key={m.id} className="group">
                <div
                  className={clsx(
                    "flex w-full gap-3",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role !== "user" && (
                    <div className="mt-1 h-7 w-7 shrink-0 rounded-lg bg-primary/20 ring-1 ring-primary/30" />
                  )}
                  <div
                    className={clsx(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ring-1",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground ring-primary/40"
                        : "bg-muted/60 text-foreground ring-border"
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="mt-1 h-7 w-7 shrink-0 rounded-lg bg-primary/20 ring-1 ring-primary/30" />
                  )}
                </div>
              </li>
            ))}
            {isSending && (
              <li className="group">
                <div className="flex w-full gap-3 justify-start">
                  <div className="mt-1 h-7 w-7 shrink-0 rounded-lg bg-primary/20 ring-1 ring-primary/30" />
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm ring-1 bg-muted/60 text-foreground ring-border">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"></div>
                      </div>
                      <span className="ml-2 text-xs text-muted">Thinking...</span>
                    </div>
                  </div>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card/60 p-3 shadow-glass">
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            className="min-h-[52px] max-h-48 flex-1 resize-y rounded-xl border border-border bg-background/70 px-3 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-primary/50"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Type your message to the assistant"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className={clsx(
              "inline-flex h-[52px] items-center justify-center rounded-xl px-4 text-sm font-medium ring-1 transition focus:outline-none focus:ring-2",
              isSending || !input.trim()
                ? "cursor-not-allowed bg-muted/40 text-muted ring-border"
                : "bg-primary text-primary-foreground ring-primary/40 hover:brightness-110"
            )}
            aria-label="Send message"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted">
          Press Enter to send • Shift+Enter for a new line
        </p>
      </div>
    </main>
  );
};

export default Page;