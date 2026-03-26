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
}

interface SectionRendererProps {
  section: PageSection;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asContent<T>(v: Record<string, unknown>): T {
  return v as unknown as T;
}

export default function SectionRenderer({ section }: SectionRendererProps) {
  const { type, content } = section;

  switch (type as SectionType) {
    case "HERO":
      return (
        <HeroSection
          content={asContent<React.ComponentProps<typeof HeroSection>["content"]>(content)}
        />
      );

    case "FEATURES":
      return (
        <FeaturesSection
          content={asContent<React.ComponentProps<typeof FeaturesSection>["content"]>(content)}
        />
      );

    case "TESTIMONIALS":
      return (
        <TestimonialsSection
          content={asContent<React.ComponentProps<typeof TestimonialsSection>["content"]>(content)}
        />
      );

    case "CONTACT":
      return (
        <ContactSection
          content={asContent<React.ComponentProps<typeof ContactSection>["content"]>(content)}
        />
      );

    case "CTA":
      return (
        <CtaSection
          content={asContent<React.ComponentProps<typeof CtaSection>["content"]>(content)}
        />
      );

    case "TEXT":
      return (
        <TextSection
          content={asContent<React.ComponentProps<typeof TextSection>["content"]>(content)}
        />
      );

    case "IMAGE":
      return (
        <ImageSection
          content={asContent<React.ComponentProps<typeof ImageSection>["content"]>(content)}
        />
      );

    default:
      return null;
  }
}
