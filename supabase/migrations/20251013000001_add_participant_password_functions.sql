-- Function to hash a participant password using pgcrypto
-- This stores the password in the same secure way as host passwords
CREATE OR REPLACE FUNCTION "public"."hash_participant_password"("password_input" "text") 
RETURNS "text"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
  -- Use crypt with automatic salt generation (bf = blowfish algorithm)
  RETURN crypt(password_input, gen_salt('bf'));
END;
$$;

-- Function to verify a participant password
CREATE OR REPLACE FUNCTION "public"."verify_participant_password"(
  "participant_id_input" "uuid", 
  "password_input" "text"
) 
RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION "public"."hash_participant_password"("password_input" "text") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."hash_participant_password"("password_input" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."hash_participant_password"("password_input" "text") TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."verify_participant_password"("participant_id_input" "uuid", "password_input" "text") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."verify_participant_password"("participant_id_input" "uuid", "password_input" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."verify_participant_password"("participant_id_input" "uuid", "password_input" "text") TO "service_role";
