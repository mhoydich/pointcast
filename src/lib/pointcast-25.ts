export type PointCast25Signal =
  | 'title-weather'
  | 'playoff-weather'
  | 'fault-line'
  | 'outsider';

export interface PointCast25Team {
  rank: number;
  school: string;
  short: string;
  conference: string;
  movement: 'NEW' | `+${number}` | `-${number}` | '—';
  signal: PointCast25Signal;
  accent: string;
  reason: string;
  case: string;
  doubt: string;
  proof: string;
}

import currentBoard from './pointcast-25-board-001.frozen.json';

export const POINTCAST_25 = { ...currentBoard, teams: currentBoard.teams as (PointCast25Team & { record: string; lastResult: string; previousRank: number | null; movementReason: string; sourceUrl: string })[] };

export const POINTCAST_25_SIGNAL_LABELS: Record<PointCast25Signal, string> = {
  'title-weather': 'Title weather',
  'playoff-weather': 'Playoff weather',
  'fault-line': 'Fault line',
  outsider: 'Outsider',
};

// Ledger entries are frozen literals, never derived from the live POINTCAST_25
// object — a published board's row must not move when the next board edits the lib.
export const POINTCAST_25_EDITIONS = [
{
  "board": "001",
  "status": "week-4",
  "publishedAt": "2026-09-23T10:30:00-07:00",
  "question": "If everybody played next Saturday, which 25 teams would we believe in most?",
  "leaders": [
    {
      "rank": 1,
      "school": "Texas",
      "reason": "The lead belongs to Texas; now make it travel."
    },
    {
      "rank": 2,
      "school": "Georgia",
      "reason": "A convincing road result earns the second chair."
    },
    {
      "rank": 3,
      "school": "Ole Miss",
      "reason": "We were too low. The succession argument now has a scoreboard."
    },
    {
      "rank": 4,
      "school": "Notre Dame",
      "reason": "Still in the title conversation; this week we reward the sharper SEC evidence."
    },
    {
      "rank": 5,
      "school": "Miami",
      "reason": "A road conference win matters more than an immaculate-looking home score."
    }
  ],
  "integrity": "sha256:c8dcda4e2ac260095a81914cf06dbbd25078c4b906e8c55c43a30b93ddb70695",
  "human": "https://pointcast.xyz/25/boards/001",
  "snapshot": "https://pointcast.xyz/25/boards/001",
  "machine": "https://pointcast.xyz/25/boards/001.json",
  "current": "https://pointcast.xyz/25",
  "block": null
},
  {
    board: '000',
    status: 'preseason',
    publishedAt: '2026-07-27T11:25:00-07:00',
    question: 'If everybody played next Saturday, which 25 teams would we believe in most?',
    leaders: [
      { rank: 1, school: 'Ohio State', reason: 'The highest quarterback–receiver ceiling in the sport, carrying the season’s nastiest road schedule.' },
      { rank: 2, school: 'Notre Dame', reason: 'Unusual defensive continuity and fewer imaginary preseason dependencies than anyone else.' },
      { rank: 3, school: 'Texas', reason: 'The Arch Manning window is now; the unresolved run game keeps this from being No. 1.' },
      { rank: 4, school: 'Oregon', reason: 'Dante Moore, deep talent, championship capacity—and two new coordinators to assimilate.' },
      { rank: 5, school: 'Georgia', reason: 'Back-to-back SEC champions receive institutional trust until the rebuilt secondary spends it.' },
    ],
    integrity: 'sha256:2b34a571dfe7063517a8405a801b5b7c544f97f3d4b8a2feec4336cdfdf3333f',
    human: 'https://pointcast.xyz/b/0510',
    snapshot: 'https://pointcast.xyz/25/boards/000',
    machine: 'https://pointcast.xyz/25/boards/000.json',
    current: 'https://pointcast.xyz/25',
    block: '0510',
  },
] as const;
