"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export default function ResponsiveProposalDocument({ pages, width, height }: { pages: ReactNode[]; width: number; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  return (
    <div ref={containerRef} className="w-full space-y-4 py-4 sm:space-y-7 sm:py-8">
      {pages.map((page, index) => (
        <div key={index} className="mx-auto bg-white shadow-2xl ring-1 ring-black/5" style={{ width: width * scale, height: height * scale }}>
          <div className="origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>{page}</div>
        </div>
      ))}
    </div>
  );
}
