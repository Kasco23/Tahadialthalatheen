create table "public"."game_events" (
    "id" uuid not null default gen_random_uuid(),
    "game_id" text,
    "event_type" text not null,
    "event_data" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."game_events" enable row level security;

create table "public"."games" (
    "id" text not null,
    "host_name" text,
    "phase" text not null default '''CONFIG''::text'::text,
    "current_segment" text default ''::text,
    "current_question_index" integer default 0,
    "timer" integer default 0,
    "is_timer_running" boolean default false,
    "video_room_url" text,
    "video_room_created" boolean default false,
    "segment_settings" jsonb default '{"AUCT": 8, "BELL": 12, "REMO": 5, "SING": 6, "WSHA": 10}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "host_code" text not null default ''::text,
    "host_is_connected" boolean
);


alter table "public"."games" enable row level security;

create table "public"."players" (
    "id" text not null,
    "game_id" text,
    "name" text not null,
    "flag" text,
    "club" text,
    "role" text not null default 'playerA'::text,
    "score" integer default 0,
    "strikes" integer default 0,
    "is_connected" boolean default true,
    "special_buttons" jsonb default '{"PIT_BUTTON": true, "LOCK_BUTTON": true, "TRAVELER_BUTTON": true}'::jsonb,
    "joined_at" timestamp with time zone default now(),
    "last_active" timestamp with time zone default now()
);


alter table "public"."players" enable row level security;

CREATE UNIQUE INDEX game_events_pkey ON public.game_events USING btree (id);

CREATE UNIQUE INDEX games_pkey ON public.games USING btree (id);

CREATE INDEX idx_game_events_game_id ON public.game_events USING btree (game_id);

CREATE INDEX idx_games_created_at ON public.games USING btree (created_at);

CREATE INDEX idx_players_game_id ON public.players USING btree (game_id);

CREATE UNIQUE INDEX players_pkey ON public.players USING btree (id);

alter table "public"."game_events" add constraint "game_events_pkey" PRIMARY KEY using index "game_events_pkey";

alter table "public"."games" add constraint "games_pkey" PRIMARY KEY using index "games_pkey";

alter table "public"."players" add constraint "players_pkey" PRIMARY KEY using index "players_pkey";

alter table "public"."game_events" add constraint "game_events_game_id_fkey" FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE not valid;

alter table "public"."game_events" validate constraint "game_events_game_id_fkey";

alter table "public"."players" add constraint "players_game_id_fkey" FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE not valid;

alter table "public"."players" validate constraint "players_game_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_last_active()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."game_events" to "anon";

grant insert on table "public"."game_events" to "anon";

grant references on table "public"."game_events" to "anon";

grant select on table "public"."game_events" to "anon";

grant trigger on table "public"."game_events" to "anon";

grant truncate on table "public"."game_events" to "anon";

grant update on table "public"."game_events" to "anon";

grant delete on table "public"."game_events" to "authenticated";

grant insert on table "public"."game_events" to "authenticated";

grant references on table "public"."game_events" to "authenticated";

grant select on table "public"."game_events" to "authenticated";

grant trigger on table "public"."game_events" to "authenticated";

grant truncate on table "public"."game_events" to "authenticated";

grant update on table "public"."game_events" to "authenticated";

grant delete on table "public"."game_events" to "service_role";

grant insert on table "public"."game_events" to "service_role";

grant references on table "public"."game_events" to "service_role";

grant select on table "public"."game_events" to "service_role";

grant trigger on table "public"."game_events" to "service_role";

grant truncate on table "public"."game_events" to "service_role";

grant update on table "public"."game_events" to "service_role";

grant delete on table "public"."games" to "anon";

grant insert on table "public"."games" to "anon";

grant references on table "public"."games" to "anon";

grant select on table "public"."games" to "anon";

grant trigger on table "public"."games" to "anon";

grant truncate on table "public"."games" to "anon";

grant update on table "public"."games" to "anon";

grant delete on table "public"."games" to "authenticated";

grant insert on table "public"."games" to "authenticated";

grant references on table "public"."games" to "authenticated";

grant select on table "public"."games" to "authenticated";

grant trigger on table "public"."games" to "authenticated";

grant truncate on table "public"."games" to "authenticated";

grant update on table "public"."games" to "authenticated";

grant delete on table "public"."games" to "service_role";

grant insert on table "public"."games" to "service_role";

grant references on table "public"."games" to "service_role";

grant select on table "public"."games" to "service_role";

grant trigger on table "public"."games" to "service_role";

grant truncate on table "public"."games" to "service_role";

grant update on table "public"."games" to "service_role";

grant delete on table "public"."players" to "anon";

grant insert on table "public"."players" to "anon";

grant references on table "public"."players" to "anon";

grant select on table "public"."players" to "anon";

grant trigger on table "public"."players" to "anon";

grant truncate on table "public"."players" to "anon";

grant update on table "public"."players" to "anon";

grant delete on table "public"."players" to "authenticated";

grant insert on table "public"."players" to "authenticated";

grant references on table "public"."players" to "authenticated";

grant select on table "public"."players" to "authenticated";

grant trigger on table "public"."players" to "authenticated";

grant truncate on table "public"."players" to "authenticated";

grant update on table "public"."players" to "authenticated";

grant delete on table "public"."players" to "service_role";

grant insert on table "public"."players" to "service_role";

grant references on table "public"."players" to "service_role";

grant select on table "public"."players" to "service_role";

grant trigger on table "public"."players" to "service_role";

grant truncate on table "public"."players" to "service_role";

grant update on table "public"."players" to "service_role";

create policy "Allow All"
on "public"."game_events"
as permissive
for all
to public
using (true)
with check (true);


create policy "Anyone can create game_events"
on "public"."game_events"
as permissive
for insert
to public
with check (true);


create policy "Anyone can read game_events"
on "public"."game_events"
as permissive
for select
to public
using (true);


create policy "Anyone can create games"
on "public"."games"
as permissive
for insert
to public
with check (true);


create policy "Anyone can delete games"
on "public"."games"
as permissive
for delete
to public
using (true);


create policy "Anyone can read games"
on "public"."games"
as permissive
for select
to public
using (true);


create policy "Anyone can update games"
on "public"."games"
as permissive
for update
to public
using (true);


create policy "Anyone can create players"
on "public"."players"
as permissive
for insert
to public
with check (true);


create policy "Anyone can delete players"
on "public"."players"
as permissive
for delete
to public
using (true);


create policy "Anyone can read players"
on "public"."players"
as permissive
for select
to public
using (true);


create policy "Anyone can update players"
on "public"."players"
as permissive
for update
to public
using (true);


CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_last_active BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION update_last_active();


