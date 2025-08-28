

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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."update_last_active"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_active"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."game_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "text",
    "event_type" "text" NOT NULL,
    "event_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."game_events" REPLICA IDENTITY FULL;


ALTER TABLE "public"."game_events" OWNER TO "anon";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "text" NOT NULL,
    "host_name" "text",
    "phase" "text" DEFAULT '''CONFIG''::text'::"text" NOT NULL,
    "current_segment" "text" DEFAULT ''::"text",
    "current_question_index" integer DEFAULT 0,
    "timer" integer DEFAULT 0,
    "is_timer_running" boolean DEFAULT false,
    "video_room_url" "text",
    "video_room_created" boolean DEFAULT false,
    "segment_settings" "jsonb" DEFAULT '{"AUCT": 8, "BELL": 12, "REMO": 5, "SING": 6, "WSHA": 10}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "host_code" "text" DEFAULT ''::"text" NOT NULL,
    "host_is_connected" boolean
);

ALTER TABLE ONLY "public"."games" REPLICA IDENTITY FULL;


ALTER TABLE "public"."games" OWNER TO "anon";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "text" NOT NULL,
    "game_id" "text",
    "name" "text" NOT NULL,
    "flag" "text",
    "club" "text",
    "role" "text" DEFAULT 'playerA'::"text" NOT NULL,
    "score" integer DEFAULT 0,
    "strikes" integer DEFAULT 0,
    "is_connected" boolean DEFAULT true,
    "special_buttons" "jsonb" DEFAULT '{"PIT_BUTTON": true, "LOCK_BUTTON": true, "TRAVELER_BUTTON": true}'::"jsonb",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_active" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."players" REPLICA IDENTITY FULL;


ALTER TABLE "public"."players" OWNER TO "anon";


ALTER TABLE ONLY "public"."game_events"
    ADD CONSTRAINT "game_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_game_events_game_id" ON "public"."game_events" USING "btree" ("game_id");



CREATE INDEX "idx_games_created_at" ON "public"."games" USING "btree" ("created_at");



CREATE INDEX "idx_players_game_id" ON "public"."players" USING "btree" ("game_id");



CREATE OR REPLACE TRIGGER "update_games_updated_at" BEFORE UPDATE ON "public"."games" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_players_last_active" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_active"();



ALTER TABLE ONLY "public"."game_events"
    ADD CONSTRAINT "game_events_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



CREATE POLICY "Allow All" ON "public"."game_events" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can create game_events" ON "public"."game_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create games" ON "public"."games" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create players" ON "public"."players" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can delete games" ON "public"."games" FOR DELETE USING (true);



CREATE POLICY "Anyone can delete players" ON "public"."players" FOR DELETE USING (true);



CREATE POLICY "Anyone can read game_events" ON "public"."game_events" FOR SELECT USING (true);



CREATE POLICY "Anyone can read games" ON "public"."games" FOR SELECT USING (true);



CREATE POLICY "Anyone can read players" ON "public"."players" FOR SELECT USING (true);



CREATE POLICY "Anyone can update games" ON "public"."games" FOR UPDATE USING (true);



CREATE POLICY "Anyone can update players" ON "public"."players" FOR UPDATE USING (true);



ALTER TABLE "public"."game_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


GRANT ALL ON SCHEMA "public" TO "postgres";
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_active"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



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
