import { redirect } from "next/navigation";

export default function CustomizeRedirect() {
  redirect("/seller/store-builder/builder?tab=theme");
}
