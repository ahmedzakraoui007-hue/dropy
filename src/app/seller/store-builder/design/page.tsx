import { redirect } from "next/navigation";

export default function LegacyStoreBuilderRedirect() {
  redirect("/seller/store-builder/builder?tab=theme");
}
