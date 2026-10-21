import sanitizeHtml from "sanitize-html";

/** Keep only the formatting supported by the editor. Never trust submitted HTML. */
export function sanitizeProjectDescription(html: string | null | undefined) {
  if (html == null) return html;
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "blockquote", "h2", "h3", "code", "pre", "a"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
    },
  });
}
