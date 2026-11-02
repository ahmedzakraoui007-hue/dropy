"use client";

import { createElement, useEffect, useState } from "react";

const SCRIPT_ID = "model-viewer-script";
const SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";

export function Model3D({ config }: { config: any }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!config.src) return;
    if (customElements.get("model-viewer")) {
      setReady(true);
      return;
    }
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "module";
      script.src = SCRIPT_SRC;
      document.head.appendChild(script);
    }
    customElements.whenDefined("model-viewer").then(() => setReady(true));
  }, [config.src]);

  if (!config.src || !/^https:\/\//.test(config.src)) {
    if (typeof window !== "undefined" && window.parent !== window) {
      return <div className="m-6 rounded-3xl border-2 border-dashed p-10 text-center text-sm opacity-60">{config.placeholder || "Ajoutez le lien https d'un modèle 3D (.glb) dans les réglages de la section."}</div>;
    }
    return null;
  }
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div>
          {config.badge && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">{config.badge}</p>}
          {config.title && <h2 className="text-3xl font-black tracking-tight md:text-5xl">{config.title}</h2>}
          {config.text && <p className="mt-4 text-lg leading-relaxed opacity-75">{config.text}</p>}
          <p className="mt-6 text-sm font-bold opacity-60">{config.hint || "Faites tourner l'objet avec le doigt"}</p>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-[2rem]" style={{ background: "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--primary) 15%, white), transparent 75%)" }}>
          {ready ? (
            createElement("model-viewer", {
              src: config.src,
              poster: config.poster || undefined,
              alt: config.title || "Modèle 3D",
              "auto-rotate": config.autoRotate === false ? undefined : "",
              "camera-controls": "",
              "shadow-intensity": "1",
              ar: config.ar === false ? undefined : "",
              "ar-modes": "webxr scene-viewer quick-look",
              style: { width: "100%", height: "100%", background: "transparent" },
            })
          ) : (
            config.poster && <img src={config.poster} alt="" className="h-full w-full object-contain" />
          )}
        </div>
      </div>
    </section>
  );
}
