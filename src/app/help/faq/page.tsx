import { permanentRedirect } from "next/navigation";

export default function HelpFaqRedirect() {
  permanentRedirect("/faq");
}
