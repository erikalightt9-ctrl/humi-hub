import type { Metadata } from "next";

import { SaasHeroSection } from "@/components/public/SaasHeroSection";
import { TargetAudienceSection } from "@/components/public/TargetAudienceSection";
import { ValuePropositionSection } from "@/components/public/ValuePropositionSection";
import { FeatureBreakdownSection } from "@/components/public/FeatureBreakdownSection";
import { AdvancedFeaturesSection } from "@/components/public/AdvancedFeaturesSection";
import { MultiTenantSection } from "@/components/public/MultiTenantSection";
import { PricingSection } from "@/components/public/PricingSection";
import { RoiSection } from "@/components/public/RoiSection";
import { SaasTestimonialsSection } from "@/components/public/SaasTestimonialsSection";
import { FaqSection } from "@/components/public/FaqSection";

export const metadata: Metadata = {
  title: "HUMI Hub — All-in-One Training Management Platform",
  description:
    "Manage students, trainers, courses, messaging, and analytics — all in one powerful system. Built for modern training centers and academies.",
};

export default function HomePage() {
  return (
    <>
      {/* 1. Hero — SaaS positioning with dashboard preview */}
      <SaasHeroSection />

      {/* 2. Target Audience — who it's for */}
      <TargetAudienceSection />

      {/* 3. Value Proposition — 4 key benefits */}
      <ValuePropositionSection />

      {/* 4. Feature Breakdown — zig-zag layout with mockups */}
      <FeatureBreakdownSection />

      {/* 5. Advanced Features — competitive edge grid */}
      <AdvancedFeaturesSection />

      {/* 6. Multi-Tenant — SaaS selling point */}
      <MultiTenantSection />

      {/* 7. Pricing — 3 tiers */}
      <PricingSection />

      {/* 8. ROI / Business Impact */}
      <RoiSection />

      {/* 9. Testimonials */}
      <SaasTestimonialsSection />

      {/* 10. FAQ */}
      <FaqSection />
    </>
  );
}
