import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { Avatar } from "./avatar";

export async function Header() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          SeOUL<span className="text-rose-500"> MATE</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {profile ? (
            <>
              <Link href="/requests" className="rounded-lg px-3 py-1.5 hover:bg-zinc-100">
                Requests
              </Link>
              <Link href="/chats" className="rounded-lg px-3 py-1.5 hover:bg-zinc-100">
                Chats
              </Link>
              <Link href="/profile" className="ml-1" aria-label="My profile">
                <Avatar src={profile.avatar_url} name={profile.display_name} size={32} />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
