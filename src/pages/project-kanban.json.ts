import snapshot from '../data/project-progress.json';

// The page and this versioned response import the same checked snapshot.
export function GET() {
  return new Response(JSON.stringify(snapshot, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
