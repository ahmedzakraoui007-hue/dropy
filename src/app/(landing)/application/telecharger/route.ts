import { NextResponse } from "next/server";
import { ANDROID_APK_URL } from "@/lib/mobile-app";

export function GET() {
  return NextResponse.redirect(ANDROID_APK_URL, 302);
}
