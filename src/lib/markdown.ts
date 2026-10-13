function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string): string {
  const codes: string[] = [];
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(code);
    return `@@CODE${codes.length - 1}@@`;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
    const safe = /^(https?:\/\/|mailto:|\/|#)/i.test(url) ? url : '#';
    return `<a href="${safe}">${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/@@CODE(\d+)@@/g, (_m, index: string) => `<code>${codes[Number(index)]}</code>`);
  return out;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let fence: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };

  for (const line of lines) {
    if (fence) {
      if (line.trim().startsWith('```')) {
        html.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
        fence = null;
      } else {
        fence.push(line);
      }
      continue;
    }
    if (line.trim().startsWith('```')) {
      flushParagraph();
      closeList();
      fence = [];
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    const item = bullet ?? ordered;
    if (item) {
      flushParagraph();
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        html.push(`<${kind}>`);
        list = kind;
      }
      html.push(`<li>${renderInline(item[1])}</li>`);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    paragraph.push(line.trim());
  }
  if (fence) html.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
  flushParagraph();
  closeList();
  return html.join('\n');
}
