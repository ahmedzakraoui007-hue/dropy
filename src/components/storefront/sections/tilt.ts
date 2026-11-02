import type { PointerEvent } from "react";

export function tiltProps(enabled: boolean) {
  if (!enabled) return {};
  return {
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 14).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg) scale(1.02)`;
    },
    onPointerLeave: (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "";
    },
    style: { transition: "transform 200ms ease-out", transformStyle: "preserve-3d" as const, willChange: "transform" },
  };
}
