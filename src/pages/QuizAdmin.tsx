/**
 * Quiz Admin Page
 *
 * Football-themed admin interface for creating and managing quiz questions.
 * Combines QuizCreator and QuestionBrowser components with a stadium aesthetic.
 */

import { useState } from "react";
import { QuizCreator } from "../components/QuizCreator";
import { QuestionBrowser } from "../components/QuestionBrowser";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, BookOpen, Trophy, Target } from "lucide-react";

type Tab = "create" | "browse";

export const QuizAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("create");

  return (
    <div className="min-h-screen bg-linear-to-b from-green-950 via-green-900 to-green-950 relative overflow-hidden">
      {/* Stadium Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 50px,
            rgba(255, 255, 255, 0.05) 50px,
            rgba(255, 255, 255, 0.05) 51px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 50px,
            rgba(255, 255, 255, 0.05) 50px,
            rgba(255, 255, 255, 0.05) 51px
          )`,
          }}
        />
      </div>

      {/* Floodlight Effect */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-0 right-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header - Stadium Style */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-glow" />
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
              Quiz Command Center
            </h1>
            <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-glow" />
          </div>
          <p className="text-green-200 text-lg font-medium">
            Manage questions for all quiz segments • Build your football
            knowledge empire
          </p>
        </motion.div>

        {/* Tab Navigation - Football Field Style */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-2 border-2 border-green-500/30 shadow-2xl inline-flex gap-2">
            <button
              onClick={() => setActiveTab("create")}
              className={`
                relative px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300
                flex items-center gap-3
                ${
                  activeTab === "create"
                    ? "bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105"
                    : "text-green-200 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <PlusCircle className="w-6 h-6" />
              <span>Create Question</span>
              {activeTab === "create" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-linear-to-r from-green-600 to-emerald-600 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("browse")}
              className={`
                relative px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300
                flex items-center gap-3
                ${
                  activeTab === "browse"
                    ? "bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                    : "text-green-200 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <BookOpen className="w-6 h-6" />
              <span>Browse Questions</span>
              {activeTab === "browse" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-linear-to-r from-blue-600 to-cyan-600 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          </div>
        </motion.div>

        {/* Content - Stadium Card Style */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-green-600/30 overflow-hidden"
          >
            {/* Section Header */}
            <div
              className={`
              p-6 border-b-4
              ${
                activeTab === "create"
                  ? "bg-linear-to-r from-green-600 to-emerald-600 border-green-700"
                  : "bg-linear-to-r from-blue-600 to-cyan-600 border-blue-700"
              }
            `}
            >
              <div className="flex items-center gap-3 text-white">
                {activeTab === "create" ? (
                  <>
                    <Target className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">
                        New Question Builder
                      </h2>
                      <p className="text-white/80">
                        Create engaging quiz questions for your matches
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">Question Library</h2>
                      <p className="text-white/80">
                        Browse, filter, and manage your question collection
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Component Content */}
            <div className="p-8">
              {activeTab === "create" && (
                <QuizCreator
                  onQuestionCreated={() => {
                    // Switch to browse tab after creation with delay
                    setTimeout(() => setActiveTab("browse"), 1500);
                  }}
                />
              )}
              {activeTab === "browse" && <QuestionBrowser />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center text-green-200 text-sm"
        >
          <p>
            ⚽ Powered by Tahadialthalatheen Quiz Engine • Built for football
            lovers by football lovers
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizAdmin;
