import { Redirect } from "expo-router";
import { Loading } from "@/components/ui";
import { isAllowedSeller, useSession } from "@/lib/session";

export default function Entry() {
  const { ready, session, profile } = useSession();
  if (!ready) return <Loading />;
  return <Redirect href={session && isAllowedSeller(profile) ? "/(tabs)" : "/login"} />;
}
