-- Fix all functions that use pgcrypto (gen_salt, crypt) to include proper search_path
-- The pgcrypto extension is installed in the 'extensions' schema (see line 33 in 20250908133643_remote_schema.sql)
-- Without proper search_path, PostgreSQL cannot find these functions, resulting in:
-- "function gen_salt(unknown) does not exist" error

-- 1. Fix hash_host_password trigger function
CREATE OR REPLACE FUNCTION "public"."hash_host_password"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET search_path = 'public, extensions'
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

-- 2. Fix verify_host_password function
CREATE OR REPLACE FUNCTION "public"."verify_host_password"("session_code_input" "text", "password_input" "text") 
RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = 'public, extensions'
    AS $$
DECLARE
  stored_password text;
BEGIN
  -- Get the stored hashed password for the session
  SELECT host_password INTO stored_password
  FROM public."Session"
  WHERE session_code = session_code_input;
  
  -- If session not found, return false
  IF stored_password IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify the password using crypt function
  RETURN crypt(password_input, stored_password) = stored_password;
END;
$$;

ALTER FUNCTION "public"."verify_host_password"("session_code_input" "text", "password_input" "text") OWNER TO "postgres";

-- 3. Fix hash_participant_password function
CREATE OR REPLACE FUNCTION "public"."hash_participant_password"("password_input" "text") 
RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = 'public, extensions'
AS $$
BEGIN
  -- Use crypt with automatic salt generation (bf = blowfish algorithm)
  RETURN crypt(password_input, gen_salt('bf'));
END;
$$;

ALTER FUNCTION "public"."hash_participant_password"("password_input" "text") OWNER TO "postgres";

-- 4. Fix verify_participant_password function
CREATE OR REPLACE FUNCTION "public"."verify_participant_password"(
  "participant_id_input" "uuid", 
  "password_input" "text"
) 
RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = 'public, extensions'
AS $$
DECLARE
  stored_password text;
BEGIN
  -- Get the stored hashed password for the participant
  SELECT password INTO stored_password
  FROM public."Participant"
  WHERE participant_id = participant_id_input;
  
  -- If participant not found or no password set, return false
  IF stored_password IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify the password using crypt function
  RETURN crypt(password_input, stored_password) = stored_password;
END;
$$;

ALTER FUNCTION "public"."verify_participant_password"("participant_id_input" "uuid", "password_input" "text") OWNER TO "postgres";

-- Maintain existing permissions for all functions
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "service_role";

GRANT ALL ON FUNCTION "public"."verify_host_password"("session_code_input" "text", "password_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_host_password"("session_code_input" "text", "password_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_host_password"("session_code_input" "text", "password_input" "text") TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."hash_participant_password"("password_input" "text") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."hash_participant_password"("password_input" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."hash_participant_password"("password_input" "text") TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."verify_participant_password"("participant_id_input" "uuid", "password_input" "text") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."verify_participant_password"("participant_id_input" "uuid", "password_input" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."verify_participant_password"("participant_id_input" "uuid", "password_input" "text") TO "service_role";
