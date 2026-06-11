"use client";

import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import HelpContent from "../components/HelpContent";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-fixed flex flex-col">
      <SiteHeader />

      <main className="px-8 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <HelpContent />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
