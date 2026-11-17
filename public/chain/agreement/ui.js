import { createRoom, applyEvent, publicExport, privateExport } from './model.mjs';
    let room = createRoom(); let count = 0;
    const byId = (id) => document.getElementById(id);
    const feedback = byId('feedback');
    function render() {
      byId('revision').textContent = `VERSION ${room.revision}`;
      byId('terms').textContent = room.terms;
      byId('status').textContent = ({ draft: 'Draft', invited: 'Invitation open', working: 'Working together', completed: 'Example complete', cancelled: 'Cancelled', expired: 'Expired' })[room.status];
      byId('ari-approval').textContent = room.approvals.Ari === room.revision ? `Version ${room.revision}` : 'Not yet';
      byId('bo-approval').textContent = room.approvals.Bo === room.revision ? `Version ${room.revision}` : 'Not yet';
      byId('change').hidden = !room.changeRequested;
      byId('suggestion').hidden = !room.agentSuggestion;
      byId('review').hidden = !room.reviewSuggestion;
    }
    document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
      const actor = byId('actor').value;
      try {
        room = applyEvent(room, { id: `example-${++count}`, type: button.dataset.action, actor, expectedStep: room.step, revision: room.revision, at: '2026-10-27T12:00:00.000Z' });
        render(); feedback.textContent = `Example updated. ${byId('status').textContent}.`;
      } catch (error) { feedback.textContent = error instanceof Error ? error.message : 'Could not apply this example action.'; }
    }));
    byId('reset').addEventListener('click', () => { room = createRoom(); count = 0; render(); feedback.textContent = 'Example reset. Start as Ari and open the invitation.'; });
    function download(value, name) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    byId('public-export').addEventListener('click', () => download(publicExport(room), 'listening-room-public-example.json'));
    byId('private-export').addEventListener('click', () => download(privateExport(room), 'listening-room-private-example.json'));
    render();
