import NavbarWrapper from "@/components/layout/NavbarWrapper";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <NavbarWrapper>{children}</NavbarWrapper>;
}
