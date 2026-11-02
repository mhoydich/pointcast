import { evaluatePractice } from './practice-model.mjs';
const form = document.getElementById('practice-form');
const answer = document.getElementById('practice-answer');
const result = document.getElementById('practice-result');
const receiptDetails = document.getElementById('practice-receipt');
const receiptText = document.getElementById('practice-receipt-json');
const next = document.getElementById('practice-next');
const download = document.getElementById('practice-download');
let currentReceipt = null;
const make = (tag, text) => { const element = document.createElement(tag); element.textContent = text; return element; };
function clearResult() {
  currentReceipt = null;
  download.disabled = true;
  next.hidden = true;
  answer.removeAttribute('aria-invalid');
  result.replaceChildren();
  receiptDetails.hidden = true;
  receiptDetails.open = false;
  receiptText.textContent = '';
}
document.getElementById('practice-example').addEventListener('click', () => {
  answer.value = '{\n  "recordId": "pkt_02",\n  "sourceId": "src_02"\n}';
  clearResult();
  result.append(make('p', 'A valid fictional example is filled. Check it locally when you are ready.'));
  answer.focus();
});
document.getElementById('practice-reset').addEventListener('click', () => {
  answer.value = '';
  clearResult();
  answer.focus();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  clearResult();
  const evaluated = evaluatePractice(answer.value);
  if (evaluated.error) {
    result.append(make('strong', 'Let’s adjust the answer.'), make('p', evaluated.error));
    answer.setAttribute('aria-invalid', 'true');
    answer.focus();
    return;
  }
  answer.removeAttribute('aria-invalid');
  const receipt = evaluated.receipt;
  result.append(make('strong', receipt.outcome === 'matches-fixture' ? 'A clear little handoff.' : 'A useful place to improve.'));
  const checks = make('ul', '');
  checks.append(make('li', receipt.checks.correctRecord ? 'Record: pkt_02 matches the requested topic.' : 'Record: choose the entry about accessible audio controls.'));
  checks.append(make('li', receipt.checks.supportingSource ? 'Evidence: src_02 supports that record.' : 'Evidence: cite the source attached to the correct record.'));
  checks.append(make('li', 'Shape: the two required text fields, without extras.'));
  result.append(checks);
  receiptText.textContent = JSON.stringify(receipt, null, 2);
  receiptDetails.hidden = false;
  currentReceipt = receiptText.textContent + '\n';
  document.getElementById('practice-next-title').textContent = receipt.outcome === 'matches-fixture'
    ? 'A small task, with its source.' : 'Keep your working note.';
  document.getElementById('practice-next-note').textContent = receipt.outcome === 'matches-fixture'
    ? 'You matched the record and its evidence. Keep the checks, then let your bot try an offline task.'
    : 'This note includes the checks that need another look. Adjust your answer, or keep it to compare your next attempt.';
  next.hidden = false;
  download.disabled = false;
});
download.addEventListener('click', () => {
  if (!currentReceipt) return;
  const url = URL.createObjectURL(new Blob([currentReceipt], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'signal-atlas-local-practice.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
answer.addEventListener('input', () => { answer.removeAttribute('aria-invalid'); clearResult(); });
