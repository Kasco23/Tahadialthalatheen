/**
 * Question Browser Component
 *
 * Lists and manages existing questions with filtering and pagination.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { SegmentCode, DifficultyLevel } from "../lib/types/supabase";

// Segment configuration
const SEGMENT_CONFIG: Record<
  SegmentCode,
  { name: string; type: "list" | "buzz" }
> = {
  WDYK: { name: "What Do You Know", type: "list" },
  AUCT: { name: "Auction", type: "list" },
  BELL: { name: "Bell Round", type: "buzz" },
  UPDW: { name: "Upside-Down", type: "buzz" },
  REMO: { name: "Remontada", type: "buzz" },
};

interface Question {
  question_id: string;
  segment_code: SegmentCode;
  question_type: "list" | "buzz";
  question_text: string;
  answers: string | string[];
  difficulty: string;
  api_source: string;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export const QuestionBrowser: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [segmentFilter, setSegmentFilter] = useState<SegmentCode | "ALL">(
    "ALL"
  );
  const [difficultyFilter, setDifficultyFilter] = useState<
    DifficultyLevel | "ALL"
  >("ALL");

  // Fetch questions
  const fetchQuestions = async (offset: number = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "10",
        offset: offset.toString(),
      });

      if (segmentFilter !== "ALL") {
        params.append("segment_code", segmentFilter);
      }
      if (difficultyFilter !== "ALL") {
        params.append("difficulty", difficultyFilter);
      }

      const response = await fetch(`/api/questions/list?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch questions");
      }

      setQuestions(result.questions);
      setPagination(result.pagination);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and refetch on filter change
  useEffect(() => {
    fetchQuestions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentFilter, difficultyFilter]);

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.hasMore) {
      fetchQuestions(pagination.offset + pagination.limit);
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      fetchQuestions(Math.max(0, pagination.offset - pagination.limit));
    }
  };

  // Delete question
  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/questions/delete?question_id=${questionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete question");
      }

      // Refresh list
      fetchQuestions(pagination.offset);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Render answer preview
  const renderAnswers = (question: Question) => {
    if (question.question_type === "buzz") {
      return <span className="badge badge-primary">{question.answers}</span>;
    } else {
      const answers = Array.isArray(question.answers) ? question.answers : [];
      return (
        <div className="flex flex-wrap gap-1">
          {answers.slice(0, 3).map((answer: string, i: number) => (
            <span key={i} className="badge badge-secondary badge-sm">
              {answer}
            </span>
          ))}
          {answers.length > 3 && (
            <span className="badge badge-ghost badge-sm">
              +{answers.length - 3} more
            </span>
          )}
        </div>
      );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Question Browser</h2>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        {/* Segment Filter */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Segment</span>
          </label>
          <select
            className="select select-bordered"
            value={segmentFilter}
            onChange={(e) =>
              setSegmentFilter(e.target.value as SegmentCode | "ALL")
            }
          >
            <option value="ALL">All Segments</option>
            {(Object.keys(SEGMENT_CONFIG) as SegmentCode[]).map((code) => (
              <option key={code} value={code}>
                {code} - {SEGMENT_CONFIG[code].name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Difficulty</span>
          </label>
          <select
            className="select select-bordered"
            value={difficultyFilter}
            onChange={(e) =>
              setDifficultyFilter(e.target.value as DifficultyLevel | "ALL")
            }
          >
            <option value="ALL">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Questions List */}
      {!isLoading && questions.length === 0 && (
        <div className="text-center py-8 text-base-content/70">
          No questions found. Create your first question!
        </div>
      )}

      {!isLoading && questions.length > 0 && (
        <div className="space-y-4 mb-6">
          {questions.map((question) => (
            <motion.div
              key={question.question_id}
              className="card bg-base-100 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <span className="badge badge-primary">
                        {question.segment_code}
                      </span>
                      <span className="badge badge-outline">
                        {question.question_type === "list" ? "List" : "Buzz"}
                      </span>
                      <span className="badge badge-ghost">
                        {question.difficulty}
                      </span>
                    </div>
                    <h3 className="card-title text-lg mb-2">
                      {question.question_text}
                    </h3>
                    <div className="mb-2">
                      <span className="text-sm font-semibold">Answers: </span>
                      {renderAnswers(question)}
                    </div>
                    <p className="text-xs text-base-content/50">
                      Created:{" "}
                      {new Date(question.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => handleDelete(question.question_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && questions.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-base-content/70">
            Showing {pagination.offset + 1} -{" "}
            {pagination.offset + questions.length} of {pagination.total}
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm"
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
            >
              Previous
            </button>
            <button
              className="btn btn-sm"
              onClick={handleNextPage}
              disabled={!pagination.hasMore}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
