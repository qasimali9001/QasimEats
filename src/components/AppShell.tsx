"use client";

import { useEffect, useMemo, useState } from "react";
import type { LatLng, Review, ReviewFilters } from "@/lib/types";
import { filterReviews } from "@/lib/filterReviews";
import { FiltersBar } from "@/components/FiltersBar";
import { MapView } from "@/components/MapView";
import { Sidebar } from "@/components/Sidebar";
import { ResolveLocations } from "@/components/ResolveLocations";

type Props = {
  reviewsPromise: Promise<Review[]>;
};

const defaultFilters: ReviewFilters = {
  query: "",
  cuisines: [],
  prices: [],
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
  const [resolveMode, setResolveMode] = useState(false);

  useEffect(() => {
    if (!resolveMode) return;
    // Resolve mode needs to show unlocated entries, otherwise you can't pick anything.
    setFilters((f) => (f.includeUnlocated ? f : { ...f, includeUnlocated: true }));
  }, [resolveMode]);

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

  const cuisines = useMemo(
    () => uniqueSorted((allReviews ?? []).map((r) => r.cuisine)),
    [allReviews]
  );

  const prices = useMemo(
    () => uniqueSorted((allReviews ?? []).map((r) => r.price)),
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

  function setLocation(id: string, loc: LatLng, meta?: { label?: string }) {
    setAllReviews((prev) => {
      if (!prev) return prev;
      return prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          location: loc,
          needsLocation: false,
          geocode: {
            source: "nominatim",
            label: meta?.label,
          },
        };
      });
    });
  }

  if (!allReviews) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-zinc-900">
        Loading reviews…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-zinc-900">
      <div className="relative z-20 flex shrink-0 items-center justify-between gap-4 border-b border-black/10 bg-white px-4 py-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            QasimEats
          </div>
          <div className="truncate text-lg font-semibold tracking-tight">
            Manchester Food Map
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResolveMode((v) => !v)}
            className={[
              "rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors",
              resolveMode
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-black/10 bg-white text-zinc-900 hover:bg-zinc-50",
            ].join(" ")}
          >
            {resolveMode ? "Resolving…" : "Resolve locations"}
          </button>
        </div>
      </div>

      <div className="relative z-20 shrink-0 bg-white">
        <FiltersBar
          cuisines={cuisines}
          prices={prices}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <MapView
            reviews={visibleReviews}
            selectedId={selectedId}
            onSelect={setSelectedId}
            resolveMode={resolveMode}
            onSetLocation={setLocation}
          />
        </div>

        <Sidebar
          review={selected}
          open={resolveMode || Boolean(selected)}
          onClose={() => {
            setResolveMode(false);
            setSelectedId(null);
          }}
        >
          <ResolveLocations
            enabled={resolveMode}
            reviews={allReviews}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSetLocation={setLocation}
          />
        </Sidebar>
      </div>
    </div>
  );
}

