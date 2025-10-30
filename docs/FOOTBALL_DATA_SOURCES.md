# Football Data Sources Research

## Overview

This document outlines free and accessible football data APIs for quiz question generation.

## Recommended APIs

### 1. **football-data.org** (Primary Choice) ⭐

- **URL**: https://www.football-data.org/
- **API Base**: `https://api.football-data.org/v4/`
- **Free Tier**: Access to top competitions forever (initial purpose)
- **Coverage**: Competitions, teams, matches, standings, scorers, players
- **Reliability**: 100% uptime (Last 30 days), ~403ms avg response time
- **Authentication**: API key required (free registration)

**Key Endpoints**:

```bash
# Get competitions
GET https://api.football-data.org/v4/competitions/

# Get league standings (e.g., Eredivisie)
GET https://api.football-data.org/v4/competitions/DED/standings

# Get top scorers (e.g., Serie A, limit=10)
GET https://api.football-data.org/v4/competitions/SA/scorers

# Get player matches
GET https://api.football-data.org/v4/persons/{playerId}/matches?status=FINISHED

# Get matchday fixtures (e.g., Premier League matchday 11)
GET https://api.football-data.org/v4/competitions/PL/matches?matchday=11
```

**Best For**:

- Current season data (standings, scorers, fixtures)
- Player career statistics
- League/competition metadata
- Match results and schedules

---

### 2. **API-Football (api-sports)** (Comprehensive)

- **URL**: https://www.api-football.com/
- **Dashboard**: https://dashboard.api-football.com
- **Coverage**: 1,100+ leagues & cups with livescore, standings, events, line-ups, players, odds, statistics
- **Features**: Pre-match & live odds, historical data, chat support
- **Free Plan**: Limited requests (check current limits)

**Data Available**:

- Livescore
- Fixtures & Results
- Teams & Standings
- Bookmakers & Odds
- Events & Line-ups
- Player Statistics
- Predictions

**Best For**:

- Historical data queries (multiple years available)
- Detailed match statistics
- Live match data (if needed for real-time features)
- Fantasy football statistics

---

### 3. **Transfermarkt** (Manual Scraping)

- **URL**: https://www.transfermarkt.com/
- **API**: No official API (web scraping required)
- **Data**: Player transfers, market values, career paths, club histories

**Notes**:

- Best for career path questions (REMO segment)
- Requires web scraping or manual data entry
- Check robots.txt and terms of service before scraping
- Consider caching scraped data locally

**Best For**:

- Career path questions (club-by-club player history)
- Transfer market values
- Player bio data (nationality, age, position)

---

## Integration Strategy

### Phase 1: Static Question Bank (Current)

- Manually curate questions from public football knowledge
- Store in `Questions` table with proper metadata
- Use web research for verification

### Phase 2: Semi-Automated Question Generation

- Use **football-data.org** for:
  - "Who is the top scorer in [competition]?" → `/competitions/{code}/scorers`
  - "Which team is first in [competition]?" → `/competitions/{code}/standings`
  - "How many goals did [player] score this season?" → `/persons/{id}/matches`
- Netlify function to fetch and transform API data into quiz questions
- Store generated questions with `metadata.source_api: "football-data.org"`

### Phase 3: Dynamic Real-Time Questions (Future)

- Query APIs during quiz setup to get current season data
- Example: "Name the current top 5 scorers in La Liga" with answers fetched live
- Requires caching strategy to avoid rate limits

---

## Rate Limits & Best Practices

### football-data.org

- **Free Tier**: Limited requests per minute (check docs for current limits)
- **Best Practice**: Cache responses for 24 hours minimum
- **Usage Pattern**: Fetch data during quiz setup, not during gameplay

### API-Football

- **Free Tier**: Check dashboard for current limits
- **Best Practice**: Use for historical data, avoid real-time queries in free tier

### General Guidelines

1. **Cache First**: Store API responses in Netlify Blobs or Supabase for 24-48 hours
2. **Fallback**: Always have static questions as fallback if API fails
3. **Attribution**: Credit data sources in quiz metadata
4. **Respect Limits**: Implement exponential backoff for failed requests

---

## Example Implementation

### Netlify Function: `/api/quiz/generate-question`

```typescript
import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const { segment, competition } = JSON.parse(event.body || "{}");

  // Example: Generate BELL question from top scorers
  if (segment === "BELL") {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${competition}/scorers?limit=5`,
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY },
      },
    );
    const data = await response.json();
    const topScorer = data.scorers[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        question_text: `Who is the current top scorer in ${competition}?`,
        answers: data.scorers.map((s) => s.player.name),
        correct_answer_index: 0,
        metadata: {
          source_api: "football-data.org",
          generated_at: new Date().toISOString(),
          season: data.season.id,
        },
      }),
    };
  }
};
```

---

## Next Steps

1. Register for free API key at football-data.org
2. Add `FOOTBALL_DATA_API_KEY` to environment variables
3. Create caching layer in Netlify Blobs for API responses
4. Build question generator UI in GameSetup.tsx
5. Test with live data from current season

---

## Resources

- [football-data.org Documentation](https://www.football-data.org/documentation/quickstart)
- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [Free Public APIs List](https://www.freepublicapis.com/football-data-api)
