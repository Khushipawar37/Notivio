function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripMarkdownNoise(text: string) {
  return text
    .replace(/\!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^\s*Title:\s*/gim, "")
    .replace(/^\s*URL Source:\s*/gim, "")
    .replace(/^\s*Markdown Content:\s*/gim, "");
}

export function normalizeSourceText(text: string) {
  const cleaned = stripMarkdownNoise(text)
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned;
}

export function sourceTextToHtml(title: string, text: string) {
  const normalized = normalizeSourceText(text);
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const htmlBlocks = blocks.map((block) => {
    const headingMatch = block.match(/^#{1,4}\s+(.+)/);
    if (headingMatch) {
      return `<h3>${escapeHtml(headingMatch[1])}</h3>`;
    }
    const listLines = block
      .split("\n")
      .filter((line) => /^[-*]\s+/.test(line.trim()));
    if (
      listLines.length >= 2 &&
      listLines.length === block.split("\n").length
    ) {
      const items = listLines
        .map(
          (line) =>
            `<li>${escapeHtml(line.replace(/^[-*]\s+/, "").trim())}</li>`,
        )
        .join("");
      return `<ul>${items}</ul>`;
    }
    return `<p>${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`;
  });

  return `<h2>${escapeHtml(title)}</h2>${htmlBlocks.join("")}`;
}

export function looksLikeGibberish(text: string) {
  const t = text.trim();
  if (!t) return true;
  const weird = (t.match(/[^\x09\x0A\x0D\x20-\x7E]/g) || []).length;
  const ratio = weird / Math.max(1, t.length);
  const longWords = (t.match(/[A-Za-z0-9]{25,}/g) || []).length;
  return ratio > 0.18 || longWords > 12;
}
