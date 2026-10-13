// Turns this Markdown:
//
//   > [!WARNING]
//   > This deletes everything under the namespace!
//
// into a styled callout box. Works with or without a space after ">",
// any letter case, and an optional custom title: "> [!tip] Faster way".
// Types: note, tip, important, warning, caution, info, danger.

const TYPES = {
  note: "Note",
  info: "Info",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  danger: "Danger"
};

export default function callouts(md) {
  md.core.ruler.after("block", "callouts", (state) => {
    const t = state.tokens;

    for (let i = 0; i < t.length; i++) {
      if (t[i].type !== "blockquote_open") continue;

      const open = t[i];
      const p = t[i + 1];
      const inline = t[i + 2];
      if (!p || p.type !== "paragraph_open" || !inline || inline.type !== "inline") continue;

      const m = inline.content.match(/^\[!(\w+)\][ \t]*([^\n]*)\n?/);
      if (!m) continue;
      const type = m[1].toLowerCase();
      if (!TYPES[type]) continue;

      // find the matching </blockquote>
      let close = -1;
      for (let j = i + 1; j < t.length; j++) {
        if (t[j].type === "blockquote_close" && t[j].level === open.level) { close = j; break; }
      }
      if (close === -1) continue;

      const title = m[2].trim() || TYPES[type];
      inline.content = inline.content.slice(m[0].length);

      open.tag = "div";
      open.attrSet("class", `callout callout-${type}`);
      t[close].tag = "div";

      // marker was alone in its paragraph: drop the now-empty paragraph
      const insertAt = i + 1;
      if (inline.content.trim() === "") {
        t.splice(i + 1, 3); // paragraph_open, inline, paragraph_close
      }

      const titleTok = new state.Token("html_block", "", 0);
      titleTok.content = `<p class="callout-title">${md.utils.escapeHtml(title)}</p>\n`;
      t.splice(insertAt, 0, titleTok);
    }
  });
}
