# AI Questions - Quick Usage Guide

**For Party-Ready Use**

---

## What This Does

Generate football quiz questions by typing natural language like:
- "How many Premier League goals did Harry Kane score in 2017/18?"
- "List Manchester United squad from 2007/08 season"
- "Who won the Ballon d'Or in 2023?"

---

## How to Use (From GameSetup)

### 1. Enable Feature (One-Time Setup)

Add to `.env.local`:

```bash
VITE_ENABLE_AI_AUTHORING=true
```

### 2. Generate Questions

1. **Go to GameSetup** for your quiz session
2. Click **"🤖 Create Questions with AI"** button
3. **Type your prompt** (or pick from examples)
4. **Click "Parse Intent"** → See structured data
5. **Click "Fetch Answers"** → See generated question
6. **Click "Save Question"** → Saved to your library

### 3. Use in Game

1. **Return to GameSetup**
2. Click **"📝 Manage Questions"**
3. Select your AI-generated questions for each round
4. Start quiz!

---

## Prompt Examples That Work Well

### BELL (Stats Questions)
✅ "How many goals did Messi score in Champions League 2014/15?"  
✅ "Premier League assists for De Bruyne in 2019/20"  
✅ "Ronaldo stats for Real Madrid season 2016/17"

### WDYK (Name the Players)
✅ "Name players who won league titles in different countries"  
✅ "List Manchester United squad from 2007/08 season"  
✅ "Players who won Champions League with Barcelona"

### UPDW (Trophy Winners)
✅ "Who won the Ballon d'Or in 2023?"  
✅ "Which team won La Liga in 2018?"  
✅ "Champions League winners before 2010"

### REMO (Multi-Criteria)
✅ "Find players who won La Liga with Barcelona and Serie A with Juventus"  
✅ "Players who played for both Manchester United and Real Madrid"  
✅ "Defenders who won World Cup and Champions League"

---

## Troubleshooting

### "Failed to parse intent: No matching rules"

**Problem**: Your prompt doesn't match any of the 7 built-in patterns.

**Solutions**:
1. Try rephrasing using example patterns above
2. Use more specific wording (include player/team/season names)
3. Click "✏️ Switch to Manual Entry" (coming soon)

---

### "Couldn't find data matching your request"

**Problem**: Transfermarkt API doesn't have that data, or player/team name is misspelled.

**Solutions**:
1. Check spelling (use common names: "Messi" not "Lionel Messi")
2. Try a different season or competition
3. Verify the player actually played in that season

---

### "Not enough players found (need at least 3)"

**Problem**: Your filter is too strict.

**Solutions**:
1. Broaden criteria (fewer requirements)
2. Try a more common trophy/league
3. Remove year restrictions

---

### Answers Truncated Warning

**What it means**: Your question generated 100+ answers. We cap at 100 for game performance.

**Is this okay?** YES! For WDYK questions, 100 answers is plenty. The game will still work great.

---

## Mobile Use

**Phone too slow?** The AI parser works best on desktop. If your phone hangs:

1. Use desktop/laptop to generate questions
2. Questions save to your account
3. Play the quiz on any device (mobile works fine for playing!)

---

## Dev Mode Features

### Fast Testing (No Real API Calls)

```bash
# .env.local
VITE_USE_MOCKS=true
```

Mock mode returns hardcoded answers instantly. Great for:
- UI testing
- Checking layout
- Demos without internet

### Backend Detection

Watch the badges:
- 🚀 **GPU Accelerated** = WebGPU available (fastest)
- 💻 **CPU Mode** = WASM fallback (still fast)
- 🧪 **Mock Mode** = Using fixtures (dev only)

---

## Performance Expectations

- **Parse prompt**: ~5ms (rules-first, no AI model needed!)
- **Fetch answers**: ~100-300ms (with cache) or 1-3s (cold)
- **Save to DB**: ~200ms
- **Total**: Under 5 seconds from prompt to saved question

If slower, check:
1. Mock mode enabled? (instant responses)
2. Network connection? (Transfermarkt API)
3. Netlify function cold start? (first request is slower)

---

## Flag Reference

| Flag | Default | Purpose |
|------|---------|---------|
| `VITE_ENABLE_AI_AUTHORING` | `false` | Show AI button in GameSetup |
| `VITE_USE_MOCKS` | `false` | Use fixture data (dev) |
| `VITE_SUPABASE_DATABASE_URL` | - | Database connection |
| `VITE_SUPABASE_ANON_KEY` | - | Database auth |

---

## Party-Ready Checklist

Your feature is ready when:

- ✅ You can click "Create with AI" from GameSetup
- ✅ Each segment type (WDYK/BELL/UPDW/REMO) works with example prompts
- ✅ Questions save and appear in "Manage Questions"
- ✅ Questions work in actual gameplay
- ✅ Mobile doesn't crash (worst case: suggests using desktop)
- ✅ Error messages are clear and helpful

---

## What's Next?

**Already Works**:
- Rules-based parsing (90% of prompts)
- Transfermarkt API integration
- Save to database
- GameSetup integration

**Coming Soon**:
- Manual question editing after AI generation
- Admin view to review/disable bad questions
- Batch generation (5-10 questions at once)
- Custom difficulty estimation

---

## Need Help?

**Documentation**: `/docs/Features/AI_Intent_Authoring.md` (500+ lines, technical details)

**Quick Questions**:
- "How do I enable this?" → Add `VITE_ENABLE_AI_AUTHORING=true` to `.env.local`
- "Why isn't it working?" → Check console for errors, try mock mode
- "Can I edit AI questions?" → Not yet, but save + manual edit in QuestionManager works

**Common Fixes**:
- Clear browser cache
- Restart `netlify dev`
- Check `.env.local` has all required vars
- Verify Supabase connection

---

**Last Updated**: January 2025  
**Status**: Party-Ready for Private Use  
**Performance**: <5s end-to-end (parse → fetch → save)
