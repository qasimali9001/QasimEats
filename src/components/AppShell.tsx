"use client";

import { useEffect, useMemo, useState } from "react";
import type { Review } from "@/lib/types";
import { DEFAULT_REVIEW_FILTERS } from "@/lib/types";
import { filterReviews } from "@/lib/filterReviews";
import { AboutModal } from "@/components/AboutModal";
import { FiltersBar } from "@/components/FiltersBar";
import { MapView } from "@/components/MapView";
import { Sidebar } from "@/components/Sidebar";

type Props = {
  reviewsPromise: Promise<Review[]>;
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b)
  );
}

export function AppShell({ reviewsPromise }: Props) {
  const [allReviews, setAllReviews] = useState<Review[] | null>(null);
  const [filters, setFilters] = useState(DEFAULT_REVIEW_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    reviewsPromise.then((r) => {
      if (!alive) return;
      setAllReviews(r);
    });
    return () => {
      alive = false;
    };
  }, [reviewsPromise]);

  const cuisineGroups = useMemo(
    () => uniqueSorted((allReviews ?? []).map((r) => r.cuisineGroup)),
    [allReviews]
  );

  const dishTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of allReviews ?? []) {
      for (const t of r.dishTypes) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allReviews]);

  const locatedReviews = useMemo(
    () => (allReviews ?? []).filter((r) => !r.needsLocation),
    [allReviews]
  );

  const visibleReviews = useMemo(() => {
    if (!allReviews) return [];
    return filterReviews(allReviews, filters);
  }, [allReviews, filters]);

  const selected = useMemo(() => {
    if (!allReviews || !selectedId) return null;
    return allReviews.find((r) => r.id === selectedId) ?? null;
  }, [allReviews, selectedId]);

  if (!allReviews) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        Loading reviews…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="relative z-20 flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-surface px-4 py-3 sm:py-4">
        <h1 className="font-sans text-xl font-medium leading-none tracking-tight text-foreground [-webkit-text-stroke:0.75px_rgba(255,255,255,0.55)] sm:text-2xl">
          Qasim Eats
        </h1>
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-background/50 text-base font-semibold text-foreground hover:bg-white/10"
          aria-label="About QasimEats"
          title="About this site"
        >
          ?
        </button>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <div className="relative z-20 shrink-0 bg-surface/80">
        <FiltersBar
          reviews={locatedReviews}
          cuisineGroups={cuisineGroups}
          dishTypes={dishTypeOptions}
          filters={filters}
          onChange={setFilters}
          onPickRestaurant={setSelectedId}
        />
      </div>

      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <MapView
            reviews={visibleReviews}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <Sidebar
          review={selected}
          open={Boolean(selected)}
          onClose={() => {
            setSelectedId(null);
          }}
        />
      </div>
    </div>
  );
}
