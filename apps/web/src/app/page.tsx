import { SiteNav } from "@/components/landing/site-nav";
import { Hero } from "@/components/landing/hero";
import { Workflow } from "@/components/landing/workflow";
import { CasePreview } from "@/components/landing/case-preview";
import { Principles } from "@/components/landing/principles";
import { ClosingCta } from "@/components/landing/closing-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app">
      <SiteNav />
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_100%_at_78%_0%,#e8f4ee_0%,transparent_62%)]"
        />
        <main className="relative">
          <Hero />
          <div className="mx-auto max-w-container px-5 sm:px-6">
            <Workflow />
            <CasePreview />
            <Principles />
            <ClosingCta />
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
