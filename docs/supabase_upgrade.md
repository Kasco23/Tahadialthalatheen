# New Supabase changes

- This file only suggests new edits. Some improvements may change according to implementation details.

## 1 Rename **games** → **sessions** & fix PK/FK names

```sql
-- 1-A  rename table
alter table games rename to sessions;

-- 1-B  rename PK column so it’s explicit
alter table sessions rename column id to session_id;

-- 1-C  rename FK columns that reference games
alter table players      rename column game_id      to session_id;
alter table game_events  rename column game_id      to session_id;  -- will be replaced later
alter table rooms        rename column game_id      to session_id;  -- if it already exists

-- 1-D  update indexes & constraints with new names
-- (drop + recreate is simplest)
drop index if exists games_pkey;
alter table sessions drop constraint if exists games_pkey;
alter table sessions add constraint sessions_pkey primary key (session_id);
create index if not exists players_session_idx  on players(session_id);
```

The original `games` definition is here for reference .

---

## 2 New core tables

### 2-A **lobbies**

```sql
create table if not exists lobbies (
  session_id  text primary key references sessions(session_id) on delete cascade,
  host_connected   boolean not null default false,
  playerA_connected boolean not null default false,
  playerB_connected boolean not null default false,
  room_state       text default 'not_created',
  updated_at timestamptz default now()
);

-- realtime
alter publication supabase_realtime add table lobbies;
```

### 2-B **rooms**

```sql
create table if not exists rooms (
  room_id         uuid primary key default gen_random_uuid(),
  session_id      text references sessions(session_id) on delete cascade,
  daily_room_name text not null,
  url             text not null,
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  participant_count int default 0,
  recording_url   text,
  is_active       boolean default true
);

create index if not exists rooms_session_idx on rooms(session_id);
alter publication supabase_realtime add table rooms;
```

### 2-C **session_segments**

```sql
create table if not exists session_segments (
  session_id  text references sessions(session_id) on delete cascade,
  segment_code text,
  current_question int default 0,
  questions_total  int not null,
  playerA_strikes  int default 0,
  playerB_strikes  int default 0,
  primary key (session_id, segment_code)
);
alter publication supabase_realtime add table session_segments;
```

### 2-D **questions_pool** & **session_questions**

```sql
create table if not exists questions_pool (
  question_id uuid primary key default gen_random_uuid(),
  segment_code text not null,
  prompt text not null,
  choices jsonb,
  answer int,
  media_url text
);

create table if not exists session_questions (
  session_id text references sessions(session_id) on delete cascade,
  question_id uuid references questions_pool(question_id) on delete cascade,
  segment_code text not null,
  sequence int,
  primary key (session_id, question_id)
);
```

### 2-E Partitioned **session_events**

```sql
-- Enable partman if not already
create extension if not exists pg_partman;

create table if not exists session_events_template (
  event_id bigserial primary key,
  session_id text references sessions(session_id) on delete cascade,
  event_type text,
  payload jsonb,
  created_at timestamptz default now()
);

-- Parent table (range by month)
select partman.create_parent('public.session_events_template', 'created_at', 'partman', 'monthly');
-- Parent is now public.session_events
alter publication supabase_realtime add table session_events;
```

---

## 3 Update **players** table

```sql
alter table players
  rename column strikes to strikes_legacy,        -- keep old data
  rename column id      to player_id,
  add column slot       text   default null,      -- playerA / playerB / host
  add column is_host    boolean default false,
  add column session_id uuid;                     -- already renamed above

-- If strikes_legacy not needed you can drop after migrating:
-- alter table players drop column strikes_legacy;
```

---

## 4 Row-level security snippets (examples)

```sql
-- sessions: owner can do anything
create policy "controller_rw" on sessions
  for all
  using (auth.uid() = controller_user_id);

-- lobbies: visible to anyone linked to that session
create policy "lobby_read" on lobbies
  for select
  using (
    auth.uid() = (select controller_user_id from sessions s where s.session_id = lobbies.session_id)
    or auth.uid() in (select user_id from players p where p.session_id = lobbies.session_id)
  );
```

Adjust or copy this style to players, rooms, etc.

---

## 5 Realtime publication refresh

You already have a publication with three tables.
We added new tables above (`alter publication … add table …`).
If you prefer, drop & re-create:

```sql
drop publication if exists supabase_realtime;
create publication supabase_realtime
  for table sessions, lobbies, players, rooms,
      session_segments, session_events;
```

Below is an **add-on migration** that finishes the picture by covering Storage buckets, policies, and a few feature toggles (cron, webhooks, wrappers) that complement the table work we did earlier.

---

## 1 🗂 Buckets & Storage policies

### 1-A Create buckets

```sql
-- Existing bucket “images” stays; we’ll just document policies.
-- New buckets:
select storage.create_bucket('avatars',  public => true);      -- public read
select storage.create_bucket('question_media', public => true);
select storage.create_bucket('recordings',    public => false);
```

### 1-B Row-level policies (Storage uses its own ACL table)

```sql
-- 🔓 PUBLIC READ buckets
--  avatars & question_media:
--    Anyone can read, only owners upload/delete.

-- public read policy
insert into storage.policies (bucket_id, name, definition, action)
values
  ('avatars', 'public_read',       'true', 'SELECT'),
  ('question_media', 'public_read','true', 'SELECT');

-- owner write policy (same JSON for both buckets)
insert into storage.policies (bucket_id, name, definition, action)
select b, 'owner_write', 'auth.uid() = owner', a
from (values ('avatars'), ('question_media')) as x(b), (values ('INSERT'), ('UPDATE'), ('DELETE')) as y(a);

-- 🔒 recordings bucket: service-role only
insert into storage.policies (bucket_id, name, definition, action)
values
  ('recordings', 'service_write', 'auth.role() = ''service_role''', 'ALL');

-- ✓ if you keep “images” bucket
-- enforce same public-read for existing folders
insert into storage.policies (bucket_id, name, definition, action)
values ('images', 'public_read', 'true', 'SELECT')
on conflict do nothing;
```

> **Where “owner” comes from** – `storage.objects.owner` is automatically filled with the auth user ID when a file is uploaded via client libraries.

---

## 2 ⏰ Cron & housekeeping

```sql
-- nightly cleanup: mark finished sessions >2 days old & archive their events
create or replace function housekeeping_expired_sessions() returns void language plpgsql as $$
begin
  -- mark sessions completed if older than 48h and still in LOBBY/PLAYING
  update sessions
  set phase = 'COMPLETED'
  where phase in ('LOBBY','PLAYING')
    and created_at < now() - interval '48 hours';

  -- optionally detach Daily rooms etc.
end $$;

select cron.schedule('nightly_session_cleanup',
                     '0 4 * * *',
                     $$call housekeeping_expired_sessions();$$);
```

---

1. **Bucket uploads** –
   - avatars → `supabase.storage.from('avatars').upload(...)`
   - team-logos & UI icons stay in `images/team-logos` (public assets) – no code change.

2. **Daily recording workflow** –
   - After Daily webhook hits your Netlify function, move the file into `recordings` bucket with service-role key (`SUPABASE_SERVICE_ROLE_KEY`).
   - Store the `recording_url` back into `rooms.recording_url`.

3. **Front-end fetch** –
   - Avatar `img src={supabase.storage.from('avatars').getPublicUrl(file).data.publicUrl}`
   - Question images: same but from `question_media`.

4. **Environment vars** – no new vars; you already have `SUPABASE_SERVICE_ROLE_KEY` for serverless.

---

Run the SQL blocks above in the editor, commit policy changes, then:

_Refactor your Netlify functions and React code to point at the new buckets/files (VS Code Copilot can do the search-replace for bucket names)._

When the schema + storage are both good, we can start deleting legacy code paths and slimming the repo. Let me know when you’re ready to proceed or if you hit any SQL hurdles.
