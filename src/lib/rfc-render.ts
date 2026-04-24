/**
 * rfc-render — minimal Markdown-to-HTML renderer purpose-built for RFC docs.
 *
 * Handles: headings (# ##… ######), paragraphs, bold, italic, inline code,
 * code blocks, links, unordered + ordered lists, tables (GFM pipe style),
 * horizontal rules, blockquotes, hard breaks. That's the dialect our RFCs use.
 *
 * Zero dependencies — keeps PointCast's "no new toolchain" posture consistent
 * with build-og.mjs + build-deck-poster.mjs. If RFCs start needing exotic
 * Markdown features, swap to micromark (already a transitive dep); for now
 * this renderer is ~150 lines and fully auditable.
 *
 * HTML output is escaped wherever user content could inject markup, but
 * since these docs are authored in-repo by maintainers we don't aim for
 * XSS-hardening beyond basic hygiene. Do NOT feed untrusted Markdown
 * through this renderer.
 */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

/** Inline pass: code spans, bold, italic, links. Runs on already-escaped text. */
function renderInline(s: string): string {
  let out = escapeHtml(s);
  // inline code — protect before anything else
  const codeStore: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    codeStore.push(code);
    return `\x00C${codeStore.length - 1}\x00`;
  });
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('/') || url.startsWith('#')
      ? url
      : '#';
    return `<a href="${safeUrl}">${text}</a>`;
  });
  // bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic *text* (but not inside bold — already processed) or _text_
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*([\s)!?.,:]|$)/g, '$1<em>$2</em>$3');
  out = out.replace(/(^|[\s(])_([^_\n]+)_([\s)!?.,:]|$)/g, '$1<em>$2</em>$3');
  // restore code spans
  out = out.replace(/\x00C(\d+)\x00/g, (_, i) => `<code>${codeStore[Number(i)]}</code>`);
  return out;
}

/** Block pass. */
export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;

  function closeCurrent() {
    /* no-op; each block closes itself */
  }

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || '';
      i++;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      const code = buf.join('\n');
      html.push(
        `<pre class="rfc-code"><code${lang ? ` class="lang-${escapeHtml(lang)}"` : ''}>${escapeHtml(code)}</code></pre>`,
      );
      continue;
    }

    // horizontal rule
    if (/^(\s*)(---+|\*\*\*+|___+)\s*$/.test(line)) {
      html.push('<hr />');
      i++;
      continue;
    }

    // heading
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 64);
      html.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      i++;
      continue;
    }

    // blockquote (> )
    if (line.startsWith('> ')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2));
        i++;
      }
      html.push(`<blockquote>${renderInline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // table (GFM pipe)
    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i + 1])) {
      const header = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        rows.push(
          lines[i]
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim()),
        );
        i++;
      }
      html.push('<table class="rfc-table">');
      html.push('<thead><tr>');
      for (const h of header) html.push(`<th>${renderInline(h)}</th>`);
      html.push('</tr></thead>');
      html.push('<tbody>');
      for (const row of rows) {
        html.push('<tr>');
        for (const cell of row) html.push(`<td>${renderInline(cell)}</td>`);
        html.push('</tr>');
      }
      html.push('</tbody></table>');
      continue;
    }

    // unordered list
    if (/^\s*-\s+/.test(line)) {
      html.push('<ul>');
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s*-\s+/, '');
        html.push(`<li>${renderInline(item)}</li>`);
        i++;
      }
      html.push('</ul>');
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      html.push('<ol>');
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s*\d+\.\s+/, '');
        html.push(`<li>${renderInline(item)}</li>`);
        i++;
      }
      html.push('</ol>');
      continue;
    }

    // blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // paragraph — collect lines until blank or new block
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^(#{1,6}\s|\s*-\s|\s*\d+\.\s|```|>\s|\|.+\|)/)
    ) {
      buf.push(lines[i]);
      i++;
    }
    html.push(`<p>${renderInline(buf.join(' '))}</p>`);
  }

  closeCurrent();
  return html.join('\n');
}
