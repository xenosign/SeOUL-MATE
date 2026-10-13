import { instagramUrl } from "@/lib/instagram";

export function InstagramLink({ username, className = "" }: { username: string; className?: string }) {
  return (
    <a
      href={instagramUrl(username)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-brand-600 hover:underline ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
      @{username}
    </a>
  );
}
