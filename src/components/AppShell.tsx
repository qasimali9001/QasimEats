"use client";

import { useEffect, useMemo, useState } from "react";
import type { Review, ReviewFilters } from "@/lib/types";
import { filterReviews } from "@/lib/filterReviews";
import { FiltersBar } from "@/components/FiltersBar";
import { MapView } from "@/components/MapView";
import { Sidebar } from "@/components/Sidebar";

type Props = {
  reviewsPromise: Promise<Review[]>;
};

const defaultFilters: ReviewFilters = {
  query: "",
  cuisineGroups: [],
  dishTypes: [],
  priceRanges: [],
  minRating: 0,
  includeUnlocated: false,
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b)
  );
}

export function AppShell({ reviewsPromise }: Props) {
  const [allReviews, setAllReviews] = useState<Review[] | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>(defaultFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      <div className="relative z-20 flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-surface px-4 py-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            QasimEats
          </div>
          <div className="truncate text-lg font-semibold tracking-tight text-foreground">
            Manchester Food Map
          </div>
        </div>
      </div>

      <div className="relative z-20 shrink-0 bg-surface/80">
        <FiltersBar
          cuisineGroups={cuisineGroups}
          dishTypes={dishTypeOptions}
          filters={filters}
          onChange={setFilters}
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
