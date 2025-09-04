-- Add session_code column to Session table
ALTER TABLE "public"."Session" 
ADD COLUMN "session_code" text;

-- Create function to generate random session code
CREATE OR REPLACE FUNCTION generate_session_code() 
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure unique session code
CREATE OR REPLACE FUNCTION generate_unique_session_code() 
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := generate_session_code();
    
    SELECT EXISTS(
      SELECT 1 FROM "Session" WHERE session_code = new_code
    ) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate session_code on insert
CREATE OR REPLACE FUNCTION set_session_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.session_code IS NULL THEN
    NEW.session_code := generate_unique_session_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_session_code_before_insert
  BEFORE INSERT ON "public"."Session"
  FOR EACH ROW
  EXECUTE FUNCTION set_session_code();

-- Add unique constraint for session_code
ALTER TABLE "public"."Session" 
ADD CONSTRAINT "Session_session_code_unique" UNIQUE ("session_code");

-- Add not null constraint for session_code
ALTER TABLE "public"."Session" 
ALTER COLUMN "session_code" SET NOT NULL;