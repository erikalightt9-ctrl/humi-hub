import type { Metadata } from "next";

import { SaasHeroSection } from "@/components/public/SaasHeroSection";
import { SocialProofSection } from "@/components/public/SocialProofSection";
import { ProblemSolutionSection } from "@/components/public/ProblemSolutionSection";
import { FeatureHighlightsSection } from "@/components/public/FeatureHighlightsSection";
import { HowItWorksNewSection } from "@/components/public/HowItWorksNewSection";
import { PricingTeaserSection } from "@/components/public/PricingTeaserSection";
import { LandingTestimonialsSection } from "@/components/public/LandingTestimonialsSection";
import { FinalCtaSection } from "@/components/public/FinalCtaSection";

export const metadata: Metadata = {
  title: "HUMI Hub — The Operating System for Your Entire Company",
  description:
    "HUMI Hub unifies HR, Finance, Sales, IT, Operations, and Training into one executive command center. Real-time visibility across every department — built for leadership.",
};

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <SaasHeroSection />

      {/* 2. Social Proof — company marquee + animated stat counters */}
      <SocialProofSection />

      {/* 3. Problem → Solution */}
      <ProblemSolutionSection />

      {/* 4. Feature Highlights — 6 module cards */}
      <FeatureHighlightsSection />

      {/* 5. How It Works — 3-step numbered flow */}
      <HowItWorksNewSection />

      {/* 6. Pricing Teaser — 3-tier cards */}
      <PricingTeaserSection />

      {/* 7. Testimonials — dark background quote cards */}
      <LandingTestimonialsSection />

      {/* 8. Final CTA */}
      <FinalCtaSection />
    </>
  );
}
