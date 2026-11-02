export const PRACTICE_PACKET = Object.freeze({
  "schema": "signal-atlas.practice-packet/v1",
  "id": "signal-finder-v1",
  "fictional": true,
  "question": "Find the record about accessible audio controls and cite its supporting source.",
  "records": [
    {
      "recordId": "pkt_01",
      "title": "Weather path",
      "sourceId": "src_01",
      "excerpt": "A text forecast sample with an explicit observation date."
    },
    {
      "recordId": "pkt_02",
      "title": "Accessible audio controls",
      "sourceId": "src_02",
      "excerpt": "Playback has labelled play/pause and mute buttons that work with a keyboard."
    },
    {
      "recordId": "pkt_03",
      "title": "Museum map",
      "sourceId": "src_03",
      "excerpt": "A map legend lists the rooms. Step-free entry has not been checked."
    }
  ],
  "answerSchema": {
    "recordId": "string",
    "sourceId": "string"
  },
  "budgetCharacters": 500
});

export function evaluatePractice(input) {
  if (typeof input !== 'string' || input.length > 500) return { error: 'Keep the answer within 500 characters.' };
  let answer;
  try { answer = JSON.parse(input); } catch { return { error: 'Use valid JSON with the text fields recordId and sourceId.' }; }
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return { error: 'Use one JSON object with the two text fields recordId and sourceId.' };
  // This deliberately small task accepts a flat string-to-string object.
  // Count decoded keys before JSON.parse can hide duplicates (including escaped keys).
  const pair = /"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const matches = [...input.matchAll(pair)];
  const skeleton = input.replace(pair, 'PAIR');
  if (!/^\{\s*PAIR\s*(?:,\s*PAIR\s*)*\}$/.test(skeleton.trim())) {
    return { error: 'Use only the two text fields recordId and sourceId; no nested values or extra fields.' };
  }
  const keys = matches.map(match => JSON.parse('"' + match[1] + '"'));
  if (keys.length !== 2 || new Set(keys).size !== 2 || !keys.includes('recordId') || !keys.includes('sourceId') ||
      typeof answer.recordId !== 'string' || typeof answer.sourceId !== 'string') {
    return { error: 'Include recordId and sourceId exactly once each, with no extra fields.' };
  }
  if (!/^pkt_\d{2}$/.test(answer.recordId) || !/^src_\d{2}$/.test(answer.sourceId)) {
    return { error: 'Use the record and source IDs printed in the fictional packet.' };
  }
  const checks = { correctRecord: answer.recordId === 'pkt_02',
    supportingSource: answer.recordId === 'pkt_02' && answer.sourceId === 'src_02', exactShape: true };
  return { receipt: { schema: 'signal-atlas.local-practice-receipt/v1', mode: 'local-practice',
    packetId: PRACTICE_PACKET.id, fictional: true, answer: { recordId: answer.recordId, sourceId: answer.sourceId },
    checks, outcome: checks.correctRecord && checks.supportingSource ? 'matches-fixture' : 'needs-revision',
    submitted: false, signed: false, eligibleForStandings: false } };
}
