# Features - Deprecated

**Last Updated**: November 14, 2025

## November 14, 2025

### AI/LLM Question Builder Feature

- **Deprecated On**: November 14, 2025
- **Reason**: Project direction change - exploring alternative quiz creation approach
- **Replacement**: TBD - New quiz creation feature to be developed
- **Status**: ❌ Completely Removed
- **Components Deprecated**:
  - CreateQuestions.tsx page
  - DebugLLM.tsx page
  - AskFootball.tsx page
  - LLMConsole.tsx component
  - src/lib/ai/ directory (intentParser, llmLoader, unifiedLLM, webGpuLLM)
  - aiUtils.ts library
- **Backend Functions Deprecated**:
  - answer-football-question.mts
  - generate-ai-question.mts
  - resolve-intent.mts
- **Dependencies Removed**:
  - @huggingface/inference
  - @xenova/transformers
- **Documentation Removed**:
  - AI_QA.md
  - AI_RELEASE_STATUS.md
  - FREE_AI_SETUP.md
  - HUGGINGFACE_FREE_TIER_GUIDE.md
  - Features/AI_Intent_Authoring.md
  - GET_FREE_AI_TOKEN.md
