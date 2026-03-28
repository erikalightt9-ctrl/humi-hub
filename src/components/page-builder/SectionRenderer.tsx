import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import ContactSection from "./sections/ContactSection";
import CtaSection from "./sections/CtaSection";
import TextSection from "./sections/TextSection";
import ImageSection from "./sections/ImageSection";

export type SectionType =
  | "HERO"
  | "FEATURES"
  | "TESTIMONIALS"
  | "CONTACT"
  | "CTA"
  | "TEXT"
  | "IMAGE";

export interface PageSection {
  type: SectionType | string;
  content: Record<string, unknown>;
  isVisible?: boolean;
  alignment?: "left" | "center" | "right";
}

interface SectionRendererProps {
  section: PageSection;
}

export default function SectionRenderer({ section }: SectionRendererProps) {
  const { type, content, isVisible, alignment } = section;

  // Return null if section is explicitly hidden
  if (isVisible === false) {
    return null;
  }

  const textAlign = alignment ?? "center";

  const alignmentStyle: React.CSSProperties = {
    textAlign,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = content as any;
  let inner: React.ReactNode;

  switch (type as SectionType) {
    case "HERO":
      inner = (
        <HeroSection
          content={c as React.ComponentProps<typeof HeroSection>["content"]}
        />
      );
      break;

    case "FEATURES":
      inner = (
        <FeaturesSection
          content={c as React.ComponentProps<typeof FeaturesSection>["content"]}
        />
      );
      break;

    case "TESTIMONIALS":
      inner = (
        <TestimonialsSection
          content={c as React.ComponentProps<typeof TestimonialsSection>["content"]}
        />
      );
      break;

    case "CONTACT":
      inner = (
        <ContactSection
          content={c as React.ComponentProps<typeof ContactSection>["content"]}
        />
      );
      break;

    case "CTA":
      inner = (
        <CtaSection
          content={c as React.ComponentProps<typeof CtaSection>["content"]}
        />
      );
      break;

    case "TEXT":
      inner = (
        <TextSection
          content={c as React.ComponentProps<typeof TextSection>["content"]}
        />
      );
      break;

    case "IMAGE":
      inner = (
        <ImageSection
          content={c as React.ComponentProps<typeof ImageSection>["content"]}
        />
      );
      break;

    default:
      return null;
  }

  return (
    <div style={alignmentStyle}>
      {inner}
    </div>
  );
}
