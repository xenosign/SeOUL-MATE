-- Acquisition tracking and a minimal report path, needed before public promotion.
--
-- signup_attributions: which channel (UTM) a user came from, recorded once when they finish
--   onboarding. Users can only insert their own row and cannot read any rows; the team reads
--   them in the Supabase dashboard.
-- reports: a participant reports the other person in a chat room. Reporters can see only their
--   own reports; the reported user never sees them.

-- ─────────────────────────────────────────────────────────────
-- signup_attributions
-- ─────────────────────────────────────────────────────────────
create table public.signup_attributions (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  role           public.user_role not null,              -- role chosen at onboarding
  utm_source     text check (utm_source ~ '^[a-z0-9_.-]{1,100}$'),   -- null = direct / unknown
  utm_medium     text check (utm_medium ~ '^[a-z0-9_.-]{1,100}$'),
  utm_campaign   text check (utm_campaign ~ '^[a-z0-9_.-]{1,100}$'),
  landing_path   text check (char_length(landing_path) <= 200),
  first_visit_at timestamptz,
  created_at     timestamptz not null default now()
);

create index signup_attributions_source_idx on public.signup_attributions (utm_source, created_at);

alter table public.signup_attributions enable row level security;

create policy "users record own attribution"
  on public.signup_attributions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
    and (first_visit_at is null or first_visit_at <= now())
  );

-- ─────────────────────────────────────────────────────────────
-- reports
-- References use `on delete set null` and the evidence is snapshotted at insert time, so a
-- reported user cannot erase a report by deleting their request (which cascades to the chat
-- room and its messages) or their account.
-- ─────────────────────────────────────────────────────────────
create type public.report_reason as enum
  ('harassment', 'inappropriate', 'money', 'safety', 'spam', 'other');

create table public.reports (
  id                    bigint generated always as identity primary key,
  reporter_id           uuid references public.profiles (id) on delete set null,
  reported_user_id      uuid references public.profiles (id) on delete set null,
  room_id               uuid references public.chat_rooms (id) on delete set null,
  reason                public.report_reason not null,
  details               text not null default '' check (char_length(details) <= 1000),
  -- snapshots filled by the prepare_report trigger
  reported_display_name text,
  messages_snapshot     jsonb not null default '[]'::jsonb,
  resolved_at           timestamptz,                    -- set by the team when handled
  created_at            timestamptz not null default now(),
  check (reporter_id <> reported_user_id),
  unique (reporter_id, reported_user_id, room_id)       -- one report per person per chat
);

create index reports_reported_user_idx on public.reports (reported_user_id, created_at);
create index reports_open_idx on public.reports (created_at) where resolved_at is null;

alter table public.reports enable row level security;

create policy "reporters view own reports"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()));

-- Only a room participant can report, only the other participant of that room, and only
-- after that person has sent at least one message there (blocks opening a room just to
-- file a report against a traveler).
create policy "participants report the other participant"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.chat_rooms r
      where r.id = reports.room_id
        and (select auth.uid()) in (r.traveler_id, r.guide_id)
        and reports.reported_user_id in (r.traveler_id, r.guide_id)
    )
    and exists (
      select 1 from public.messages m
      where m.room_id = reports.room_id and m.sender_id = reports.reported_user_id
    )
  );

-- Server-controlled fields, rate limit (10 reports per reporter per day) and evidence snapshot.
create function public.prepare_report()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.created_at := now();
  new.resolved_at := null;

  if (
    select count(*) from public.reports
    where reporter_id = new.reporter_id and created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'report rate limit exceeded' using errcode = 'P0001';
  end if;

  select p.display_name into new.reported_display_name
  from public.profiles p where p.id = new.reported_user_id;

  -- last 50 messages of the room, oldest first
  select coalesce(
    jsonb_agg(
      jsonb_build_object('sender_id', m.sender_id, 'content', m.content, 'created_at', m.created_at)
      order by m.created_at
    ),
    '[]'::jsonb
  )
  into new.messages_snapshot
  from (
    select sender_id, content, created_at from public.messages
    where room_id = new.room_id
    order by created_at desc
    limit 50
  ) m;

  return new;
end;
$$;

create trigger reports_prepare before insert on public.reports
  for each row execute function public.prepare_report();
