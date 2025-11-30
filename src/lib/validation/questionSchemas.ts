/**
 * Zod validation schemas for quiz questions
 * Ensures type safety and runtime validation for list vs buzz questions
 */

import { z } from "zod";

// ============================================================================
// Segment and Question Type Schemas
// ============================================================================

export const segmentCodeSchema = z.enum([
  "WDYK",
  "AUCT",
  "BELL",
  "UPDW",
  "REMO",
]);
export const questionTypeSchema = z.enum(["list", "buzz"]);

// ============================================================================
// Answer Schemas (type-specific validation)
// ============================================================================

// For list questions: must be an array of unique strings
export const listAnswersSchema = z
  .array(z.string().trim().min(1, "Answer cannot be empty"))
  .min(1, "List questions must have at least one answer")
  .refine(
    (answers) => {
      const normalized = answers.map((a) => a.toLowerCase());
      return new Set(normalized).size === normalized.length;
    },
    { message: "List answers must be unique (case-insensitive)" }
  );

// For buzz questions: must be a single non-empty string
export const buzzAnswerSchema = z
  .string()
  .trim()
  .min(1, "Buzz answer cannot be empty");

// ============================================================================
// Base Question Schema (common fields)
// ============================================================================

const baseQuestionSchema = z.object({
  question_id: z.string().uuid().optional(),
  segment_code: segmentCodeSchema,
  question_text: z.string().min(10, "Question must be at least 10 characters"),
  total_answers_available: z.number().int().positive().nullable().optional(),
});

// ============================================================================
// Type-Specific Question Schemas
// ============================================================================

// List Question: WDYK, AUCT
export const listQuestionSchema = baseQuestionSchema.extend({
  question_type: z.literal("list"),
  answers: listAnswersSchema,
});

// Buzz Question: BELL, UPDW, REMO
export const buzzQuestionSchema = baseQuestionSchema.extend({
  question_type: z.literal("buzz"),
  answers: buzzAnswerSchema,
});

// ============================================================================
// Unified Question Schema (discriminated union)
// ============================================================================

export const questionSchema = z.discriminatedUnion("question_type", [
  listQuestionSchema,
  buzzQuestionSchema,
]);

// ============================================================================
// Question Insert/Update Schemas
// ============================================================================

export const questionInsertSchema = z.union([
  listQuestionSchema.omit({
    question_id: true,
  }),
  buzzQuestionSchema.omit({
    question_id: true,
  }),
]);

export const questionUpdateSchema = z.union([
  listQuestionSchema.partial().required({ question_id: true }),
  buzzQuestionSchema.partial().required({ question_id: true }),
]);

// ============================================================================
// Query Filter Schemas
// ============================================================================

export const questionFilterSchema = z.object({
  segment_code: segmentCodeSchema.optional(),
  question_type: questionTypeSchema.optional(),
  limit: z.number().int().positive().max(100).optional().default(10),
  offset: z.number().int().nonnegative().optional().default(0),
});

// ============================================================================
// Type Exports (infer from schemas)
// ============================================================================

export type SegmentCode = z.infer<typeof segmentCodeSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;

export type ListQuestion = z.infer<typeof listQuestionSchema>;
export type BuzzQuestion = z.infer<typeof buzzQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;

export type QuestionInsert = z.infer<typeof questionInsertSchema>;
export type QuestionUpdate = z.infer<typeof questionUpdateSchema>;
export type QuestionFilter = z.infer<typeof questionFilterSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates a question based on its type
 * @param data - Question data to validate
 * @returns Validated question or throws ZodError
 */
export function validateQuestion(data: unknown): Question {
  return questionSchema.parse(data);
}

/**
 * Validates question insert data
 * @param data - Question insert data to validate
 * @returns Validated question insert or throws ZodError
 */
export function validateQuestionInsert(data: unknown): QuestionInsert {
  return questionInsertSchema.parse(data);
}

/**
 * Validates question update data
 * @param data - Question update data to validate
 * @returns Validated question update or throws ZodError
 */
export function validateQuestionUpdate(data: unknown): QuestionUpdate {
  return questionUpdateSchema.parse(data);
}

/**
 * Validates question filter params
 * @param data - Filter params to validate
 * @returns Validated filter or throws ZodError
 */
export function validateQuestionFilter(data: unknown): QuestionFilter {
  return questionFilterSchema.parse(data);
}

/**
 * Checks if a question is a list question (type guard)
 */
export function isListQuestion(question: Question): question is ListQuestion {
  return question.question_type === "list";
}

/**
 * Checks if a question is a buzz question (type guard)
 */
export function isBuzzQuestion(question: Question): question is BuzzQuestion {
  return question.question_type === "buzz";
}

/**
 * Normalizes an answer for case-insensitive matching
 * @param answer - Answer string to normalize
 * @returns Normalized answer (trimmed, lowercase)
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

/**
 * Checks if a player's answer matches a correct answer (case-insensitive)
 * @param playerAnswer - Answer provided by player
 * @param correctAnswer - Correct answer from database
 * @returns True if answers match
 */
export function isAnswerCorrect(
  playerAnswer: string,
  correctAnswer: string
): boolean {
  return normalizeAnswer(playerAnswer) === normalizeAnswer(correctAnswer);
}

/**
 * Checks if a player's answer is in the list of valid answers
 * @param playerAnswer - Answer provided by player
 * @param validAnswers - Array of valid answers
 * @returns True if answer is valid
 */
export function isAnswerInList(
  playerAnswer: string,
  validAnswers: string[]
): boolean {
  const normalized = normalizeAnswer(playerAnswer);
  return validAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}
