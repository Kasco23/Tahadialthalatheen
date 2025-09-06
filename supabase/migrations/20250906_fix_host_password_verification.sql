-- Create function to verify host password
CREATE OR REPLACE FUNCTION public.verify_host_password(
  session_code_input text,
  password_input text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.verify_host_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_host_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_host_password(text, text) TO service_role;
