function originalRequest(data, target) {
  const [log, id] = target.slice('loom:'.length).split('#');
  if (data?.ok !== true || data.spec !== 'pointcast.loom/v1' || data.log?.key !== log || !Array.isArray(data.messages)) return '';
  const message = data.messages.find((item) => item?.id === id);
  if (!message || message.hidden || message.withdrawn) return '';
  const parts = [message.poll?.question, message.body].filter((text) => typeof text === 'string' && text.trim());
  return [...new Set(parts)].join('\n\n');
}

export function addFullRequest(card, target, read) {
  const preview = card.querySelector('.question');
  const details = document.createElement('details');
  details.className = 'full-request';
  const summary = document.createElement('summary');
  summary.textContent = 'Read full request';
  const body = document.createElement('p');
  body.setAttribute('aria-live', 'polite');
  details.append(summary, body);
  card.append(details);

  let loaded = false;
  let loading = false;
  details.addEventListener('toggle', async () => {
    summary.textContent = details.open ? 'Hide full request' : 'Read full request';
    preview.hidden = details.open && loaded;
    if (!details.open || loaded || loading) return;
    loading = true;
    body.textContent = 'Loading the full request…';
    try {
      const text = originalRequest(await read({ to: target }), target);
      if (!text) throw new Error('request_unavailable');
      body.textContent = text;
      loaded = true;
      preview.hidden = details.open;
    } catch {
      body.textContent = 'Couldn’t load the full request. Close and reopen to retry, or open the thread.';
    } finally {
      loading = false;
    }
  });
}
