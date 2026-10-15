"use client";

import { usePathname } from "next/navigation";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const MARKETING_SECTIONS = [
    "a-propos",
    "aide",
    "carrieres",
    "conditions-utilisation",
    "contact",
    "createurs",
    "fournisseurs",
    "mentions-legales",
    "politique-confidentialite",
    "tarifs",
    "vendeurs",
    "help",
  ];
  const firstSegment = pathname.split("/")[1] || "";
  const isMarketingPage = firstSegment === "" || MARKETING_SECTIONS.includes(firstSegment);

  if (!isMarketingPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow pt-16 lg:pt-20">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
