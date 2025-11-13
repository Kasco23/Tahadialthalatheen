# 🎉 Get Your FREE AI Token (No Credit Card!)

## ✅ You're Using 100% FREE AI!

Your app now uses **Hugging Face Inference API** with **Llama 3.3 70B** via the **Groq provider** - completely FREE!

---

## 📝 Get Your Token (Takes 2 Minutes)

### Step 1: Create Hugging Face Account
1. Go to: https://huggingface.co/join
2. Sign up with email/GitHub/Google (FREE)

### Step 2: Generate Token
1. Go directly to: https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained
2. **Token name**: `Tahadialthalatheen`
3. **Type**: Already set to "Fine-grained"
4. **Permissions**: Already selected "Make calls to Inference Providers" ✅
5. Click **"Generate token"**
6. **COPY THE TOKEN** (starts with `hf_...`)

### Step 3: Add to Your Project
1. Open `.env.local` file in your project
2. Find this line:
   ```bash
   HUGGINGFACE_API_KEY=hf_YOUR_TOKEN_HERE
   ```
3. Replace `hf_YOUR_TOKEN_HERE` with your actual token
4. Save the file

### Step 4: Deploy to Netlify
1. Go to: https://app.netlify.com/sites/YOUR_SITE/configuration/env
2. Add new environment variable:
   - **Key**: `HUGGINGFACE_API_KEY`
   - **Value**: Your `hf_...` token
3. Click **Save**
4. Redeploy your site

---

## 🚀 What You're Getting (100% FREE)

### **Hugging Face FREE Tier Includes:**
- ✅ **Generous rate limits** (enough for personal use)
- ✅ **No credit card** required
- ✅ **Multiple providers**: Groq, Cerebras, SambaNova
- ✅ **State-of-the-art models**: Llama 3.3 70B, DeepSeek, etc.
- ✅ **No hidden fees**
- ✅ **Free forever** (not a trial!)

### **Your Current Setup:**
- **Model**: Llama 3.3 70B Instruct
- **Provider**: Groq (FREE & ultra-fast!)
- **Cost**: $0.00
- **Rate Limit**: Generous for personal projects
- **Context Window**: 128K tokens

---

## 🎯 How It Works

When a user asks: *"Who was La Liga top scorer last season?"*

1. **Frontend** (`AskFootball.tsx`) sends question to backend
2. **Backend** (`answer-football-question.mts`) calls Hugging Face API
3. **Llama 3.3 70B** (via Groq) analyzes the question:
   - Understands "La Liga" = Spanish league
   - Calculates "last season" = 2024/2025
   - Identifies intent = "find top scorer"
4. **Your function** fetches data from TransferMarkt
5. **Returns answer** with reasoning + confidence

---

## 🔧 Troubleshooting

### ❌ Error: "HUGGINGFACE_API_KEY not set"
- Make sure you added the token to `.env.local`
- Restart your dev server: `pnpm dev` or `netlify dev`

### ❌ Error: "Invalid token"
- Token must start with `hf_`
- Make sure you copied the ENTIRE token
- Generate a new one if needed

### ❌ Error: "Rate limit exceeded"
- FREE tier has generous limits for personal use
- If you hit limits, wait a few minutes
- Consider caching responses for common questions

### ⚠️ Fallback Mode Active
- If AI fails, the app uses a keyword-based fallback parser
- Still works, just less intelligent
- Check your token and internet connection

---

## 💡 Alternative FREE Providers

If Hugging Face doesn't work for you, here are other FREE options:

### 1. **Groq Direct API**
- Website: https://console.groq.com/
- Model: Llama 3.1 8B/70B
- Cost: Free tier with trial credits
- Speed: Ultra-fast (fastest in the market!)
- Setup: Get API key, replace client in code

### 2. **Google AI Studio**
- Website: https://aistudio.google.com/
- Model: Gemini 1.5 Flash
- Cost: Generous free tier
- Speed: Fast
- Setup: Similar to Hugging Face

### 3. **Cerebras**
- Website: https://cloud.cerebras.ai/
- Model: Llama 3.1 8B/70B
- Cost: Free tier (waitlist)
- Speed: Very fast
- Limits: 30 requests/min, 60K tokens/min

---

## 📊 Cost Comparison (Just to Show You're Saving!)

| Provider | Model | Cost | Your Cost |
|----------|-------|------|-----------|
| OpenAI | GPT-4o | $5.00 per 1M tokens | $0 |
| Anthropic | Claude Opus | $15.00 per 1M tokens | $0 |
| Groq | Llama 3.1 70B | $0.59 per 1M tokens | $0 |
| **Hugging Face** | **Llama 3.3 70B** | **FREE** | **$0** ✅ |

For a typical party session (50 questions):
- **OpenAI**: ~$0.50
- **You**: **$0.00** 🎉

---

## ✅ Next Steps

1. ✅ Get your FREE token (link above)
2. ✅ Add to `.env.local`
3. ✅ Test locally: `pnpm dev`
4. ✅ Ask: "Who was La Liga top scorer last season?"
5. ✅ Deploy to Netlify with token in environment variables
6. ✅ Enjoy FREE AI-powered football Q&A! ⚽

---

**Questions?** Check `docs/AI_QA.md` for full documentation.
