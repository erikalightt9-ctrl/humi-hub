interface CtaContent {
  headline: string;
  subheadline?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface CtaSectionProps {
  content: CtaContent;
}

export default function CtaSection({ content }: CtaSectionProps) {
  const { headline, subheadline, buttonText, buttonLink } = content;

  return (
    <section
      className="w-full px-4 py-20 text-center"
      style={{ backgroundColor: "var(--color-primary, #3B82F6)" }}
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {headline}
        </h2>

        {subheadline && (
          <p className="mb-8 text-lg text-white/90 md:text-xl">
            {subheadline}
          </p>
        )}

        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-block rounded-lg border-2 border-white bg-white px-8 py-3 text-lg font-semibold transition-colors hover:bg-transparent hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            style={{ color: "var(--color-primary, #3B82F6)" }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}
