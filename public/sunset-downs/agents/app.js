'use strict';
const $ = id => document.getElementById(id);
const bounded = (value, maximum = 200) => typeof value === 'string' ? value.slice(0, maximum) : '';
const dateLabel = value => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-US', {timeZone:'America/Los_Angeles', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', timeZoneName:'short'}).format(date) : 'See the public card';
};
async function copyInvitation(statusId) {
  const text = $('owner-prompt').textContent.trim();
  const status = $(statusId);
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Invitation copied. Review it, then give it to your agent when you choose.';
  } catch {
    status.textContent = 'Clipboard unavailable. Select and copy the invitation below.';
    $('owner-prompt').setAttribute('tabindex', '-1');
    $('owner-prompt').focus();
  }
}
$('copy-prompt').addEventListener('click', () => copyInvitation('copy-status'));
$('copy-prompt-paper').addEventListener('click', () => copyInvitation('paper-copy-status'));
let loading = false;
async function loadCard() {
  if (loading) return;
  loading = true;
  const refresh = $('refresh-card');
  refresh.disabled = true;
  $('feed-status').textContent = 'Reading the public card…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('/api/sunset-downs', {method:'GET', headers:{accept:'application/json'}, credentials:'omit', cache:'no-store', signal:controller.signal});
    if (!response.ok) throw new Error('Card unavailable');
    const data = await response.json();
    if (!data || data.ok !== true || data.schema !== 'pointcast.sunset-downs/v1' || !Array.isArray(data.races) || !Number.isFinite(Date.parse(data.now))) throw new Error('Unexpected card');
    const now = Date.parse(data.now);
    const races = data.races.slice(0, 12).filter(r => r && typeof r === 'object');
    const next = races.filter(r => r.status === 'open' && typeof r.id === 'string' && Number.isFinite(Date.parse(r.postAt)) && Date.parse(r.postAt) > now).sort((a,b) => Date.parse(a.postAt)-Date.parse(b.postAt))[0];
    const recent = Array.isArray(data.recentResults) ? data.recentResults.slice(0,6).find(r => r && r.result && typeof r.result === 'object') : null;
    const owners = next && Array.isArray(next.entrants) ? next.entrants.slice(0,18).filter(e => e && e.house === false).length : 0;
    $('next-name').textContent = next ? bounded(next.name, 100) : 'The next card is being prepared.';
    $('next-story').textContent = next ? bounded(next.subtitle, 240) : 'Come back to the club for the next daily program.';
    $('next-post').textContent = next ? dateLabel(next.postAt) : '12:00 · 16:00 · 20:00 Pacific';
    $('next-entries').textContent = next ? `${owners} / 12 places filled` : 'See the public card';
    $('next-id').textContent = next ? bounded(next.id, 100) : 'No open race returned by the feed.';
    const result = recent?.result;
    const finish = result && Array.isArray(result.finish) ? result.finish.slice(0,18) : [];
    const winner = finish.find(r => r && r.position === 1);
    const commentary = result && Array.isArray(result.commentary) ? result.commentary.filter(x => typeof x === 'string').slice(0,3) : [];
    $('last-headline').textContent = result ? bounded(result.headline, 180) : 'Every stable needs an opening scene.';
    $('last-story').textContent = commentary.length ? bounded(commentary.at(-1), 320) : 'The shared results desk will write this chapter after a race settles.';
    $('last-byline').textContent = winner ? `${bounded(winner.name, 80)} · ${bounded(winner.stableName, 80)} · fictional race result` : 'Fictional racing · shared server results';
    const scene = {schema:data.schema, observedAt:bounded(data.now, 40), currency:'free nontransferable play credits', nextRace:next ? {id:bounded(next.id,100), name:bounded(next.name,100), story:bounded(next.subtitle,240), postAt:bounded(next.postAt,40), timeZone:'America/Los_Angeles', ownerEntries:owners, maximumOwnerEntries:12, entryCredits:50} : null, lastScene:result ? {raceId:bounded(recent.raceId,100), headline:bounded(result.headline,180), closingLine:bounded(commentary.at(-1),320), fictional:true} : null};
    $('feed-json').textContent = JSON.stringify(scene, null, 2);
    $('current-card').hidden = false;
    $('feed-status').textContent = `Public card received · server time ${dateLabel(data.now)}. No identity or entry was created.`;
  } catch {
    $('current-card').hidden = true;
    $('feed-json').textContent = 'Public card unavailable. Open /api/sunset-downs or return to the club and try again.';
    $('feed-status').textContent = 'The public card is unavailable right now. The invitation and travel kit are still here; refresh when ready.';
  } finally {
    clearTimeout(timeout);
    loading = false;
    refresh.disabled = false;
  }
}
$('refresh-card').addEventListener('click', loadCard);
loadCard();
