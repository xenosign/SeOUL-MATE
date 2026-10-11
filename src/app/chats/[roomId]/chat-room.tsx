"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/format";
import type { Message } from "@/lib/types";
import { Avatar } from "@/components/avatar";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

type Props = {
  roomId: string;
  me: { id: string; display_name: string };
  other: { id: string; display_name: string; avatar_url: string | null };
  initialMessages: Message[];
};

const TYPING_TIMEOUT_MS = 3000;

/**
 * Real-time 1:1 chat over Supabase Realtime (WebSocket):
 * - postgres_changes: new rows in `messages` (RLS-protected)
 * - presence: whether the other person is in the room
 * - broadcast: ephemeral "typing…" events
 */
export function ChatRoom({ roomId, me, other, initialMessages }: Props) {
  const { locale, t } = useI18n();
  const [supabase] = useState(createClient);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSent = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  function addMessage(msg: Message) {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }

  useEffect(() => {
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    (async () => {
      // Make sure the socket carries the user's JWT so RLS applies to postgres_changes
      await supabase.realtime.setAuth();
      if (cancelled) return;

      channel = supabase
        .channel(`room:${roomId}`, { config: { presence: { key: me.id } } })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
          (payload) => {
            addMessage(payload.new as Message);
            if ((payload.new as Message).sender_id === other.id) setOtherTyping(false);
          },
        )
        .on("presence", { event: "sync" }, () => {
          setOtherOnline(other.id in channel!.presenceState());
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.userId !== other.id) return;
          setOtherTyping(true);
          clearTimeout(typingTimer);
          typingTimer = setTimeout(() => setOtherTyping(false), TYPING_TIMEOUT_MS);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel!.track({ online_at: new Date().toISOString() });
          }
        });
      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      clearTimeout(typingTimer);
      channelRef.current = null;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, roomId, me.id, other.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherTyping]);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 1000) return;
    lastTypingSent.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: me.id } });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ room_id: roomId, sender_id: me.id, content })
      .select()
      .single();
    setSending(false);

    if (error) {
      alert(error.message);
      return;
    }
    setDraft("");
    addMessage(data as Message);
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto border-zinc-200 bg-zinc-50 px-4 py-4 sm:border-x">
        <p className="mb-4 text-center text-xs text-zinc-400">
          {fmt(otherOnline ? t.chats.online : t.chats.offline, { name: other.display_name })}
        </p>
        <ul className="flex flex-col gap-2">
          {messages.map((m, i) => {
            const mine = m.sender_id === me.id;
            const showAvatar = !mine && messages[i - 1]?.sender_id !== m.sender_id;
            return (
              <li key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`}>
                {!mine && (
                  <span className="w-7 shrink-0">
                    {showAvatar && <Avatar src={other.avatar_url} name={other.display_name} size={28} />}
                  </span>
                )}
                {mine && <time className="text-[10px] text-zinc-400">{formatTime(m.created_at, locale)}</time>}
                <p
                  className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                    mine ? "rounded-br-sm bg-rose-500 text-white" : "rounded-bl-sm bg-white text-zinc-900 shadow-sm"
                  }`}
                >
                  {m.content}
                </p>
                {!mine && <time className="text-[10px] text-zinc-400">{formatTime(m.created_at, locale)}</time>}
              </li>
            );
          })}
        </ul>
        {otherTyping && (
          <p className="mt-2 pl-9 text-xs text-zinc-400">{fmt(t.chats.typing, { name: other.display_name })}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="flex gap-2 border-t border-zinc-200 bg-white p-3 sm:rounded-b-2xl sm:border"
      >
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            notifyTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={t.chats.placeholder}
          className="max-h-32 flex-1 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
        <button
          disabled={sending || !draft.trim()}
          className="rounded-xl bg-rose-500 px-4 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
        >
          {t.chats.send}
        </button>
      </form>
    </>
  );
}
