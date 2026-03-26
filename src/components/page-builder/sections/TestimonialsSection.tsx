interface TestimonialItem {
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
}

interface TestimonialsContent {
  title?: string;
  items: TestimonialItem[];
}

interface TestimonialsSectionProps {
  content: TestimonialsContent;
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <blockquote className="mb-6 flex-1">
        <span
          className="mb-2 block text-4xl font-serif leading-none"
          style={{ color: "var(--color-primary, #3B82F6)" }}
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <p className="text-base italic text-gray-700">{item.quote}</p>
      </blockquote>

      <div className="flex items-center gap-3">
        {item.avatar ? (
          <img
            src={item.avatar}
            alt={`${item.name} avatar`}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: "var(--color-primary, #3B82F6)" }}
            aria-hidden="true"
          >
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{item.name}</p>
          {item.role && (
            <p className="text-sm text-gray-500">{item.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection({ content }: TestimonialsSectionProps) {
  const { title, items } = content;

  return (
    <section
      className="w-full px-4 py-16"
      style={{ backgroundColor: "var(--color-background, #F9FAFB)" }}
    >
      <div className="mx-auto max-w-6xl">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            {title}
          </h2>
        )}

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <TestimonialCard key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
