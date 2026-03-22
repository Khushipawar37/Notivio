import jsPDF from "jspdf";

/**
 * Export editor content as a styled PDF
 */
export function exportToPDF(htmlContent: string, title: string = "StudySpace Notes") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Strip HTML tags for text extraction
  const tempEl = document.createElement("div");
  tempEl.innerHTML = htmlContent;
  const textContent = tempEl.innerText || tempEl.textContent || "";

  const lines = textContent.split("\n").filter((line) => line.trim());
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString()} • StudySpace`, margin, y);
  y += 8;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Content
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  for (const line of lines) {
    const wrappedLines = doc.splitTextToSize(line, maxWidth);
    for (const wLine of wrappedLines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wLine, margin, y);
      y += 6;
    }
    y += 2;
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

/**
 * Convert HTML content to Markdown
 */
export function exportToMarkdown(htmlContent: string, title: string = "StudySpace Notes") {
  const tempEl = document.createElement("div");
  tempEl.innerHTML = htmlContent;

  let markdown = `# ${title}\n\n`;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(processNode).join("");

    switch (tag) {
      case "h1": return `# ${children}\n\n`;
      case "h2": return `## ${children}\n\n`;
      case "h3": return `### ${children}\n\n`;
      case "h4": return `#### ${children}\n\n`;
      case "p": return `${children}\n\n`;
      case "strong":
      case "b": return `**${children}**`;
      case "em":
      case "i": return `*${children}*`;
      case "u": return `<u>${children}</u>`;
      case "s":
      case "del":
      case "strike": return `~~${children}~~`;
      case "code": return `\`${children}\``;
      case "pre": return `\`\`\`\n${children}\n\`\`\`\n\n`;
      case "blockquote": return `> ${children}\n\n`;
      case "ul": return `${children}\n`;
      case "ol": return `${children}\n`;
      case "li": {
        const parent = el.parentElement;
        if (parent?.tagName.toLowerCase() === "ol") {
          const index = Array.from(parent.children).indexOf(el) + 1;
          return `${index}. ${children}\n`;
        }
        return `- ${children}\n`;
      }
      case "hr": return `---\n\n`;
      case "br": return "\n";
      case "img": return `![image](${el.getAttribute("src") || ""})\n\n`;
      case "a": return `[${children}](${el.getAttribute("href") || ""})`;
      case "table": return processTable(el);
      default: return children;
    }
  }

  function processTable(table: HTMLElement): string {
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return "";

    let md = "\n";
    rows.forEach((row, ri) => {
      const cells = Array.from(row.querySelectorAll("td, th"));
      md += "| " + cells.map((c) => (c.textContent || "").trim()).join(" | ") + " |\n";
      if (ri === 0) {
        md += "| " + cells.map(() => "---").join(" | ") + " |\n";
      }
    });
    return md + "\n";
  }

  markdown += processNode(tempEl);

  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}


