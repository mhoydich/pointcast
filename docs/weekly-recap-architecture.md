# "This Week at PointCast" Weekly Recap Architecture

**Author:** Manus AI

The "This Week at PointCast" module is a comprehensive system designed to generate and serve a weekly dispatch of activity on the PointCast platform. This document outlines the architecture, data flow, schema design, and edge case handling for the module, which is built on Cloudflare Pages, Cloudflare Workers Cron Triggers, Cloudflare KV, and Astro.

## 1. System Architecture and Data Flow

The architecture is designed to be highly efficient, decoupling the heavy lifting of data aggregation from the frontend rendering. It leverages Cloudflare's edge network for both compute (via Workers) and storage (via KV), ensuring fast load times for end users.

The core of the system relies on a scheduled cron job that aggregates data from the `VISITS` and `FEEDBACK` KV namespaces, processes it into a lightweight JSON schema, and stores the result in a dedicated `RECAPS` KV namespace. The Astro frontend then consumes this JSON data either at build time (for static generation) or request time (for server-side rendering).

### Data Flow Diagram

```mermaid
graph TD
    %% User Interactions
    User[User Activity] -->|POST /api/drum| KV_Visits[(KV: VISITS)]
    User -->|POST /api/visit| KV_Visits
    User -->|POST /api/feedback| KV_Feedback[(KV: FEEDBACK)]
    
    %% Aggregation Layer
    Cron[Cloudflare Cron Trigger\nMonday 17:00 UTC] -->|Triggers| Handler(functions/cron/weekly-recap.ts)
    Handler -->|1. Fetch week's data| KV_Visits
    Handler -->|2. Aggregate stats| Handler
    Handler -->|3. Save Recap JSON| KV_Recaps[(KV: RECAPS)]
    
    %% Frontend Layer
    Home[User visits Homepage] --> Card(WeeklyRecapBlock.astro)
    Card -->|Fetch latest recap| API(GET /api/recap)
    API -->|Read| KV_Recaps
    
    Archive[User visits /recap/2026-w16] --> Page(recap/[week].astro)
    Page -->|Fetch specific week| API
```

## 2. Recap Schema Design

The data schema is intentionally designed to be "presentation-ready." Instead of storing raw data and computing statistics on the fly, the cron handler computes the final values and stores them in a format that directly maps to the newspaper-style layout of the recap page. This approach minimizes the processing required on the frontend and ensures that the recap data remains immutable once generated.

The primary structure is the `WeeklyRecap` interface, which encapsulates the 5 headline statistics, the hero moment, and any content updates (drops) for the week.

### TypeScript Interface

```typescript
export interface WeeklyRecap {
  /** Unique week identifier in ISO week format: YYYY-wWW */
  id: string;
  startDate: string;
  endDate: string;
  publishedAt: string;
  
  // 5 Headline Stats
  totalDrums: number;
  topDrummerHandle: string;
  topDrummerCount: number;
  newVisitors: number;
  topNounId: string;
  topNounVisits: number;
  
  // Supporting Detail
  nounBreakdown: Array<{ nounId: string; visitCount: number }>;
  
  // 1 Hero Moment (Notable Event)
  heroMoment: {
    type: 'longest_session' | 'most_combos' | 'first_time_city' | 'quiet_week';
    headline: string;
    description: string;
    value: string;
    actor?: string;
  };
  
  // Content Updates
  newDrops: Array<{
    title: string;
    url: string;
    teaser?: string;
  }>;
  
  // Meta
  isQuietWeek: boolean;
}
```

## 3. Aggregation Strategy

The aggregation process is triggered automatically by a Cloudflare Cron Trigger scheduled for `0 17 * * 1` (Monday at 17:00 UTC, which corresponds to 9:00 AM PT).

### Aggregation Logic

1. **Determine Time Window**: The handler calculates the start and end timestamps for the most recently completed Monday-to-Sunday week.
2. **Data Retrieval**: It queries the `VISITS` KV namespace for keys matching the relevant prefixes (`drum:session:` and `visit:`) within the computed time window. The timestamp is extracted from the KV key names to filter the results efficiently without needing to parse every JSON value.
3. **Compute Headline Stats**:
   - `totalDrums`: Sum of the `count` field across all drum sessions in the window.
   - `topDrummerHandle`: The user handle associated with the highest cumulative drum count.
   - `newVisitors`: The total number of unique visit entries.
   - `topNounId`: The noun ID that appears most frequently in the visit entries.
4. **Determine Hero Moment**: The handler evaluates several potential "notable moments" and selects the most significant one based on a predefined priority:
   - *Priority 1*: First-time visitor from a new city (`first_time_city`).
   - *Priority 2*: Session with the most consecutive drum hits (`most_combos`).
   - *Priority 3*: Longest unbroken drum session (`longest_session`).
   - *Fallback*: If no notable activity occurred, a `quiet_week` moment is generated.
5. **Storage**: The resulting `WeeklyRecap` object is serialized to JSON and stored in the `RECAPS` KV namespace under a key formatted as `recap:YYYY-wWW`. A secondary key, `recap:latest`, is updated to point to this new ID, enabling fast retrieval of the most recent recap for the homepage.

## 4. Caching and Edge Cases

### Cache Strategy

Because the weekly recap data is immutable once generated, it is highly cacheable. The `/api/recap` endpoint leverages Cloudflare's CDN by setting aggressive `Cache-Control` headers:

```http
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

This configuration ensures that requests for recap data are served directly from the edge cache, minimizing KV read operations and reducing latency for the end user.

### Edge Cases

- **Zero Activity Week**: If the platform experiences a week with no drum taps or new visitors, the cron handler still generates a valid recap object. The `isQuietWeek` flag is set to `true`, all numerical stats are zeroed out, and the hero moment is set to a predefined "quiet week" message (e.g., "A quiet week at PointCast. The drums were silent, but the stage is set."). The frontend components are designed to handle this state gracefully, displaying a specialized notice instead of empty statistics.
- **Cron Failure or Data Correction**: In the event that the cron job fails to execute, or if historical data needs to be recalculated due to a bug fix, an administrative endpoint is available at `/api/recap?recalc=true`. This endpoint is protected by a shared secret (stored in the `ADMIN_SECRET` environment variable) and allows authorized users to manually trigger the aggregation logic for the current week.
- **Timezone Handling**: All internal timestamp calculations and data storage use UTC. The cron trigger is explicitly scheduled for 17:00 UTC to align with the desired 9:00 AM PT publication time, avoiding issues related to daylight saving time changes.

## 5. Frontend Integration

The frontend integration consists of two primary Astro components:

1. **`WeeklyRecapBlock.astro`**: A compact, newspaper-style card designed for the PointCast homepage. It fetches the `recap:latest` data from the API and displays a subset of the headline stats along with the hero moment. It includes a link to the full recap page.
2. **`recap/[week].astro`**: A dynamic route that renders the complete dispatch for a specific week. It presents all 5 headline stats, the hero moment, a noun leaderboard, and any new content drops. The design adheres to a "type heavy" aesthetic, utilizing serif fonts and tabular numbers to evoke the feel of a traditional printed newspaper, avoiding unnecessary images or complex charts.

Both components are built to support either Server-Side Rendering (SSR) or Static Site Generation (SSG) depending on the Astro configuration. In SSG mode, the `getStaticPaths` function queries the API for a list of all available week IDs to pre-render the archive pages.
