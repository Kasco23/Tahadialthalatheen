-- Migration: Add API-generated question tracking
-- Created: 2025-01-24
-- Phase: 3 of Transfermarkt Integration
-- Description: Add support for semi-automatic question generation using Transfermarkt API

-- ============================================================================
-- 1. Update Questions table to support API-generated questions
-- ============================================================================

-- Add new columns to Questions table
ALTER TABLE "Questions" 
ADD COLUMN IF NOT EXISTS "api_source" TEXT CHECK (api_source IN ('manual', 'transfermarkt')),
ADD COLUMN IF NOT EXISTS "api_params" JSONB,
ADD COLUMN IF NOT EXISTS "total_answers_available" INTEGER,
ADD COLUMN IF NOT EXISTS "answers_truncated" BOOLEAN DEFAULT false;

-- Set default value for existing questions
UPDATE "Questions" 
SET "api_source" = 'manual' 
WHERE "api_source" IS NULL;

-- Make api_source NOT NULL after setting defaults
ALTER TABLE "Questions" 
ALTER COLUMN "api_source" SET DEFAULT 'manual',
ALTER COLUMN "api_source" SET NOT NULL;

-- Add index for filtering API-generated questions
CREATE INDEX IF NOT EXISTS idx_questions_api_source ON "Questions"("api_source");

-- Add index for finding truncated questions
CREATE INDEX IF NOT EXISTS idx_questions_truncated ON "Questions"("answers_truncated") 
WHERE "answers_truncated" = true;

-- Add comment
COMMENT ON COLUMN "Questions"."api_source" IS 'Source of question: manual (user-created) or transfermarkt (API-generated)';
COMMENT ON COLUMN "Questions"."api_params" IS 'JSON parameters used to generate question from API (player_id, leagues, etc.)';
COMMENT ON COLUMN "Questions"."total_answers_available" IS 'Total number of valid answers (for 100+ scenarios)';
COMMENT ON COLUMN "Questions"."answers_truncated" IS 'True if answer list was truncated (display 100, but more exist)';

-- ============================================================================
-- 2. Create question_bank table (user collections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "question_bank" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "Profiles"("id") ON DELETE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "Questions"("question_id") ON DELETE CASCADE,
  "folder_name" TEXT,
  "tags" TEXT[] DEFAULT '{}',
  "is_favorite" BOOLEAN DEFAULT false,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique question per user
  UNIQUE("user_id", "question_id")
);

-- Indexes for question_bank
CREATE INDEX IF NOT EXISTS idx_question_bank_user ON "question_bank"("user_id");
CREATE INDEX IF NOT EXISTS idx_question_bank_question ON "question_bank"("question_id");
CREATE INDEX IF NOT EXISTS idx_question_bank_folder ON "question_bank"("folder_name");
CREATE INDEX IF NOT EXISTS idx_question_bank_favorite ON "question_bank"("is_favorite") WHERE "is_favorite" = true;
CREATE INDEX IF NOT EXISTS idx_question_bank_tags ON "question_bank" USING GIN("tags");

-- Comments
COMMENT ON TABLE "question_bank" IS 'User collections of questions (favorites, folders, tags)';
COMMENT ON COLUMN "question_bank"."folder_name" IS 'Optional folder for organization (e.g., "Premier League", "Easy Questions")';
COMMENT ON COLUMN "question_bank"."tags" IS 'Array of custom tags for categorization';

-- ============================================================================
-- 3. Create player_question_history table (performance tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "player_question_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "Profiles"("id") ON DELETE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "Questions"("question_id") ON DELETE CASCADE,
  "session_id" UUID REFERENCES "Sessions"("session_id") ON DELETE SET NULL,
  "answered_correctly" BOOLEAN NOT NULL,
  "time_taken_seconds" INTEGER,
  "points_earned" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for player_question_history
CREATE INDEX IF NOT EXISTS idx_player_question_history_user ON "player_question_history"("user_id");
CREATE INDEX IF NOT EXISTS idx_player_question_history_question ON "player_question_history"("question_id");
CREATE INDEX IF NOT EXISTS idx_player_question_history_session ON "player_question_history"("session_id");
CREATE INDEX IF NOT EXISTS idx_player_question_history_correct ON "player_question_history"("answered_correctly");

-- Composite index for user performance queries
CREATE INDEX IF NOT EXISTS idx_player_question_history_user_correct 
ON "player_question_history"("user_id", "answered_correctly");

-- Index for question difficulty analysis
CREATE INDEX IF NOT EXISTS idx_player_question_history_question_correct 
ON "player_question_history"("question_id", "answered_correctly");

-- Comments
COMMENT ON TABLE "player_question_history" IS 'Track player performance on questions (for statistics and difficulty analysis)';
COMMENT ON COLUMN "player_question_history"."answered_correctly" IS 'Whether the player answered correctly';
COMMENT ON COLUMN "player_question_history"."time_taken_seconds" IS 'Time taken to answer in seconds';
COMMENT ON COLUMN "player_question_history"."points_earned" IS 'Points earned for this answer';

-- ============================================================================
-- 4. Create generated_questions_metadata table (API generation tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "generated_questions_metadata" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL REFERENCES "Questions"("question_id") ON DELETE CASCADE UNIQUE,
  "generator_function" TEXT NOT NULL,
  "api_endpoint" TEXT NOT NULL,
  "cache_hit" BOOLEAN DEFAULT false,
  "generation_time_ms" INTEGER,
  "data_freshness" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for generated_questions_metadata
CREATE INDEX IF NOT EXISTS idx_generated_questions_metadata_question ON "generated_questions_metadata"("question_id");
CREATE INDEX IF NOT EXISTS idx_generated_questions_metadata_function ON "generated_questions_metadata"("generator_function");

-- Comments
COMMENT ON TABLE "generated_questions_metadata" IS 'Metadata for API-generated questions (caching, performance, freshness)';
COMMENT ON COLUMN "generated_questions_metadata"."generator_function" IS 'Netlify function used (e.g., generate-remontada-question)';
COMMENT ON COLUMN "generated_questions_metadata"."api_endpoint" IS 'Transfermarkt API endpoint called (e.g., /players/{id}/transfers)';
COMMENT ON COLUMN "generated_questions_metadata"."cache_hit" IS 'Whether data was served from cache';
COMMENT ON COLUMN "generated_questions_metadata"."generation_time_ms" IS 'Time taken to generate question in milliseconds';
COMMENT ON COLUMN "generated_questions_metadata"."data_freshness" IS 'Timestamp of underlying API data (from cache or fresh)';

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE "question_bank" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "player_question_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "generated_questions_metadata" ENABLE ROW LEVEL SECURITY;

-- question_bank policies
CREATE POLICY "Users can view their own question bank"
  ON "question_bank" FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "Users can add questions to their bank"
  ON "question_bank" FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can update their own question bank"
  ON "question_bank" FOR UPDATE
  USING (auth.uid() = "user_id");

CREATE POLICY "Users can delete from their own question bank"
  ON "question_bank" FOR DELETE
  USING (auth.uid() = "user_id");

-- player_question_history policies
CREATE POLICY "Users can view their own question history"
  ON "player_question_history" FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "System can insert question history"
  ON "player_question_history" FOR INSERT
  WITH CHECK (true); -- Any authenticated user can create history

CREATE POLICY "Question creators can view question statistics"
  ON "player_question_history" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Questions" q
      WHERE q."question_id" = "player_question_history"."question_id"
    )
  );

-- generated_questions_metadata policies
CREATE POLICY "Anyone can view generated question metadata"
  ON "generated_questions_metadata" FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create metadata"
  ON "generated_questions_metadata" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 6. Triggers for updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for question_bank
CREATE TRIGGER update_question_bank_updated_at
  BEFORE UPDATE ON "question_bank"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Useful views for statistics
-- ============================================================================

-- View: Question performance statistics
CREATE OR REPLACE VIEW "question_performance_stats" AS
SELECT 
  q."question_id" AS question_id,
  q."question_text",
  q."segment_code" AS segment,
  q."api_source",
  COUNT(h."id") AS total_attempts,
  SUM(CASE WHEN h."answered_correctly" THEN 1 ELSE 0 END) AS correct_answers,
  ROUND(
    (SUM(CASE WHEN h."answered_correctly" THEN 1 ELSE 0 END)::DECIMAL / 
     NULLIF(COUNT(h."id"), 0)) * 100, 
    2
  ) AS correct_percentage,
  AVG(h."time_taken_seconds") AS avg_time_seconds,
  MIN(h."time_taken_seconds") AS fastest_time_seconds,
  MAX(h."time_taken_seconds") AS slowest_time_seconds
FROM "Questions" q
LEFT JOIN "player_question_history" h ON q."question_id" = h."question_id"
GROUP BY q."question_id", q."question_text", q."segment_code", q."api_source";

COMMENT ON VIEW "question_performance_stats" IS 'Aggregated performance statistics for each question';

-- View: User question bank with details
CREATE OR REPLACE VIEW "user_question_bank_detailed" AS
SELECT 
  qb."id" AS bank_id,
  qb."user_id",
  qb."folder_name",
  qb."tags",
  qb."is_favorite",
  qb."notes",
  qb."created_at" AS added_to_bank_at,
  q."question_id" AS question_id,
  q."question_text",
  q."segment_code" AS segment,
  q."api_source",
  q."total_answers_available",
  q."answers_truncated",
  gm."generator_function",
  gm."cache_hit",
  gm."data_freshness"
FROM "question_bank" qb
JOIN "Questions" q ON qb."question_id" = q."question_id"
LEFT JOIN "generated_questions_metadata" gm ON q."question_id" = gm."question_id";

COMMENT ON VIEW "user_question_bank_detailed" IS 'User question bank with full question details and API metadata';

-- ============================================================================
-- 8. Helper functions
-- ============================================================================

-- Function to calculate question difficulty (based on correct answer rate)
CREATE OR REPLACE FUNCTION get_question_difficulty(question_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  correct_rate DECIMAL;
BEGIN
  SELECT 
    (SUM(CASE WHEN "answered_correctly" THEN 1 ELSE 0 END)::DECIMAL / 
     NULLIF(COUNT(*), 0)) * 100
  INTO correct_rate
  FROM "player_question_history"
  WHERE "question_id" = question_uuid;
  
  IF correct_rate IS NULL THEN
    RETURN 'Unrated';
  ELSIF correct_rate >= 80 THEN
    RETURN 'Easy';
  ELSIF correct_rate >= 50 THEN
    RETURN 'Medium';
  ELSIF correct_rate >= 30 THEN
    RETURN 'Hard';
  ELSE
    RETURN 'Very Hard';
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_question_difficulty IS 'Calculate question difficulty based on correct answer rate (Easy: 80%+, Medium: 50-80%, Hard: 30-50%, Very Hard: <30%)';

-- ============================================================================
-- Migration complete
-- ============================================================================
