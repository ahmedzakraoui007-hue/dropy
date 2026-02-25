"use client";

import { usePathname } from "next/navigation";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
    // Routes where we DON'T want the landing navbar/footer
    const protectedRoutes = ["/admin", "/seller", "/supplier", "/creator", "/login", "/inscription", "/forgot-password", "/auth/reset-password", "/preview", "/demande-en-attente"];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
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
