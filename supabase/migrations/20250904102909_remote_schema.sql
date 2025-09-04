
  create table "public"."Strikes" (
    "strike_id" uuid not null default uuid_generate_v4(),
    "session_id" uuid not null,
    "participant_id" uuid not null,
    "segment_code" text not null,
    "strikes" integer not null default 0
      );


alter table "public"."Strikes" enable row level security;

CREATE UNIQUE INDEX "Strikes_pkey" ON public."Strikes" USING btree (strike_id);

alter table "public"."Strikes" add constraint "Strikes_pkey" PRIMARY KEY using index "Strikes_pkey";

alter table "public"."Strikes" add constraint "Strikes_participant_id_fkey" FOREIGN KEY (participant_id) REFERENCES "Participant"(participant_id) ON DELETE CASCADE not valid;

alter table "public"."Strikes" validate constraint "Strikes_participant_id_fkey";

alter table "public"."Strikes" add constraint "Strikes_segment_code_check" CHECK ((segment_code = 'WDYK'::text)) not valid;

alter table "public"."Strikes" validate constraint "Strikes_segment_code_check";

alter table "public"."Strikes" add constraint "Strikes_session_id_fkey" FOREIGN KEY (session_id) REFERENCES "Session"(session_id) ON DELETE CASCADE not valid;

alter table "public"."Strikes" validate constraint "Strikes_session_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.hash_host_password()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Hash only if it's not already hashed (safety check)
  if new.host_password not like '$2a$%' then
    new.host_password := crypt(new.host_password, gen_salt('bf'));
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_host_password(p_session uuid, p_password text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
declare
  stored_password text;
begin
  select host_password into stored_password
  from "Session"
  where session_id = p_session;

  if stored_password is null then
    return false;
  end if;

  return stored_password = crypt(p_password, stored_password);
end;
$function$
;

grant delete on table "public"."Strikes" to "anon";

grant insert on table "public"."Strikes" to "anon";

grant references on table "public"."Strikes" to "anon";

grant select on table "public"."Strikes" to "anon";

grant trigger on table "public"."Strikes" to "anon";

grant truncate on table "public"."Strikes" to "anon";

grant update on table "public"."Strikes" to "anon";

grant delete on table "public"."Strikes" to "authenticated";

grant insert on table "public"."Strikes" to "authenticated";

grant references on table "public"."Strikes" to "authenticated";

grant select on table "public"."Strikes" to "authenticated";

grant trigger on table "public"."Strikes" to "authenticated";

grant truncate on table "public"."Strikes" to "authenticated";

grant update on table "public"."Strikes" to "authenticated";

grant delete on table "public"."Strikes" to "service_role";

grant insert on table "public"."Strikes" to "service_role";

grant references on table "public"."Strikes" to "service_role";

grant select on table "public"."Strikes" to "service_role";

grant trigger on table "public"."Strikes" to "service_role";

grant truncate on table "public"."Strikes" to "service_role";

grant update on table "public"."Strikes" to "service_role";


  create policy "Allow host insert config"
  on "public"."SegmentConfig"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow host update config"
  on "public"."SegmentConfig"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Allow read config"
  on "public"."SegmentConfig"
  as permissive
  for select
  to public
using (true);



  create policy "Allow host insert strikes"
  on "public"."Strikes"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow host update strikes"
  on "public"."Strikes"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Allow read strikes"
  on "public"."Strikes"
  as permissive
  for select
  to public
using (true);



