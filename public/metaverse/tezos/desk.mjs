import { prepare } from './prepare.mjs';

const form = document.querySelector('form');
const status = document.querySelector('[role="status"]');
async function read(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Could not load ' + path + '. Please try again.');
  return response.json();
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = 'Preparing local parameters…';
  try {
    const [code, collection, ...plates] = await Promise.all(['contract.json', 'metadata/collection.json',
      ...Array.from({length:6}, (_, i) => 'metadata/' + i + '.json')].map(read));
    const admin = document.getElementById('admin').value.trim();
    const treasury = document.getElementById('treasury').value.trim();
    const params = await prepare(code, collection, plates, admin, treasury);
    const url = URL.createObjectURL(new Blob([JSON.stringify(params, null, 2)], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'district-unsigned-origination.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    status.textContent = 'Prepared the unsigned origination parameters for your review.';
  } catch (error) {
    status.textContent = error.message;
  }
});

form.querySelector('button[type="submit"]').disabled = false;
