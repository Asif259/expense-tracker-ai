'use client';

import { useEffect, useState } from 'react';

/**
 * Current year without reading the clock during prerender (which Next.js'
 * cacheComponents mode forbids). Renders nothing until mounted, with reserved
 * width so the footer line does not shift.
 */
export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    // Deferred so the value is only read after hydration, never during
    // prerender. setTimeout keeps the state update out of the render path.
    const timer = window.setTimeout(() => setYear(new Date().getFullYear()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span className="inline-block min-w-[3.5ch] tabular-nums">{year ?? ''}</span>
  );
}
