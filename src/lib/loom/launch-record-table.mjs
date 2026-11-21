import { parseFragment, serialize } from 'parse5';

const elements = (parent, tag) => parent.childNodes.filter(node => node.tagName === tag);
const text = node => node.value ?? (node.childNodes ?? []).map(text).join('');

// Label the rendered Markdown tables once at build time. Phone labels and the
// desktop column headings come from the same text, including the tally dates.
export function labelLaunchTables(html) {
  const document = parseFragment(html);
  for (const table of elements(document, 'table')) {
    const [head] = elements(table, 'thead');
    const [body] = elements(table, 'tbody');
    if (!head || !body) continue;

    const [headerRow] = elements(head, 'tr');
    if (!headerRow) continue;
    const headers = elements(headerRow, 'th');
    const rows = elements(body, 'tr');
    if (!headers.length || rows.some(row => elements(row, 'td').length !== headers.length)) continue;
    table.attrs.push({ name: 'role', value: 'table' });
    for (const section of [head, body]) {
      section.attrs.push({ name: 'role', value: 'rowgroup' });
    }
    headerRow.attrs.push({ name: 'role', value: 'row' });
    for (const header of headers) {
      header.attrs.push({ name: 'scope', value: 'col' }, { name: 'role', value: 'columnheader' });
    }
    for (const row of rows) {
      row.attrs.push({ name: 'role', value: 'row' });
      const [title, ...values] = elements(row, 'td');
      title.nodeName = title.tagName = 'th';
      title.attrs.push({ name: 'scope', value: 'row' }, { name: 'role', value: 'rowheader' });
      values.forEach((cell, i) => {
        cell.attrs.push({ name: 'role', value: 'cell' }, { name: 'data-field', value: text(headers[i + 1]) });
      });
    }
  }
  return serialize(document);
}
