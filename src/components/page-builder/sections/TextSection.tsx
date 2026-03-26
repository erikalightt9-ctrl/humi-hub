import sanitizeHtml from "sanitize-html";

interface TextContent {
  title?: string;
  body?: string;
}

interface TextSectionProps {
  content: TextContent;
}

const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4", "strong", "em",
  "ul", "ol", "li", "a", "br",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
};

function sanitizeBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["https", "http", "mailto"],
    disallowedTagsMode: "discard",
  });
}

export default function TextSection({ content }: TextSectionProps) {
  const { title, body } = content;
  const sanitizedBody = body ? sanitizeBody(body) : "";

  return (
    <section className="w-full bg-white px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {title && (
          <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
            {title}
          </h2>
        )}

        {sanitizedBody && (
          <div
            className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-blue-600 prose-strong:text-gray-900"
            style={{ color: "var(--color-text, #111827)" }}
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        )}
      </div>
    </section>
  );
}
