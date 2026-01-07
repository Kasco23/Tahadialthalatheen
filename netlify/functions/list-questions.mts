import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";
import { validateQuestionFilter } from "../../src/lib/validation/questionSchemas";

/**
 * List Questions
 *
 * Retrieves questions from the database with optional filtering.
 * Supports pagination and filtering by segment, type, difficulty, etc.
 *
 * GET Query params:
 * - segment_code?: 'WDYK' | 'AUCT' | 'BELL' | 'UPDW' | 'REMO'
 * - question_type?: 'list' | 'buzz'
 * - difficulty?: 'easy' | 'medium' | 'hard'
 * - limit?: number (default: 10, max: 100)
 * - offset?: number (default: 0)
 */

export default async (req: Request, context: Context) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse query params
    const url = new URL(req.url);
    const filters: any = {
      segment_code: url.searchParams.get("segment_code") || undefined,
      question_type: url.searchParams.get("question_type") || undefined,
      difficulty: url.searchParams.get("difficulty") || undefined,
      limit: parseInt(url.searchParams.get("limit") || "10"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    // Validate filters using Zod schema
    let validatedFilters;
    try {
      validatedFilters = validateQuestionFilter(filters);
    } catch (validationError: any) {
      return new Response(
        JSON.stringify({
          error: "Invalid filter parameters",
          details: validationError.errors || validationError.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase.from("Questions").select("*", { count: "exact" });

    // Apply filters
    if (validatedFilters.segment_code) {
      query = query.eq("segment_code", validatedFilters.segment_code);
    }
    if (validatedFilters.question_type) {
      query = query.eq("question_type", validatedFilters.question_type);
    }

    // Apply pagination
    query = query
      .range(
        validatedFilters.offset,
        validatedFilters.offset + validatedFilters.limit - 1
      )
      .order("question_id", { ascending: false });

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch questions",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        questions: data || [],
        pagination: {
          total: count || 0,
          limit: validatedFilters.limit,
          offset: validatedFilters.offset,
          hasMore:
            (count || 0) > validatedFilters.offset + validatedFilters.limit,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error listing questions:", error);
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
  path: "/api/questions/list",
};
