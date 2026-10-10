-- SeOUL MATE initial schema
-- Run in Supabase SQL Editor, or `supabase db push` with the Supabase CLI.

-- ─────────────────────────────────────────────────────────────
-- profiles: one row per auth user
-- ─────────────────────────────────────────────────────────────
create type public.user_role as enum ('traveler', 'guide');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url   text,
  role         public.user_role,              -- null until onboarding is done
  nationality  text,
  languages    text[] not null default '{}',
  bio          text,
  contact      text,                          -- optional: KakaoTalk ID, Instagram, etc.
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Create a profile automatically when a user signs up (Google / Kakao)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'preferred_username',
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- guide_requests: a traveler asks for a volunteer guide
-- ─────────────────────────────────────────────────────────────
create type public.request_status as enum ('open', 'matched', 'completed', 'cancelled');

create table public.guide_requests (
  id               uuid primary key default gen_random_uuid(),
  traveler_id      uuid not null references public.profiles (id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 100),
  description      text not null default '' check (char_length(description) <= 2000),
  area             text not null,                       -- e.g. Myeongdong, Hongdae
  travel_date      date not null,
  duration_hours   smallint not null default 3 check (duration_hours between 1 and 12),
  group_size       smallint not null default 1 check (group_size between 1 and 20),
  languages        text[] not null default '{}',        -- languages the traveler speaks
  status           public.request_status not null default 'open',
  matched_guide_id uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index guide_requests_status_date_idx on public.guide_requests (status, travel_date);
create index guide_requests_traveler_idx on public.guide_requests (traveler_id);

-- ─────────────────────────────────────────────────────────────
-- chat_rooms / messages: 1:1 chat between traveler and a guide per request
-- ─────────────────────────────────────────────────────────────
create table public.chat_rooms (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.guide_requests (id) on delete cascade,
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  guide_id    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (request_id, guide_id),
  check (traveler_id <> guide_id)
);

create index chat_rooms_traveler_idx on public.chat_rooms (traveler_id);
create index chat_rooms_guide_idx on public.chat_rooms (guide_id);

create table public.messages (
  id         bigint generated always as identity primary key,
  room_id    uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_room_created_idx on public.messages (room_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- updated_at helper
-- ─────────────────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger guide_requests_updated_at before update on public.guide_requests
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.guide_requests enable row level security;
alter table public.chat_rooms     enable row level security;
alter table public.messages       enable row level security;

-- helper: is the current user a participant of the room? (security definer avoids RLS recursion)
create function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.chat_rooms r
    where r.id = p_room_id
      and (select auth.uid()) in (r.traveler_id, r.guide_id)
  );
$$;

-- profiles: any signed-in user can view profiles; only the owner can edit
create policy "profiles are viewable by signed-in users"
  on public.profiles for select to authenticated using (true);
create policy "users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- guide_requests
create policy "view open, own, or involved requests"
  on public.guide_requests for select to authenticated
  using (
    status = 'open'
    or traveler_id = (select auth.uid())
    or matched_guide_id = (select auth.uid())
    or exists (
      select 1 from public.chat_rooms r
      where r.request_id = guide_requests.id and r.guide_id = (select auth.uid())
    )
  );
create policy "travelers create own requests"
  on public.guide_requests for insert to authenticated
  with check (traveler_id = (select auth.uid()) and status = 'open' and matched_guide_id is null);
create policy "travelers update own requests"
  on public.guide_requests for update to authenticated
  using (traveler_id = (select auth.uid()))
  with check (traveler_id = (select auth.uid()));
create policy "travelers delete own requests"
  on public.guide_requests for delete to authenticated
  using (traveler_id = (select auth.uid()));

-- chat_rooms: only a guide can open a room, only on an open request, never on their own request
create policy "participants view rooms"
  on public.chat_rooms for select to authenticated
  using ((select auth.uid()) in (traveler_id, guide_id));
create policy "guides open rooms on open requests"
  on public.chat_rooms for insert to authenticated
  with check (
    guide_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'guide'
    )
    and exists (
      select 1 from public.guide_requests g
      where g.id = request_id and g.traveler_id = chat_rooms.traveler_id and g.status = 'open'
    )
  );

-- messages
create policy "participants read messages"
  on public.messages for select to authenticated
  using (public.is_room_member(room_id));
create policy "participants send messages"
  on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_room_member(room_id));

-- ─────────────────────────────────────────────────────────────
-- Realtime (WebSocket): broadcast new messages to subscribed clients.
-- RLS above is enforced for realtime subscribers too.
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
