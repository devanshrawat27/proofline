import { SiteHeader } from "@/components/landing/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustStrip } from "@/components/landing/trust-strip";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { ProductDashboardShowcase } from "@/components/landing/product-dashboard-showcase";
import { AIMatchingFeatureSection } from "@/components/landing/ai-matching-feature-section";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <main className="relative">
          <HeroSection />
        </main>
      </div>

      <TrustStrip />

      <div className="mx-auto max-w-container px-5 sm:px-6">
        <WorkflowSection />
        <ProductDashboardShowcase />
      </div>

      <AIMatchingFeatureSection />

      <SiteFooter />
    </div>
  );
}
