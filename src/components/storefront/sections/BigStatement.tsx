"use client";

import { useEffect, useRef, useState } from "react";

export function BigStatement({ config }: { config: any }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!config.text) return null;
  const words = String(config.text).split(/\s+/);
  const style = config.style || "gradient";
  const textStyle: React.CSSProperties =
    style === "outline"
      ? { WebkitTextStroke: `2px ${config.textColor || "var(--primary)"}`, color: "transparent" }
      : style === "gradient"
        ? { backgroundImage: "linear-gradient(100deg, var(--primary), var(--secondary))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
        : {};

  return (
    <section className="overflow-hidden px-4 py-20 md:py-32" style={{ backgroundColor: config.backgroundColor || undefined, color: config.textColor || undefined }}>
      <div ref={ref} className="mx-auto max-w-6xl text-center">
        <p className="text-5xl font-black leading-[1.05] tracking-tight md:text-8xl" style={{ fontFamily: "var(--font-heading)" }} dir="auto">
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block transition-all duration-700 ease-out"
              style={{
                ...textStyle,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(0.6em)",
                transitionDelay: `${i * 90}ms`,
                marginInlineEnd: "0.25em",
              }}
            >
              {word}
            </span>
          ))}
        </p>
        {config.subtext && <p className="mx-auto mt-8 max-w-2xl text-lg opacity-70 md:text-xl" dir="auto">{config.subtext}</p>}
      </div>
    </section>
  );
}
