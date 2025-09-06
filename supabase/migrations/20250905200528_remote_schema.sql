SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_session_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Ensure always 6 digits (zero-padded)
  new.session_code := lpad((trunc(random() * 1000000))::text, 6, '0');
  return new;
end;
$$;


ALTER FUNCTION "public"."generate_session_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hash_host_password"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
begin
  -- Hash only if it's not already hashed (safety check)
  if new.host_password not like '$2a$%' then
    new.host_password := crypt(new.host_password, gen_salt('bf'));
  end if;
  return new;
end;
$_$;


ALTER FUNCTION "public"."hash_host_password"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_host_password"("p_session" "uuid", "p_password" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."verify_host_password"("p_session" "uuid", "p_password" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."DailyRoom" (
    "room_id" "uuid" NOT NULL,
    "room_url" "text" NOT NULL,
    "active_participants" "jsonb" DEFAULT '[]'::"jsonb",
    "host_permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "ready" boolean DEFAULT false
);


ALTER TABLE "public"."DailyRoom" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Participant" (
    "participant_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "video_presence" boolean DEFAULT false,
    "lobby_presence" "text" DEFAULT 'NotJoined'::"text" NOT NULL,
    "flag" "text",
    "team_logo_url" "text",
    "powerup_pass_used" boolean DEFAULT false,
    "powerup_alhabeed" boolean DEFAULT false,
    "powerup_bellegoal" boolean DEFAULT false,
    "powerup_slippyg" boolean DEFAULT false,
    CONSTRAINT "Participant_lobby_presence_check" CHECK (("lobby_presence" = ANY (ARRAY['NotJoined'::"text", 'Joined'::"text", 'Disconnected'::"text"]))),
    CONSTRAINT "Participant_role_check" CHECK (("role" = ANY (ARRAY['Host'::"text", 'Player1'::"text", 'Player2'::"text"])))
);


ALTER TABLE "public"."Participant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Score" (
    "score_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "segment_code" "text" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "Score_segment_code_check" CHECK (("segment_code" = ANY (ARRAY['WDYK'::"text", 'AUCT'::"text", 'BELL'::"text", 'UPDW'::"text", 'REMO'::"text"])))
);


ALTER TABLE "public"."Score" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SegmentConfig" (
    "config_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "segment_code" "text" NOT NULL,
    "questions_count" integer NOT NULL,
    CONSTRAINT "SegmentConfig_segment_code_check" CHECK (("segment_code" = ANY (ARRAY['WDYK'::"text", 'AUCT'::"text", 'BELL'::"text", 'UPDW'::"text", 'REMO'::"text"])))
);


ALTER TABLE "public"."SegmentConfig" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Session" (
    "session_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "host_password" "text" NOT NULL,
    "phase" "text" NOT NULL,
    "game_state" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "session_code" "text",
    CONSTRAINT "Session_game_state_check" CHECK (("game_state" = ANY (ARRAY['pre-quiz'::"text", 'active'::"text", 'post-quiz'::"text", 'concluded'::"text"]))),
    CONSTRAINT "Session_phase_check" CHECK (("phase" = ANY (ARRAY['Setup'::"text", 'Lobby'::"text", 'Full Lobby'::"text", 'In-Progress'::"text", 'Tie-Breaker'::"text", 'Results'::"text", 'Review'::"text"])))
);


ALTER TABLE "public"."Session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Strikes" (
    "strike_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "segment_code" "text" NOT NULL,
    "strikes" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "Strikes_segment_code_check" CHECK (("segment_code" = 'WDYK'::"text"))
);


ALTER TABLE "public"."Strikes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."DailyRoom"
    ADD CONSTRAINT "DailyRoom_pkey" PRIMARY KEY ("room_id");



ALTER TABLE ONLY "public"."Participant"
    ADD CONSTRAINT "Participant_pkey" PRIMARY KEY ("participant_id");



ALTER TABLE ONLY "public"."Score"
    ADD CONSTRAINT "Score_pkey" PRIMARY KEY ("score_id");



ALTER TABLE ONLY "public"."SegmentConfig"
    ADD CONSTRAINT "SegmentConfig_config_id_key" UNIQUE ("config_id");



ALTER TABLE ONLY "public"."SegmentConfig"
    ADD CONSTRAINT "SegmentConfig_pkey" PRIMARY KEY ("config_id");



ALTER TABLE ONLY "public"."SegmentConfig"
    ADD CONSTRAINT "SegmentConfig_session_id_segment_code_key" UNIQUE ("session_id", "segment_code");



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_session_code_key" UNIQUE ("session_code");



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."Strikes"
    ADD CONSTRAINT "Strikes_pkey" PRIMARY KEY ("strike_id");



ALTER TABLE ONLY "public"."SegmentConfig"
    ADD CONSTRAINT "segmentconfig_sessionid_segmentcode_unique" UNIQUE ("session_id", "segment_code");



CREATE OR REPLACE TRIGGER "hash_password_before_insert" BEFORE INSERT ON "public"."Session" FOR EACH ROW EXECUTE FUNCTION "public"."hash_host_password"();



CREATE OR REPLACE TRIGGER "set_session_code" BEFORE INSERT ON "public"."Session" FOR EACH ROW EXECUTE FUNCTION "public"."generate_session_code"();



ALTER TABLE ONLY "public"."DailyRoom"
    ADD CONSTRAINT "DailyRoom_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."Session"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Participant"
    ADD CONSTRAINT "Participant_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."Session"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Score"
    ADD CONSTRAINT "Score_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."Participant"("participant_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Score"
    ADD CONSTRAINT "Score_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."Session"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."SegmentConfig"
    ADD CONSTRAINT "SegmentConfig_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."Session"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Strikes"
    ADD CONSTRAINT "Strikes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."Participant"("participant_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Strikes"
    ADD CONSTRAINT "Strikes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."Session"("session_id") ON DELETE CASCADE;



CREATE POLICY "Allow host insert config" ON "public"."SegmentConfig" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow host insert strikes" ON "public"."Strikes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow host update config" ON "public"."SegmentConfig" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Allow host update strikes" ON "public"."Strikes" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Allow read config" ON "public"."SegmentConfig" FOR SELECT USING (true);



CREATE POLICY "Allow read dailyroom" ON "public"."DailyRoom" FOR SELECT USING (true);



CREATE POLICY "Allow read participants" ON "public"."Participant" FOR SELECT USING (true);



CREATE POLICY "Allow read scores" ON "public"."Score" FOR SELECT USING (true);



CREATE POLICY "Allow read sessions" ON "public"."Session" FOR SELECT USING (true);



CREATE POLICY "Allow read strikes" ON "public"."Strikes" FOR SELECT USING (true);



CREATE POLICY "Anyone can create a session" ON "public"."Session" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert DailyRoom" ON "public"."DailyRoom" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."DailyRoom" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "DailyRoom is readable" ON "public"."DailyRoom" FOR SELECT USING (true);



CREATE POLICY "Only host can manage scores" ON "public"."Score" USING (true) WITH CHECK (true);



CREATE POLICY "Only host can update DailyRoom" ON "public"."DailyRoom" FOR UPDATE USING (true);



CREATE POLICY "Only host can update session state" ON "public"."Session" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."Participant" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Participants are readable" ON "public"."Participant" FOR SELECT USING (true);



CREATE POLICY "Participants can join sessions" ON "public"."Participant" FOR INSERT WITH CHECK (true);



CREATE POLICY "Participants can update themselves" ON "public"."Participant" FOR UPDATE USING ((("auth"."uid"())::"text" = ("participant_id")::"text"));



ALTER TABLE "public"."Score" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Scores are readable" ON "public"."Score" FOR SELECT USING (true);



ALTER TABLE "public"."SegmentConfig" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Sessions are readable" ON "public"."Session" FOR SELECT USING (true);



ALTER TABLE "public"."Strikes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."DailyRoom";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Participant";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Score";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."SegmentConfig";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Session";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Strikes";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."generate_session_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_session_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_session_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_host_password"("p_session" "uuid", "p_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_host_password"("p_session" "uuid", "p_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_host_password"("p_session" "uuid", "p_password" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."DailyRoom" TO "anon";
GRANT ALL ON TABLE "public"."DailyRoom" TO "authenticated";
GRANT ALL ON TABLE "public"."DailyRoom" TO "service_role";



GRANT ALL ON TABLE "public"."Participant" TO "anon";
GRANT ALL ON TABLE "public"."Participant" TO "authenticated";
GRANT ALL ON TABLE "public"."Participant" TO "service_role";



GRANT ALL ON TABLE "public"."Score" TO "anon";
GRANT ALL ON TABLE "public"."Score" TO "authenticated";
GRANT ALL ON TABLE "public"."Score" TO "service_role";



GRANT ALL ON TABLE "public"."SegmentConfig" TO "anon";
GRANT ALL ON TABLE "public"."SegmentConfig" TO "authenticated";
GRANT ALL ON TABLE "public"."SegmentConfig" TO "service_role";



GRANT ALL ON TABLE "public"."Session" TO "anon";
GRANT ALL ON TABLE "public"."Session" TO "authenticated";
GRANT ALL ON TABLE "public"."Session" TO "service_role";



GRANT ALL ON TABLE "public"."Strikes" TO "anon";
GRANT ALL ON TABLE "public"."Strikes" TO "authenticated";
GRANT ALL ON TABLE "public"."Strikes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
