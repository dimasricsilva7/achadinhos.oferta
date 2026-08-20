"use client";

import { useEffect, useRef } from "react";

// Small dependency-free confetti burst — a handful of colored divs animated with CSS,
// spawned once on mount and removed after they finish falling. No canvas/library
// needed for a one-shot celebratory effect on the thank-you page.
const COLORS = ["#f2790f", "#16a34a", "#2563eb", "#e11d48", "#f59e0b"];

export function ObrigadoConfetti() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pieces: HTMLSpanElement[] = [];
    for (let i = 0; i < 26; i++) {
      const span = document.createElement("span");
      const left = Math.random() * 100;
      const delay = Math.random() * 0.3;
      const duration = 0.9 + Math.random() * 0.6;
      const color = COLORS[i % COLORS.length];
      span.style.cssText = `
        position:absolute; top:0; left:${left}%; width:7px; height:11px;
        background:${color}; border-radius:2px;
        animation: obrigado-confetti-fall ${duration}s ease-in ${delay}s forwards;
      `;
      container.appendChild(span);
      pieces.push(span);
    }

    const timeout = setTimeout(() => pieces.forEach((p) => p.remove()), 2200);
    return () => {
      clearTimeout(timeout);
      pieces.forEach((p) => p.remove());
    };
  }, []);

  return <div ref={containerRef} className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden" aria-hidden />;
}
