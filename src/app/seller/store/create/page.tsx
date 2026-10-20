import { redirect } from "next/navigation";

export default function CreateStoreRedirect() {
  redirect("/seller/store-builder");
}
