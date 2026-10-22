import { createDraft, progress, invalidateReview, exportDraft, exportMarkdown, validArtifactUrl } from '../lib/internship-lab.mjs';

export function mountInternshipLab(root) {
  let draft = createDraft();
  const $ = selector => root.querySelector(selector);
  const all = selector => root.querySelectorAll(selector);
  const sourceFields = new Set(['role', 'goal', 'offer', 'evidence', 'artifactUrl']);
  function render() {
    const state = progress(draft);
    $('#il-progress').textContent = state.approved ? 'Practice handoff complete. Export your draft.' : state.reviewed ? 'Review complete in this rehearsal. Prepare the release handoff.' : state.submitted ? 'Local draft ready. Rehearse the human review.' : state.onboarded ? 'Onboarding complete. Make and check the offer.' : state.intake ? 'Direction set. Complete the working agreement.' : 'Start with a direction.';
    $('#il-review-checks').disabled = !state.submitted;
    $('#il-deploy-checks').disabled = !state.reviewed;
    $('#il-record-approval').disabled = !state.releaseReady || state.approved;
    $('#il-submission-state').textContent = state.submitted ? 'Local review draft ready. It has not been submitted anywhere.' : 'Complete your interest draft, onboarding, tasks and evidence to prepare a local review draft.';
    $('#il-approval-state').textContent = state.approved ? 'Practice approval recorded. This is not authenticated permission to publish. Nothing has been deployed.' : 'No practice approval recorded. Nothing has been deployed.';
    const urlInput = $('#il-url');
    const valid = validArtifactUrl(draft.artifactUrl);
    urlInput.setCustomValidity(valid ? '' : 'Use a public https URL without embedded credentials, or leave this blank.');
    urlInput.setAttribute('aria-invalid', String(!valid));
    $('#il-url-help').textContent = valid ? 'The URL is kept as text. This lab does not visit, upload or verify it. Do not include private access links.' : 'Use a public https URL without embedded credentials, or leave this blank. The URL is never visited by this lab.';
    all('[data-review]').forEach(input => { input.checked = draft.review[Number(input.dataset.review)]; });
    all('[data-deploy]').forEach(input => { input.checked = draft.deploy[Number(input.dataset.deploy)]; });
    for (const task of draft.tasks) {
      const labels = { todo: 'To do', doing: 'In progress', ready: 'Ready for review' };
      const label = $(`[data-task-label="${task.id}"]`);
      label.textContent = labels[task.status];
      label.dataset.status = task.status;
    }
  }
  all('[data-field]').forEach(input => input.addEventListener('input', () => {
    draft[input.dataset.field] = input.value;
    if (sourceFields.has(input.dataset.field)) invalidateReview(draft);
    else {
      draft.practiceApproval = false;
      if (input.dataset.field === 'reviewNote') draft.deploy = draft.deploy.map(() => false);
    }
    render();
  }));
  all('[data-onboarding]').forEach(input => input.addEventListener('change', () => { draft.onboarding[Number(input.dataset.onboarding)] = input.checked; invalidateReview(draft); render(); }));
  all('[data-task]').forEach(input => input.addEventListener('change', () => { draft.tasks.find(task => task.id === input.dataset.task).status = input.value; invalidateReview(draft); render(); }));
  all('[data-review]').forEach(input => input.addEventListener('change', () => { draft.review[Number(input.dataset.review)] = input.checked; draft.practiceApproval = false; draft.deploy = draft.deploy.map(() => false); render(); }));
  all('[data-deploy]').forEach(input => input.addEventListener('change', () => { draft.deploy[Number(input.dataset.deploy)] = input.checked; draft.practiceApproval = false; render(); }));
  $('#il-record-approval').addEventListener('click', () => { if (progress(draft).releaseReady) draft.practiceApproval = true; render(); });
  function download(extension) {
    const body = extension === 'json' ? JSON.stringify(exportDraft(draft), null, 2) : exportMarkdown(draft);
    const blob = new Blob([body], { type: extension === 'json' ? 'application/json' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = root.ownerDocument.createElement('a');
    link.href = url; link.download = `pointcast-internship-handoff.${extension}`;
    root.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('#il-download-status').textContent = `Your ${extension === 'json' ? 'JSON' : 'Markdown'} file was prepared for download. No data was sent to PointCast.`;
  }
  $('#il-export-json').addEventListener('click', () => download('json'));
  $('#il-export-md').addEventListener('click', () => download('md'));
  $('#il-reset').addEventListener('click', () => {
    if (!globalThis.confirm('Clear the current draft? Download a copy first if you want to keep it.')) return;
    draft = createDraft();
    all('[data-field]').forEach(input => { input.value = draft[input.dataset.field]; });
    all('[data-onboarding]').forEach(input => { input.checked = false; });
    all('[data-task]').forEach(input => { input.value = 'todo'; });
    $('#il-download-status').textContent = 'Draft cleared from this page. Previously downloaded files remain on your device.';
    render(); $('#il-role').focus();
  });
  // Keep the fresh model and initial controls in agreement after a reload.
  all('[data-field]').forEach(input => { input.value = draft[input.dataset.field]; });
  all('[data-onboarding]').forEach(input => { input.checked = false; });
  all('[data-task]').forEach(input => { input.value = 'todo'; });
  render();
}
