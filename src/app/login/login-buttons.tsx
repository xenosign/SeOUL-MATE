"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/client";

type Provider = "google" | "kakao";

export function LoginButtons({ next }: { next?: string }) {
  const { t } = useI18n();
  const [pending, setPending] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    setPending(provider);
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next) redirectTo.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo.toString() },
    });
    if (error) {
      alert(error.message);
      setPending(null);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        onClick={() => signIn("kakao")}
        disabled={pending !== null}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FEE500] font-medium text-black/85 transition hover:brightness-95 disabled:opacity-60"
      >
        <KakaoIcon />
        {pending === "kakao" ? t.login.redirecting : t.login.kakao}
      </button>
      <button
        onClick={() => signIn("google")}
        disabled={pending !== null}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"
      >
        <GoogleIcon />
        {pending === "google" ? t.login.redirecting : t.login.google}
      </button>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.48 2 10.77c0 2.77 1.86 5.2 4.66 6.57-.2.75-.74 2.72-.85 3.14-.13.52.19.51.4.37.17-.11 2.64-1.79 3.71-2.52.68.1 1.38.15 2.08.15 5.52 0 10-3.48 10-7.71S17.52 3 12 3z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
