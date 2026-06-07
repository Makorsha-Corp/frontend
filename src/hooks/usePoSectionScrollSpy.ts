import { useEffect, useState, type RefObject } from 'react';

export function usePoSectionScrollSpy(
  scrollContainerRef: RefObject<HTMLElement | null>,
  sectionIds: readonly string[]
): string | null {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sectionIds[0] ?? null
  );

  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || sectionIds.length === 0) return;

    const visible = new Map<string, boolean>();

    const updateActive = () => {
      for (const id of sectionIds) {
        if (visible.get(id)) {
          setActiveSectionId(id);
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting);
        }
        updateActive();
      },
      {
        root,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    updateActive();

    return () => observer.disconnect();
  }, [scrollContainerRef, sectionIds]);

  return activeSectionId;
}
