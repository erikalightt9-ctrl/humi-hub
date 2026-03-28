"use client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ThemePreviewData {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly fontFamily: string;
  readonly logoUrl?: string | null;
  readonly businessName: string;
  readonly tagline: string;
}

interface ThemePreviewProps {
  readonly theme: ThemePreviewData;
}

/* ------------------------------------------------------------------ */
/*  Feature card used in the mock features row                        */
/* ------------------------------------------------------------------ */

function FeatureCard({
  title,
  description,
  accentColor,
  fontFamily,
}: {
  readonly title: string;
  readonly description: string;
  readonly accentColor: string;
  readonly fontFamily: string;
}) {
  return (
    <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-gray-100 min-w-0">
      <div
        className="w-6 h-6 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: accentColor }}
      >
        ✓
      </div>
      <p className="text-xs font-semibold text-gray-800 leading-snug" style={{ fontFamily }}>
        {title}
      </p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug" style={{ fontFamily }}>
        {description}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ThemePreview({ theme }: ThemePreviewProps) {
  const { primaryColor, secondaryColor, accentColor, fontFamily, logoUrl, businessName, tagline } =
    theme;

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 shadow-md text-sm select-none"
      style={
        {
          "--color-primary": primaryColor,
          "--color-secondary": secondaryColor,
          "--color-accent": accentColor,
          fontFamily,
        } as React.CSSProperties
      }
      aria-label="Theme live preview"
    >
      {/* ── Header ── */}
      <header
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: secondaryColor }}
      >
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={`${businessName} logo`}
            className="h-7 w-7 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="h-7 w-7 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {businessName.charAt(0).toUpperCase() || "B"}
          </div>
        )}
        <span className="font-bold text-white text-sm truncate" style={{ fontFamily }}>
          {businessName || "Your Business"}
        </span>

        {/* Mock nav links */}
        <div className="ml-auto flex items-center gap-3">
          {["Home", "Courses", "About"].map((link) => (
            <span
              key={link}
              className="text-[10px] text-white/70 hover:text-white cursor-default"
              style={{ fontFamily }}
            >
              {link}
            </span>
          ))}
        </div>
      </header>

      {/* ── Hero ── */}
      <div
        className="px-5 py-6 flex flex-col items-start gap-3"
        style={{ backgroundColor: `${primaryColor}15` }}
      >
        <h2
          className="font-bold text-base leading-snug text-gray-900"
          style={{ fontFamily, color: primaryColor }}
        >
          {tagline || "Your Tagline Here"}
        </h2>
        <p className="text-[11px] text-gray-600 leading-relaxed" style={{ fontFamily }}>
          Empower your team with world-class learning experiences.
        </p>
        <button
          className="px-4 py-1.5 rounded-lg text-white text-[11px] font-semibold shadow-sm"
          style={{ backgroundColor: primaryColor, fontFamily }}
          tabIndex={-1}
          aria-hidden="true"
        >
          Get Started
        </button>
      </div>

      {/* ── Features row ── */}
      <div className="bg-gray-50 px-4 py-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2"
          style={{ fontFamily }}
        >
          Why Choose Us
        </p>
        <div className="flex gap-2">
          <FeatureCard
            title="Expert Instructors"
            description="Learn from pros"
            accentColor={accentColor}
            fontFamily={fontFamily}
          />
          <FeatureCard
            title="Quality Content"
            description="Up-to-date curriculum"
            accentColor={accentColor}
            fontFamily={fontFamily}
          />
          <FeatureCard
            title="Certification"
            description="Earn recognised certs"
            accentColor={accentColor}
            fontFamily={fontFamily}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: secondaryColor }}
      >
        <span className="text-[10px] text-white/60" style={{ fontFamily }}>
          © {new Date().getFullYear()} {businessName || "Your Business"}
        </span>
        <div className="flex gap-3">
          {["Privacy", "Terms", "Contact"].map((link) => (
            <span
              key={link}
              className="text-[10px] text-white/50 cursor-default"
              style={{ fontFamily }}
            >
              {link}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
