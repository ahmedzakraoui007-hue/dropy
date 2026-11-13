"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
  return new Promise<void>((resolve, reject) => {
    const script = existing || Object.assign(document.createElement("script"), { src: SCRIPT, async: true, defer: true });
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

export function useSignupGuard(language: string) {
  const [formToken, setFormToken] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [website, setWebsite] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  const refreshToken = useCallback(async () => {
    const response = await fetch("/api/auth/signup", { cache: "no-store" }).catch(() => null);
    const data = response?.ok ? await response.json().catch(() => null) : null;
    setFormToken(data?.token || "");
  }, []);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile || widget.current) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          language: language === "ar" ? "ar" : "fr",
          callback: (token: string) => setCaptcha(token),
          "expired-callback": () => setCaptcha(""),
          "error-callback": () => setCaptcha(""),
        });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [language]);

  const reset = useCallback(() => {
    setCaptcha("");
    if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
    refreshToken();
  }, [refreshToken]);

  const fields = { formToken, captcha, website };

  const widgets = (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute -start-[9999px] h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {SITE_KEY && <div ref={box} className="flex min-h-[65px] justify-center" />}
    </>
  );

  return { fields, widgets, reset, waitingForCaptcha: Boolean(SITE_KEY) && !captcha };
}
