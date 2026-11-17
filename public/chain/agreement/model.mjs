// A local simulation. Actors are fixtures, not identities or signatures.
const PEOPLE = ['Ari', 'Bo'];
const INITIAL_TERMS = 'A short rhythm and an image for Friday’s listening room.';
const ALTERNATE_TERMS = 'A short rhythm and a different image for Friday’s listening room.';

export function createRoom() {
  return {
    schema: 'pointcast.agreement-simulation/1', step: 0, revision: 1,
    terms: INITIAL_TERMS, status: 'draft', accepted: false, approvals: {},
    changeRequested: false, reviewRequested: false, reviewSuggestion: false, agentSuggestion: false, events: [],
    privateNote: 'Example private feedback: the first image feels too busy.',
    expiresAt: '2030-01-01T00:00:00.000Z',
  };
}

// Deterministic fixture transitions. A real service would need authentication,
// durable concurrency control and trusted time; none is provided here.
export function applyEvent(room, event) {
  if (!event || typeof event.id !== 'string' || !event.id || event.id.length > 100) throw Error('An event ID is required.');
  const fingerprint = JSON.stringify(event);
  const prior = room.events.find(item => item.id === event.id);
  if (prior) {
    if (prior.fingerprint !== fingerprint) throw Error('Event ID conflicts with an earlier event.');
    return room;
  }
  if (!Number.isInteger(event.expectedStep) || event.expectedStep !== room.step) throw Error('This action is out of order.');
  if (!['Ari', 'Bo', 'Studio bot', 'Review desk'].includes(event.actor)) throw Error('Unknown example participant.');
  if (['cancelled', 'completed', 'expired'].includes(room.status)) throw Error('This example room is closed.');
  if (typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at))) throw Error('A valid example time is required.');
  if (Date.parse(event.at) >= Date.parse(room.expiresAt) && event.type !== 'expire') throw Error('This example has expired.');
  const next = structuredClone(room);
  const mustPerson = () => { if (!PEOPLE.includes(event.actor)) throw Error('Only an example collaborator can do that.'); };
  switch (event.type) {
    case 'invite':
      if (event.actor !== 'Ari' || room.status !== 'draft') throw Error('Only Ari can open this example invitation.');
      next.status = 'invited'; break;
    case 'accept_invitation':
      if (event.actor !== 'Bo' || room.status !== 'invited') throw Error('Only Bo can accept this invitation.');
      next.accepted = true; next.status = 'working'; break;
    case 'suggest':
      if (event.actor !== 'Studio bot' || room.status !== 'working') throw Error('The example bot can only suggest during work.');
      next.agentSuggestion = true; break;
    case 'request_change':
      mustPerson();
      if (room.status !== 'working' || event.revision !== room.revision) throw Error('The change request must reference the current revision.');
      next.changeRequested = true; break;
    case 'request_review':
      mustPerson();
      if (room.status !== 'working' || !room.changeRequested || event.revision !== room.revision) throw Error('Request a change before asking for review.');
      next.reviewRequested = true; break;
    case 'review_suggest':
      if (event.actor !== 'Review desk' || !room.reviewRequested || !room.changeRequested || event.revision !== room.revision) throw Error('The review desk can only suggest after a review is requested.');
      next.reviewSuggestion = true; break;
    case 'amend':
      mustPerson();
      if (room.status !== 'working' || event.revision !== room.revision || !room.changeRequested) throw Error('Request a change to the current revision first.');
      next.revision++; next.terms = room.terms === INITIAL_TERMS ? ALTERNATE_TERMS : INITIAL_TERMS;
      next.approvals = {}; next.changeRequested = false; next.reviewRequested = false; next.reviewSuggestion = false; break;
    case 'approve':
      mustPerson();
      if (room.status !== 'working' || room.changeRequested || event.revision !== room.revision) throw Error('Approve the current revision after changes are resolved.');
      if (room.approvals[event.actor] === room.revision) throw Error('This collaborator already approved the current revision.');
      next.approvals[event.actor] = room.revision; break;
    case 'complete':
      mustPerson();
      if (room.status !== 'working' || room.changeRequested || event.revision !== room.revision || !PEOPLE.every(p => room.approvals[p] === room.revision)) throw Error('Both collaborators must approve this exact revision.');
      next.status = 'completed'; break;
    case 'cancel':
      mustPerson();
      next.status = 'cancelled'; next.approvals = {}; break;
    case 'expire':
      mustPerson();
      if (Date.parse(event.at) < Date.parse(room.expiresAt)) throw Error('This example has not expired.');
      next.status = 'expired'; next.approvals = {}; break;
    default: throw Error('Unknown example action.');
  }
  next.step++;
  next.events.push({ id: event.id, fingerprint, type: event.type, actor: event.actor, revision: event.revision ?? room.revision });
  return next;
}

// Explicit allowlist: never export event fingerprints, private feedback or keys.
export function publicExport(room) {
  return { schema: room.schema, simulation: true, enforcement: 'local application example only',
    title: 'Friday listening room', participants: [...PEOPLE], revision: room.revision,
    terms: room.terms, status: room.status, approvals: { ...room.approvals },
    changeRequested: room.changeRequested, reviewRequested: room.reviewRequested, reviewSuggestion: room.reviewSuggestion, agentSuggestion: room.agentSuggestion };
}
export function privateExport(room) {
  return { ...publicExport(room), privateExampleFeedback: room.privateNote,
    history: room.events.map(({ type, actor, revision }) => ({ type, actor, revision })) };
}
