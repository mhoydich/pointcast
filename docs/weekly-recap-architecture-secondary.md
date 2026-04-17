# This Week at PointCast: Weekly Recap Architecture

## Overview
The "This Week at PointCast" module provides a newspaper-style weekly dispatch summarizing the activity on PointCast. It distills the week's events into 5 headline statistics and a hero moment, published every Monday at 9:00 AM PT (17:00 UTC).

## 1. Data Flow & Architecture

The recap system relies on Cloudflare Workers Cron Triggers, KV storage, and Astro server-side rendering (or static generation with client hydration).

```mermaid
graph TD
    A[User Activity] -->|POST /api/drum| B(KV: VISITS)
    A -->|POST /api/visit| B
    A -->|POST /api/feedback| C(KV: FEEDBACK)
    
    D[Cloudflare Cron Trigger] -->|Monday 17:00 UTC| E(weekly-recap.ts)
    E -->|1. Fetch week's data| B
    E -->|2. Aggregate stats| E
    E -->|3. Save Recap JSON| F(KV: RECAPS)
    
    G[User visits Homepage] --> H(WeeklyRecapBlock.astro)
    H -->|Fetch latest| I(GET /api/recap)
    I -->|Read| F
    
    J[User visits /recap/2026-w16] --> K(recap/[week].astro)
    K -->|Read specific week| F
```

## 2. Recap Schema (TypeScript)

The recap object is designed to hold exactly what is needed for the newspaper-style display, avoiding unnecessary raw data.

```typescript
export interface WeeklyRecap {
  id: string; // e.g., "2026-w16"
  startDate: string; // ISO string
  endDate: string; // ISO string
  publishedAt: string; // ISO string
  
  // 5 Headline Stats
  totalDrums: number;
  newVisitors: number;
  topNounId: string;
  topNounVisits: number;
  topDrummerHandle: string;
  
  // 1 Hero Moment (Notable Event)
  heroMoment: {
    type: 'longest_session' | 'most_combos' | 'first_time_city';
    headline: string;
    description: string;
    value: string | number;
  };
  
  // Content Updates
  newDrops: Array<{
    title: string;
    url: string;
  }>;
}
```

## 3. Aggregation Strategy (Pseudocode)

The cron handler will execute the following aggregation logic:

```sql
-- Pseudocode for weekly aggregation
START_TIME = NOW() - 7 DAYS
END_TIME = NOW()

-- 1. Total Drums
total_drums = SUM(drums) WHERE timestamp BETWEEN START_TIME AND END_TIME

-- 2. Top Drummer
top_drummer = HANDLE WITH MAX(drums) WHERE timestamp BETWEEN START_TIME AND END_TIME

-- 3. New Visitors & Top Noun
visitors = GET ALL visits WHERE timestamp BETWEEN START_TIME AND END_TIME
new_visitors = COUNT(visitors)
top_noun = NOUN_ID WITH MAX(COUNT) FROM visitors

-- 4. Hero Moment Calculation
longest_session = MAX(session_duration) FROM drums
most_combos = MAX(combos) FROM drums
-- Select the most impressive stat as the hero moment

-- 5. Save to KV
KV.put("recap:2026-w16", JSON.stringify(recap_object))
KV.put("recap:latest", "2026-w16")
```

## 4. Caching & Edge Cases

### Cache Strategy
- **KV Storage**: The aggregated recap JSON is stored in Cloudflare KV under keys like `recap:2026-w16`.
- **Latest Pointer**: A special key `recap:latest` points to the ID of the most recent recap to allow fast retrieval for the homepage block.
- **Client-side**: The `/api/recap` endpoint should set appropriate `Cache-Control` headers (e.g., `public, max-age=3600`) since the data only changes weekly.

### Edge Cases
- **Zero Activity Week**: If there are no drums or visits, the cron job should still generate a recap object but with zeros and a default hero moment (e.g., "A quiet week at PointCast. The calm before the storm.").
- **Cron Failure**: A manual endpoint `/admin/recalc-recap?week=2026-w16` should be available to re-run the aggregation for a specific week if the cron job fails or data needs correction.
- **Timezone Handling**: All internal timestamps should be UTC. The cron trigger runs at 17:00 UTC (9:00 AM PT).
