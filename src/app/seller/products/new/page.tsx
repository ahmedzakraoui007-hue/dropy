import { redirect } from "next/navigation";

export default function NewProductRedirect() {
  redirect("/seller/products/add?new=1");
}
