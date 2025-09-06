create table public."DailyRoom" (
  room_id uuid not null,
  room_url text not null,
  active_participants jsonb null default '[]'::jsonb,
  host_permissions jsonb null default '{}'::jsonb,
  ready boolean null default false,
  constraint DailyRoom_pkey primary key (room_id),
  constraint DailyRoom_room_id_fkey foreign KEY (room_id) references "Session" (session_id) on delete CASCADE
) TABLESPACE pg_default;