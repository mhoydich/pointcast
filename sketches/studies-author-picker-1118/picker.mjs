// UI sketch: no networking, identity changes, or posting.
export function authorOptions(authors, messages, trailIds = null) {
  const allowed = trailIds === null ? null : new Set(trailIds);
  return authors.map(author => {
    const records = messages.filter(m => m.authorKey === author.key);
    const focus = records.find(m => !allowed || allowed.has(m.id));
    return { key: author.key, label: `${author.name} (${records.length})`, recordId: focus?.id ?? null, disabled: !focus };
  });
}
export function mountPicker(select, options, onPick) {
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = ''; placeholder.textContent = 'Choose an author'; placeholder.disabled = true;
  select.append(placeholder);
  for (const item of options) {
    const option = document.createElement('option');
    option.value = item.key; option.textContent = item.label; option.disabled = item.disabled;
    select.append(option);
  }
  select.value = '';
  select.disabled = options.every(item => item.disabled);
  select.onchange = () => {
    const item = options.find(item => item.key === select.value);
    if (item && !item.disabled) onPick(item.recordId);
  };
}
