import type { ReactNode } from "react";
import { storeMetadata } from "@/lib/store-metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const metadata = await storeMetadata(slug, []);
  return { ...metadata, robots: { index: false, follow: false } };
}

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
