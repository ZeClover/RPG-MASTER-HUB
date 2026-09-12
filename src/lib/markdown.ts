import "server-only";

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ breaks: true, gfm: true });

/**
 * Markdown → HTML seguro. Escolhido em vez de um editor rico (TipTap/Slate)
 * porque cobre "documentação longa" com uma dependência bem menor — ver
 * ARCHITECTURE.md, seção Lore Wiki.
 */
export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;

  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
