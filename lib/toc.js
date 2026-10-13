function headingText(token) {
  return (token.children ?? [])
    .map((child) => {
      if (child.type === "text" || child.type === "code_inline" || child.type === "image") {
        return child.content;
      }
      return child.type === "softbreak" || child.type === "hardbreak" ? " " : "";
    })
    .join("");
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderList(items) {
  return `<ol>${items.map(({ id, text, children }) =>
    `<li><a href="#${escapeHtml(id)}">${escapeHtml(text)}</a>${children.length ? renderList(children) : ""}</li>`
  ).join("")}</ol>`;
}

export default function tableOfContents(md) {
  md.core.ruler.after("inline", "table_of_contents", (state) => {
    const headings = [];
    const roots = [];
    const usedIds = new Set();

    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== "heading_open" || Number(token.tag.slice(1)) < 2) continue;

      const inline = state.tokens[index + 1];
      if (inline?.type !== "inline") continue;

      const text = headingText(inline);
      const baseId = text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-") || "section";
      let id = baseId;
      let suffix = 1;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);

      token.attrSet("id", id);
      const level = Number(token.tag.slice(1));
      const item = { id, text, level, children: [] };
      while (headings.length && headings[headings.length - 1].level >= level) {
        headings.pop();
      }
      (headings[headings.length - 1]?.children ?? roots).push(item);
      headings.push(item);
    }

    if (!roots.length) return;

    const tocHtml = `<nav class="post-toc" aria-label="Table of contents"><h2>Table of Contents</h2>${renderList(roots)}</nav>\n`;
    for (let index = state.tokens.length - 2; index >= 0; index -= 1) {
      const token = state.tokens[index];
      if (token.type === "inline" && token.content.trim() === "[[toc]]" &&
          state.tokens[index - 1]?.type === "paragraph_open" &&
          state.tokens[index + 1]?.type === "paragraph_close") {
        state.tokens.splice(index - 1, 3, Object.assign(new state.Token("html_block", "", 0), { content: tocHtml }));
      }
    }
  });
}
