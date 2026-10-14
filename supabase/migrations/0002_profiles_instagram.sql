-- Add Instagram username to profiles.
-- Optional, entered by the user on the profile page; Kakao/Google OAuth does not provide it.
-- Stored without the leading "@". Instagram usernames: letters, numbers, "." and "_", max 30 chars.

alter table public.profiles
  add column instagram text
  constraint profiles_instagram_format check (instagram ~ '^[A-Za-z0-9._]{1,30}$');

-- One Instagram account per profile (case-insensitive)
create unique index profiles_instagram_key on public.profiles (lower(instagram));
