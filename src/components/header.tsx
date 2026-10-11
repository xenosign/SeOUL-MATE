import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { Avatar } from "./avatar";
import { LanguageSwitcher } from "./language-switcher";

export async function Header() {
  const [profile, { t }] = await Promise.all([getCurrentProfile(), getI18n()]);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-2 px-4">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          SeOUL<span className="text-rose-500"> MATE</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {profile && (
            <>
              <Link href="/requests" className="rounded-lg px-2 py-1.5 hover:bg-zinc-100 sm:px-3">
                {t.nav.requests}
              </Link>
              <Link href="/chats" className="rounded-lg px-2 py-1.5 hover:bg-zinc-100 sm:px-3">
                {t.nav.chats}
              </Link>
            </>
          )}
          <LanguageSwitcher />
          {profile ? (
            <Link href="/profile" className="ml-1 shrink-0" aria-label={t.nav.myProfile}>
              <Avatar src={profile.avatar_url} name={profile.display_name} size={32} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-lg bg-zinc-900 px-3 py-1.5 font-medium whitespace-nowrap text-white hover:bg-zinc-700"
            >
              {t.nav.signIn}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
