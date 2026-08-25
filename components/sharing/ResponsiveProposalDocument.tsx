"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export default function ResponsiveProposalDocument({ pages, width, height, trackingToken, pageLabels = [] }: { pages: ReactNode[]; width: number; height: number; trackingToken?: string; pageLabels?: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const visibleSinceRef = useRef(new Map<number, number>());
  const durationsRef = useRef(new Map<number, number>());
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resize = () => setScale(Math.min(1, Math.max(0.2, (container.clientWidth - 24) / width)));
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return () => observer.disconnect();
  }, [width]);
  useEffect(() => {
    if (!trackingToken) return;
    const sessionKey = `proposal-share-session:${trackingToken}`;
    const sessionId = sessionStorage.getItem(sessionKey) ?? crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
    const stop = (index: number, now = performance.now()) => {
      const started = visibleSinceRef.current.get(index); if (started == null) return;
      durationsRef.current.set(index, (durationsRef.current.get(index) ?? 0) + Math.max(0, now - started)); visibleSinceRef.current.delete(index);
    };
    const flush = () => {
      const now = performance.now(); visibleSinceRef.current.forEach((_, index) => { stop(index, now); visibleSinceRef.current.set(index, now); });
      const pagesPayload = [...durationsRef.current].map(([pageIndex, durationMs]) => ({ pageIndex, section: pageLabels[pageIndex] ?? "unknown", durationMs: Math.round(durationMs) })).filter((item) => item.durationMs > 0);
      if (!pagesPayload.length) return; durationsRef.current.clear();
      navigator.sendBeacon(`/api/share/${trackingToken}/events`, new Blob([JSON.stringify({ sessionId, pages: pagesPayload })], { type: "application/json" }));
    };
    const observer = new IntersectionObserver((entries) => { const now = performance.now(); for (const entry of entries) { const index = Number((entry.target as HTMLElement).dataset.trackedPage); if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && document.visibilityState === "visible") { if (!visibleSinceRef.current.has(index)) visibleSinceRef.current.set(index, now); } else stop(index, now); } }, { threshold: [0, 0.5, 1] });
    pageRefs.current.forEach((page) => { if (page) observer.observe(page); });
    const visibility = () => { if (document.visibilityState === "hidden") { visibleSinceRef.current.forEach((_, index) => stop(index)); flush(); } };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", flush); const timer = window.setInterval(flush, 10_000);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", flush); window.clearInterval(timer); flush(); };
  }, [pageLabels, trackingToken]);
  return (
    <div ref={containerRef} className="w-full space-y-4 py-4 sm:space-y-7 sm:py-8">
      {pages.map((page, index) => (
        <div key={index} ref={(element) => { pageRefs.current[index] = element; }} data-tracked-page={index} className="mx-auto bg-white shadow-2xl ring-1 ring-black/5" style={{ width: width * scale, height: height * scale }}>
          <div className="origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>{page}</div>
        </div>
      ))}
    </div>
  );
}
