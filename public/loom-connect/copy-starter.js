const starter = document.getElementById('starter-prompt');
const copyButton = document.getElementById('copy-starter');
const copyStatus = document.getElementById('copy-status');

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(starter.value);
    copyStatus.textContent = 'Copied. Paste it into your chat.';
  } catch {
    starter.focus();
    starter.select();
    copyStatus.textContent = 'Prompt selected. Use your device’s Copy command.';
  }
});
copyButton.hidden = false;
