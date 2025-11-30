import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";
import { validateQuestionInsert } from "../../src/lib/validation/questionSchemas";

/**
 * Create Question
 *
 * Creates a new question in the database.
 * Validates the question data using Zod schema.
 * Requires authentication.
 *
 * POST Body:
 * {
 *   segment_code: 'WDYK' | 'AUCT' | 'BELL' | 'UPDW' | 'REMO',
 *   question_type: 'list' | 'buzz',
 *   question_text: string,
 *   answers: string[] (for list) | string (for buzz),
 *   total_answers_available?: number
 * }
 */

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Parse and validate request body
    const body = await req.json();

    // Validate using Zod schema
    let validatedQuestion;
    try {
      validatedQuestion = validateQuestionInsert(body);
    } catch (validationError: any) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationError.errors || validationError.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insert question into database
    const { data, error } = await supabase
      .from("Questions")
      .insert({
        segment_code: validatedQuestion.segment_code,
        question_type: validatedQuestion.question_type,
        question_text: validatedQuestion.question_text,
        answers: validatedQuestion.answers as any, // JSONB can be array or string
        total_answers_available:
          validatedQuestion.total_answers_available || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create question",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ question: data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/questions/create",
};
