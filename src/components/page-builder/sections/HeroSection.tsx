interface HeroContent {
  headline: string;
  subheadline?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HeroSectionProps {
  content: HeroContent;
}

export default function HeroSection({ content }: HeroSectionProps) {
  const { headline, subheadline, backgroundImage, ctaText, ctaLink } = content;

  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "linear-gradient(135deg, var(--color-primary, #3B82F6), var(--color-secondary, #1E40AF))",
      };

  return (
    <section
      className="relative flex min-h-[60vh] w-full items-center justify-center px-4 py-24 text-center"
      style={backgroundStyle}
    >
      <div className="relative z-10 mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
          {headline}
        </h1>

        {subheadline && (
          <p className="mb-8 text-lg text-white/90 md:text-xl lg:text-2xl">
            {subheadline}
          </p>
        )}

        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="inline-block rounded-lg px-8 py-3 text-lg font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            style={{ backgroundColor: "var(--color-accent, #F59E0B)" }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
