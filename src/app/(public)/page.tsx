import type { Metadata } from "next";

import { SaasHeroSection } from "@/components/public/SaasHeroSection";
import { SocialProofSection } from "@/components/public/SocialProofSection";
import { ProblemSolutionSection } from "@/components/public/ProblemSolutionSection";
import { FeatureHighlightsSection } from "@/components/public/FeatureHighlightsSection";
import { HowItWorksNewSection } from "@/components/public/HowItWorksNewSection";
import { PricingTeaserSection } from "@/components/public/PricingTeaserSection";
import { LandingTestimonialsSection } from "@/components/public/LandingTestimonialsSection";
import { NicheSection } from "@/components/public/NicheSection";
import { TargetAudienceSection } from "@/components/public/TargetAudienceSection";
import { ValuePropositionSection } from "@/components/public/ValuePropositionSection";
import { FeatureBreakdownSection } from "@/components/public/FeatureBreakdownSection";
import { HowItWorksSection } from "@/components/public/HowItWorksSection";
import { AdvancedFeaturesSection } from "@/components/public/AdvancedFeaturesSection";
import { MultiTenantSection } from "@/components/public/MultiTenantSection";
import { PricingSection } from "@/components/public/PricingSection";
import { RoiSection } from "@/components/public/RoiSection";
import { SaasTestimonialsSection } from "@/components/public/SaasTestimonialsSection";
import { PowerStatementSection } from "@/components/public/PowerStatementSection";
import { FaqSection } from "@/components/public/FaqSection";

export const metadata: Metadata = {
  title: "HUMI Hub — All-in-One Business Operations Platform",
  description:
    "One platform to manage your entire business. HR, finance, IT, sales, admin, and learning management — built for training centers and SMEs ready to scale.",
};

export default function HomePage() {
  return (
    <>
      {/* 1. Hero — multi-industry positioning with business dashboard preview */}
      <SaasHeroSection />

      {/* 2. Social Proof — company marquee + animated stat counters */}
      <SocialProofSection />

      {/* 3. Problem → Solution — pain/fix pairs + pull quote */}
      <ProblemSolutionSection />

      {/* 4. Feature Highlights — 6 module cards */}
      <FeatureHighlightsSection />

      {/* 5. How It Works — 3-step numbered flow */}
      <HowItWorksNewSection />

      {/* 6. Pricing Teaser — 3-tier cards */}
      <PricingTeaserSection />

      {/* 7. Testimonials — dark background quote cards */}
      <LandingTestimonialsSection />

      {/* 8. Niche — platform identity, industries served, business pillars */}
      <NicheSection />

      {/* 3. Target Audience — who it's for (6 industry cards) */}
      <TargetAudienceSection />

      {/* 4. Value Proposition — 4 key benefits + checkmarks */}
      <ValuePropositionSection />

      {/* 5. Feature Breakdown — 5-pillar platform structure */}
      <FeatureBreakdownSection />

      {/* 6. Power Statement — business operating system */}
      <PowerStatementSection />

      {/* 7. How It Works — 3-step setup, manage, scale */}
      <HowItWorksSection />

      {/* 8. Advanced Features — competitive edge grid */}
      <AdvancedFeaturesSection />

      {/* 9. Multi-Tenant — SaaS selling point */}
      <MultiTenantSection />

      {/* 10. Pricing — 3 tiers */}
      <PricingSection />

      {/* 11. ROI / Business Impact */}
      <RoiSection />

      {/* 12. Testimonials */}
      <SaasTestimonialsSection />

      {/* 13. FAQ */}
      <FaqSection />
    </>
  );
}
