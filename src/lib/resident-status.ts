import fs from 'node:fs';
import path from 'node:path';

export interface ResidentRun {
  taskId?: string;
  blockPath?: string;
  success?: boolean;
  minutes?: number;
  finishedAt?: string;
  artifacts?: string[];
}

export interface ResidentStatus {
  running: boolean;
  updatedAt: string | null;
  currentTask: { id?: string; project?: string } | null;
  successCount: number;
  failCount: number;
  computeHours: number;
  runs: ResidentRun[];
}

export function readResidentStatus(root = process.cwd()): ResidentStatus {
  const statusPath = path.join(root, '.pointcast/resident/status.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    return {
      running: Boolean(parsed.running),
      updatedAt: parsed.updatedAt ?? null,
      currentTask: parsed.currentTask ?? null,
      successCount: Number(parsed.successCount) || 0,
      failCount: Number(parsed.failCount) || 0,
      computeHours: Number(parsed.computeHours) || 0,
      runs: Array.isArray(parsed.runs) ? parsed.runs.slice(0, 10) : [],
    };
  } catch {
    return {
      running: false,
      updatedAt: null,
      currentTask: null,
      successCount: 0,
      failCount: 0,
      computeHours: 0,
      runs: [],
    };
  }
}
