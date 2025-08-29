

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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






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


CREATE OR REPLACE FUNCTION "public"."validate_security_upgrade"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  results json;
  insecure_policies integer := 0;
  total_policies integer := 0;
BEGIN
  -- Count total policies
  SELECT count(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count potentially insecure policies
  SELECT count(*) INTO insecure_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND (qual LIKE '%true%' AND qual NOT LIKE '%auth.uid()%');
  
  SELECT json_build_object(
    'timestamp', now(),
    'security_status', CASE 
      WHEN insecure_policies = 0 THEN 'SECURE'
      ELSE 'INSECURE'
    END,
    'total_policies', total_policies,
    'potentially_insecure', insecure_policies,
    'has_auth_columns', json_build_object(
      'games_host_id', EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'host_id'
      ),
      'players_user_id', EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'user_id'
      )
    )
  ) INTO results;
  
  RETURN results;
END;
$$;


ALTER FUNCTION "public"."validate_security_upgrade"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_security_upgrade"() IS 'Validates that the security upgrade was successful and no insecure policies remain';


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
    "host_is_connected" boolean,
    "host_id" "uuid",
    "status" "text" DEFAULT 'waiting'::"text",
    "last_activity" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "games_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'active'::"text", 'completed'::"text"])))
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
    "last_active" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "is_host" boolean DEFAULT false,
    "session_id" "text"
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



CREATE INDEX "idx_games_host_id" ON "public"."games" USING "btree" ("host_id");



CREATE INDEX "idx_games_status" ON "public"."games" USING "btree" ("status");



CREATE INDEX "idx_players_game_id" ON "public"."players" USING "btree" ("game_id");



CREATE INDEX "idx_players_game_user" ON "public"."players" USING "btree" ("game_id", "user_id");



CREATE INDEX "idx_players_user_id" ON "public"."players" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_games_updated_at" BEFORE UPDATE ON "public"."games" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_players_last_active" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_active"();



ALTER TABLE ONLY "public"."game_events"
    ADD CONSTRAINT "game_events_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."game_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "game_events_delete_secure" ON "public"."game_events" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."games" "g"
  WHERE (("g"."id" = "game_events"."game_id") AND ("g"."host_id" = "auth"."uid"())))));



CREATE POLICY "game_events_insert_secure" ON "public"."game_events" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."players" "p"
  WHERE (("p"."game_id" = "game_events"."game_id") AND ("p"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."games" "g"
  WHERE (("g"."id" = "game_events"."game_id") AND ("g"."host_id" = "auth"."uid"()))))));



CREATE POLICY "game_events_select_secure" ON "public"."game_events" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."players" "p"
  WHERE (("p"."game_id" = "game_events"."game_id") AND ("p"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."games" "g"
  WHERE (("g"."id" = "game_events"."game_id") AND ("g"."host_id" = "auth"."uid"()))))));



ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "games_delete_secure" ON "public"."games" FOR DELETE TO "authenticated" USING (("host_id" = "auth"."uid"()));



CREATE POLICY "games_insert_secure" ON "public"."games" FOR INSERT TO "authenticated" WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "games_select_secure" ON "public"."games" FOR SELECT TO "authenticated", "anon" USING ((("status" = 'waiting'::"text") OR ("host_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."players"
  WHERE (("players"."game_id" = "games"."id") AND ("players"."user_id" = "auth"."uid"()))))));



CREATE POLICY "games_update_secure" ON "public"."games" FOR UPDATE TO "authenticated" USING (("host_id" = "auth"."uid"())) WITH CHECK (("host_id" = "auth"."uid"()));



ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "players_delete_secure" ON "public"."players" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."games" "g"
  WHERE (("g"."id" = "players"."game_id") AND ("g"."host_id" = "auth"."uid"()))))));



CREATE POLICY "players_insert_secure" ON "public"."players" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."games"
  WHERE (("games"."id" = "players"."game_id") AND ("games"."status" = 'waiting'::"text"))))));



CREATE POLICY "players_select_secure" ON "public"."players" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."players" "p2"
  WHERE (("p2"."game_id" = "players"."game_id") AND ("p2"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."games" "g"
  WHERE (("g"."id" = "players"."game_id") AND ("g"."host_id" = "auth"."uid"()))))));



CREATE POLICY "players_update_secure" ON "public"."players" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."games" "g"
  WHERE (("g"."id" = "players"."game_id") AND ("g"."host_id" = "auth"."uid"())))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."games" "g"
  WHERE (("g"."id" = "players"."game_id") AND ("g"."host_id" = "auth"."uid"()))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."game_events";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."games";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."players";






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



GRANT ALL ON FUNCTION "public"."validate_security_upgrade"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_security_upgrade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_security_upgrade"() TO "service_role";

































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
