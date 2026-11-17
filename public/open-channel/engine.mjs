/** App-owned scripted story engine. No AI provider or Dessa protocol is implemented. */
export function createSession(scene) {
  if (!scene?.nodes?.start) throw new Error('Scene has no starting node');
  return { sceneId: scene.id, nodeId: null, turns: [], note: '' };
}
export function startSession(scene, session) {
  if (session.sceneId !== scene.id || session.nodeId) return session;
  return { ...session, nodeId: 'start', turns: [{ speaker: scene.character, text: scene.nodes.start.text }] };
}
export function chooseReply(scene, session, index) {
  if (session.sceneId !== scene.id || !Number.isInteger(index)) return session;
  const node = scene.nodes[session.nodeId];
  const choice = node?.choices?.[index];
  const next = choice && scene.nodes[choice.next];
  if (!next) return session;
  return { ...session, nodeId: choice.next, turns: [...session.turns, { speaker: 'You', text: choice.label }, { speaker: scene.character, text: next.text }] };
}
export function parseVoiceChoice(text, count) {
  const value = String(text).toLowerCase().trim().replace(/[.!?,]/g, '').replace(/\s+/g, ' ');
  const match = value.match(/^(?:(?:option|number|choice) )?(one|two|1|2)$/);
  if (!match) return -1;
  const index = ['one', '1'].includes(match[1]) ? 0 : 1;
  return index < count ? index : -1;
}
export function exportSession(scene, session) {
  const node = scene.nodes[session.nodeId];
  return [
    'OPEN CHANNEL / POINTCAST', `${scene.title} — ${scene.character}`, 'https://pointcast.xyz/open-channel/',
    'Scripted story demo. Optional narration. Dessa is not connected.', '',
    ...session.turns.map(turn => `${turn.speaker}: ${turn.text}\n`),
    node?.ending ? `ENDING: ${node.ending}\n` : 'Scene in progress.\n',
    session.note ? `MY NOTE\n${session.note}\n` : '',
  ].join('\n');
}
