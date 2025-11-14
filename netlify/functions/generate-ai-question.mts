import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";
import { InferenceClient } from "@huggingface/inference";

/**
 * Generate AI-Powered WDYK Question
 * 
 * Uses Llama 3.3 70B to understand complex football queries and generate questions
 * Perfect for questions that require:
 * - Historical knowledge (last season's finals)
 * - Multi-competition searches (UCL, UEL, UECL)
 * - Complex constraints (starters + bench players)
 * 
 * Request body (JSON):
 * {
 *   "prompt": string,               // Natural language description
 *   "sessionId": string,            // UUID of the session (optional)
 *   "generatedBy": string,          // UUID of the profile generating
 *   "segment": "WDYK"               // Segment type
 * }
 */

interface GenerateAIQuestionRequest {
  prompt: string;
  sessionId?: string;
  generatedBy: string;
  segment: "WDYK" | "BELL" | "AUCT" | "UPDW" | "REMO";
}

interface PlayerAnswer {
  name: string;
  team: string;
  against: string;
  competition: string;
  started: boolean;
  benched: boolean;
  subbed_in: boolean;
  subbed_out: boolean;
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body: GenerateAIQuestionRequest = await req.json();
    const { prompt, sessionId, generatedBy, segment } = body;

    // Validate inputs
    if (!prompt || !generatedBy || !segment) {
      return new Response(
        JSON.stringify({ error: "prompt, generatedBy, and segment are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize clients
    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const hfApiKey = Netlify.env.get("HUGGINGFACE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    if (!hfApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add HUGGINGFACE_API_KEY." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    const client = new InferenceClient(hfApiKey);

    const startTime = Date.now();

    // Step 1: Use AI to understand the question and generate data
    console.log(`🤖 Analyzing prompt: "${prompt}"`);
    
    const aiPrompt = `You are a football data expert. Generate detailed data for this football quiz question:

"${prompt}"

Current date: November 2025
Last season: 2024/2025

UEFA European Cup Finals include:
- UEFA Champions League (UCL)
- UEFA Europa League (UEL)  
- UEFA Europa Conference League (UECL)

For each player who participated in a European Cup Final last season (2024/2025) for the LOSING team:

Generate a JSON array of players with this structure:
{
  "question": "Name players who lost a European Cup Final last season (clubs only)",
  "players": [
    {
      "name": "Player Full Name",
      "team": "Team Name",
      "against": "Winning Team Name",
      "competition": "UCL/UEL/UECL",
      "started": true/false,
      "benched": true/false,
      "subbed_in": true/false,
      "subbed_out": true/false
    }
  ],
  "metadata": {
    "finals_included": ["Competition - Winner vs Loser"],
    "total_players": number,
    "competitions": ["UCL", "UEL", "UECL"]
  }
}

Include ALL players from the losing teams who were:
- In the starting XI
- On the bench (substitutes)

Be accurate with the 2024/2025 season European finals. Respond ONLY with valid JSON.`;

    const response = await client.chatCompletion({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      provider: "groq", // FREE & FAST!
      messages: [
        {
          role: "system",
          content: "You are a football statistics expert. Always respond with valid JSON only, no explanations."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      max_tokens: 3000, // Need more tokens for full player list
      temperature: 0.1, // Low for accurate facts
    });

    const aiResponse = response.choices[0]?.message?.content || "";
    console.log("🤖 AI Response length:", aiResponse.length);

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON");
    }

    const aiData = JSON.parse(jsonMatch[0]);
    const players: PlayerAnswer[] = aiData.players || [];
    const questionText = aiData.question || prompt;

    if (players.length === 0) {
      throw new Error("AI did not generate any player data");
    }

    console.log(`✅ Generated ${players.length} players from AI`);

    // Step 2: Format answers for quiz
    // For WDYK, each player name is a valid answer
    const answers = players.map(p => p.name);

    // Step 3: Create detailed metadata for display
    const metadata = {
      ...aiData.metadata,
      generation_method: "ai_llama33_70b",
      provider: "groq",
      prompt: prompt,
      players_with_details: players, // Full data for table display
      generation_time_ms: Date.now() - startTime,
      ai_model: "meta-llama/Llama-3.3-70B-Instruct",
    };

    // Step 4: Insert question into database
    const { data: insertedQuestion, error: insertError } = await supabase
      .from("questions")
      .insert({
        segment_code: segment,
        question_text: questionText,
        answers: answers,
        correct_answer_index: null, // WDYK is open-ended
        api_source: "ai_generated",
        metadata: metadata as any,
        session_id: sessionId || null,
        generated_by: generatedBy,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save question: ${insertError.message}`);
    }

    const generationTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        questionId: insertedQuestion.id,
        question: questionText,
        answers: answers,
        correct_answer_index: null,
        metadata: {
          ...metadata,
          total_answers: answers.length,
          generation_time_ms: generationTime,
        },
        // Include full player details for UI rendering
        playerDetails: players,
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "X-Generation-Time": `${generationTime}ms`,
          "X-AI-Provider": "groq",
          "X-AI-Model": "llama-3.3-70b",
        }
      }
    );

  } catch (error: any) {
    console.error("❌ Error generating AI question:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate question",
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
};

export const config: Config = {
  path: "/api/generate-ai-question",
};
