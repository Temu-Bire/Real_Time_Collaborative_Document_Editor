import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

turndown.addRule("pageBreak", {
  filter: (node) =>
    node.nodeName === "DIV" && node.classList?.contains("page-break"),
  replacement: () => "\n\n---\n\n",
});

turndown.addRule("anchorTarget", {
  filter: "a",
  replacement: (content, node) => {
    const href = node.getAttribute("href");
    if (!href) return content;
    if (href === content) return content;
    return `[${content}](${href})`;
  },
});

export const htmlToMarkdown = (html) => turndown.turndown(html || "");

export const markdownToHtml = (markdown) => {
  if (!markdown) return "";
  const result = marked.parse(markdown, { async: false, gfm: true });
  return typeof result === "string" ? result : String(result);
};

export const slugify = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "document";

export const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
