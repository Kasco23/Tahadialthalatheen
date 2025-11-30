import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";
import { validateQuestionUpdate } from "../../src/lib/validation/questionSchemas";

/**
 * Update Question
 *
 * Updates an existing question in the database.
 * Validates the question data using Zod schema.
 * Requires authentication and question_id.
 *
 * PUT Body:
 * {
 *   question_id: string (UUID),
 *   segment_code?: 'WDYK' | 'AUCT' | 'BELL' | 'UPDW' | 'REMO',
 *   question_type?: 'list' | 'buzz',
 *   question_text?: string,
 *   answers?: string[] (for list) | string (for buzz),
 *   difficulty?: 'easy' | 'medium' | 'hard',
 *   api_source?: 'manual' | 'transfermarkt',
 *   api_params?: object,
 *   metadata?: object
 * }
 */

export default async (req: Request, context: Context) => {
  // Only allow PUT requests
  if (req.method !== "PUT") {
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

    if (!body.question_id) {
      return new Response(
        JSON.stringify({ error: "question_id is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate using Zod schema
    let validatedQuestion;
    try {
      validatedQuestion = validateQuestionUpdate(body);
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

    // Prepare update object (only include provided fields)
    const updateData: any = {};
    if (validatedQuestion.segment_code)
      updateData.segment_code = validatedQuestion.segment_code;
    if (validatedQuestion.question_type)
      updateData.question_type = validatedQuestion.question_type;
    if (validatedQuestion.question_text)
      updateData.question_text = validatedQuestion.question_text;
    if (validatedQuestion.answers !== undefined)
      updateData.answers = validatedQuestion.answers;
    if (validatedQuestion.total_answers_available !== undefined)
      updateData.total_answers_available =
        validatedQuestion.total_answers_available;

    // Update question in database
    const { data, error} = await supabase
      .from("Questions")
      .update(updateData)
      .eq("question_id", validatedQuestion.question_id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to update question",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ question: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error updating question:", error);
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
  path: "/api/questions/update",
};
