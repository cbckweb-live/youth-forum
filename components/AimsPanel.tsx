'use client';

import { useState, useCallback, useEffect } from 'react';

/* ─── Fringe lines (desktop & mobile) ──────────────────── */

const fringeLines = Array.from({ length: 21 }, (_, i) => {
  const center = 10;
  const dist = Math.abs(i - center) / center;
  return {
    height: Math.round(36 - dist * 22),
    opacity: Math.round((0.9 - dist * 0.75) * 100) / 100,
  };
});

const fringeLinesMobile = Array.from({ length: 13 }, (_, i) => {
  const center = 6;
  const dist = Math.abs(i - center) / center;
  return {
    height: Math.round(24 - dist * 12),
    opacity: Math.round((0.8 - dist * 0.65) * 100) / 100,
  };
});

/* ─── Aims data ────────────────────────────────────────── */

const aims = [
  {
    numeral: '01',
    title: 'Spiritual Growth',
    summary:
      'Growing in relationship with God through daily Scripture and quiet time.',
    fullText:
      'To help young people grow in their relationship with God through daily Scripture reading and quiet time with Him.',
  },
  {
    numeral: '02',
    title: 'Freedom to Express',
    summary:
      'A platform to think, plan, create, and serve alongside the Church.',
    fullText:
      'To be a platform where young people are given the freedom to think, plan, create and express their opinions, while encouraging them to respect and cooperate with the Church elders and take an active part in the services and programmes of the Youth Ministry.',
  },
  {
    numeral: '03',
    title: 'Fellowship & Discipleship',
    summary:
      'Strengthening one another in prayer, community, and the Word.',
    fullText:
      'To foster regular fellowship among young people and youth workers, strengthening discipleship first as individuals and then as a community, while encouraging the youth to pray for one another and build each other up through the guidance of the Holy Word.',
  },
  {
    numeral: '04',
    title: 'Christ-Centered Living',
    summary: 'Keeping God first in social and economic life.',
    fullText:
      'To help young people keep God first in their social and economic lives.',
  },
  {
    numeral: '05',
    title: 'Evangelism & Service',
    summary: 'Using our gifts for the glory of Almighty God.',
    fullText:
      'To encourage young people to engage in evangelistic work and use their gifts and abilities for the glory of Almighty God.',
  },
];

/* ─── Chevron icon ─────────────────────────────────────── */

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="shrink-0 transition-transform duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
    style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
  >
    <path
      d="M4.5 2.5L8 6L4.5 9.5"
      stroke="#C99A3C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─── Component ────────────────────────────────────────── */

export default function AimsPanel() {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [isHoverDevice, setIsHoverDevice] = useState(true);
  /* Staggered entry animation on mount */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Detect hover capability */
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsHoverDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ── Toggle pinned state for touch / keyboard ── */
  const handleToggle = useCallback(
    (index: number) => {
      setPinnedIndex((prev) => (prev === index ? null : index));
      /* Clear any hover state so hover doesn't compete */
      setHoveredIndex((h) => (h === index ? null : h));
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle(index);
      }
    },
    [handleToggle],
  );

  /* ── Hover handlers (desktop only) ── */
  const handleMouseEnter = useCallback(
    (index: number) => {
      if (isHoverDevice) setHoveredIndex(index);
    },
    [isHoverDevice],
  );

  const handleMouseLeave = useCallback(
    (index: number) => {
      if (isHoverDevice) {
        setHoveredIndex((prev) => (prev === index ? null : prev));
      }
    },
    [isHoverDevice],
  );

  const isExpanded = (i: number) =>
    (isHoverDevice && hoveredIndex === i) || pinnedIndex === i;

  return (
    <div
      className="relative max-w-[68ch]"
      style={{
        filter: 'drop-shadow(0 12px 30px rgba(107, 31, 42, 0.06))',
      }}
    >
      {/* ── Clipped shell with gold border ── */}
      <div
        className="bg-[#C99A3C]/45 p-[1px]"
        style={{
          clipPath:
            'polygon(0% 0%, 100% 0%, 100% 88%, 50% 100%, 0% 88%)',
        }}
      >
        {/* ── Inner panel ── */}
        <div className="bg-[#FAF6EE]">
          {/* Gold dowel bar across the top */}
          <div
            className="h-1.5 w-full bg-gradient-to-r from-[#C99A3C]/40 via-[#C99A3C] to-[#C99A3C]/40"
            aria-hidden="true"
          />

          {/* ── Aim rows ── */}
          <div className="px-6 sm:px-10 md:px-12 py-10 sm:py-12 md:py-14">
            {aims.map((aim, i) => {
              const expanded = isExpanded(i);
              const fullTextId = `aim-fulltext-${aim.numeral}`;

              return (
                <div
                  key={aim.numeral}
                  className={`
                    transition-all duration-[700ms]
                    ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  {/* ── Row (clickable trigger) ── */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded}
                    aria-controls={fullTextId}
                    onMouseEnter={() => handleMouseEnter(i)}
                    onMouseLeave={() => handleMouseLeave(i)}
                    onClick={() => handleToggle(i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}                      className={`
                      flex items-start gap-4 sm:gap-6
                      cursor-pointer select-none
                      min-h-[44px]
                      hover:pl-[4px]
                      transition-[padding-left] duration-[350ms]
                      ease-[cubic-bezier(0.32,0.72,0,1)]
                    `}
                  >
                    {/* Large gold numeral */}
                    <span className="font-display text-2xl sm:text-3xl md:text-4xl text-[#C99A3C] font-bold leading-none shrink-0 w-9 sm:w-10 md:w-12 text-right">
                      {aim.numeral}
                    </span>

                    {/* Title + summary + full text */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-sm sm:text-base md:text-lg font-bold text-[#6B1F2A] mb-1">
                        {aim.title}
                      </h3>
                      {/* Summary line (always visible) */}
                      <p className="text-xs sm:text-sm md:text-base text-[#231F1E]/80 leading-relaxed">
                        {aim.summary}
                      </p>

                      {/* Full text block (expandable) */}
                      <div
                        id={fullTextId}
                        role="region"
                        className="overflow-hidden transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{
                          maxHeight: expanded ? '240px' : '0',
                          opacity: expanded ? 1 : 0,
                        }}
                      >
                        <p className="text-xs sm:text-sm md:text-base text-[#231F1E]/90 leading-relaxed pt-2 border-t border-[#C99A3C]/20 mt-2">
                          {aim.fullText}
                        </p>
                      </div>
                    </div>

                    {/* Chevron icon on far right */}
                    <div className="flex items-center self-center shrink-0 pt-0.5">
                      <ChevronIcon expanded={expanded} />
                    </div>
                  </div>

                  {/* Divider between rows */}
                  {i < aims.length - 1 && (
                    <div
                      className="h-px bg-[#231F1E]/[0.08] my-5 sm:my-6 md:my-7"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Fringe along bottom taper ── */}
          {/* Desktop fringe */}
          <div
            className="hidden sm:flex justify-center items-end gap-[3px] h-9 pointer-events-none relative -mt-px"
            aria-hidden="true"
          >
            {fringeLines.map((line, i) => (
              <div
                key={i}
                className="w-px bg-[#C99A3C]"
                style={{
                  height: `${line.height}px`,
                  opacity: line.opacity,
                }}
              />
            ))}
          </div>
          {/* Mobile fringe */}
          <div
            className="flex sm:hidden justify-center items-end gap-[2px] h-6 pointer-events-none relative -mt-px"
            aria-hidden="true"
          >
            {fringeLinesMobile.map((line, i) => (
              <div
                key={i}
                className="w-px bg-[#C99A3C]"
                style={{
                  height: `${line.height}px`,
                  opacity: line.opacity,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
