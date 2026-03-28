interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

interface FeaturesContent {
  title?: string;
  items: FeatureItem[];
}

interface FeaturesSectionProps {
  content: FeaturesContent;
}

export default function FeaturesSection({ content }: FeaturesSectionProps) {
  const { title, items } = content;

  return (
    <section className="w-full bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            {title}
          </h2>
        )}

        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-8 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              {item.icon && (
                <span
                  className="mb-4 text-4xl"
                  style={{ color: "var(--color-accent, #F59E0B)" }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
              )}
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-base text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
