"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PRICE_RANGE_LABEL,
  PRICE_RANGE_ORDER,
} from "@/lib/foodMeta";
import {
  DEFAULT_REVIEW_FILTERS,
  type MealTag,
  type Review,
  type ReviewFilters,
} from "@/lib/types";

type Props = {
  /** Map pins (located reviews) — used for the name search dropdown. */
  reviews: Review[];
  cuisineGroups: string[];
  dishTypes: string[];
  filters: ReviewFilters;
  onChange: (next: ReviewFilters) => void;
  onPickRestaurant?: (id: string) => void;
};

function ToggleChip({
  label,
  pressed,
  onToggle,
}: {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "rounded-full border px-3 py-1 text-sm transition-colors",
        pressed
          ? "border-sky-400/40 bg-sky-500/25 text-sky-50"
          : "border-white/15 bg-surface-elevated/80 text-foreground hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function FilterSection({
  id,
  title,
  selectedCount,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  selectedCount: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const hint =
    selectedCount === 0 ? "Any" : `${selectedCount} selected`;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-background/40">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs text-muted">{hint}</span>
          <Chevron open={open} />
        </span>
      </button>
      {open ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className="border-t border-white/10 px-3 pb-3 pt-2"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function includesNameCI(name: string, needle: string) {
  return name.toLowerCase().includes(needle.toLowerCase());
}

type SearchSort = "name" | "rating";

function sortForDropdown(list: Review[], sort: SearchSort): Review[] {
  const copy = [...list];
  if (sort === "name") {
    copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  } else {
    copy.sort((a, b) => {
      const ra = a.rating;
      const rb = b.rating;
      if (ra == null && rb == null) return a.name.localeCompare(b.name);
      if (ra == null) return 1;
      if (rb == null) return -1;
      if (rb !== ra) return rb - ra;
      return a.name.localeCompare(b.name);
    });
  }
  return copy;
}

export function FiltersBar({
  reviews,
  cuisineGroups,
  dishTypes,
  filters,
  onChange,
  onPickRestaurant,
}: Props) {
  const [openMeal, setOpenMeal] = useState(false);
  const [openCuisine, setOpenCuisine] = useState(false);
  const [openDish, setOpenDish] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSort, setSearchSort] = useState<SearchSort>("name");
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const q = filters.query.trim();

  const dropdownList = useMemo(() => {
    const named = q
      ? reviews.filter((r) => includesNameCI(r.name, q))
      : reviews;
    return sortForDropdown(named, searchSort);
  }, [reviews, q, searchSort]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = searchWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  return (
    <div className="flex flex-col gap-3 border-b border-white/10 bg-surface/90 px-4 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div ref={searchWrapRef} className="relative min-w-0 flex-1">
          <input
            role="combobox"
            aria-expanded={searchOpen}
            aria-controls="restaurant-search-listbox"
            aria-autocomplete="list"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            onFocus={() => setSearchOpen(true)}
            onClick={() => setSearchOpen(true)}
            placeholder="Search by restaurant name…"
            className="w-full rounded-xl border border-white/15 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-0 placeholder:text-muted focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/20"
          />
          {searchOpen ? (
            <div
              id="restaurant-search-listbox"
              role="listbox"
              className="absolute left-0 right-0 top-full z-[80] mt-1 overflow-hidden rounded-xl border border-white/15 bg-surface-elevated shadow-xl ring-1 ring-black/20"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-2 py-2">
                <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Sort
                </span>
                <button
                  type="button"
                  onClick={() => setSearchSort("name")}
                  className={[
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    searchSort === "name"
                      ? "border-sky-400/40 bg-sky-500/20 text-sky-50"
                      : "border-white/15 bg-background/60 text-foreground hover:bg-white/10",
                  ].join(" ")}
                >
                  A–Z
                </button>
                <button
                  type="button"
                  onClick={() => setSearchSort("rating")}
                  className={[
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    searchSort === "rating"
                      ? "border-sky-400/40 bg-sky-500/20 text-sky-50"
                      : "border-white/15 bg-background/60 text-foreground hover:bg-white/10",
                  ].join(" ")}
                >
                  Rating
                </button>
              </div>
              <ul className="max-h-[min(50vh,280px)] overflow-y-auto overscroll-contain py-1">
                {dropdownList.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted">No matching restaurants.</li>
                ) : (
                  dropdownList.map((r) => (
                    <li key={r.id} role="none">
                      <button
                        type="button"
                        role="option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onChange({ ...filters, query: r.name });
                          onPickRestaurant?.(r.id);
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                      >
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {r.name}
                        </span>
                        <span className="inline-flex w-[2.75rem] shrink-0 justify-end tabular-nums text-xs text-muted">
                          {r.rating != null ? (
                            <span className="text-foreground/90">
                              {r.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Min rating
        </span>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={filters.minRating}
          onChange={(e) =>
            onChange({ ...filters, minRating: Number(e.target.value) })
          }
          className="min-w-[8rem] flex-1 sm:max-w-xs"
        />
        <span className="w-10 text-right tabular-nums text-sm text-foreground">
          {filters.minRating}
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_REVIEW_FILTERS })}
          className="shrink-0 rounded-lg border border-white/15 bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10"
        >
          Reset filters
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <FilterSection
          id="filter-meal"
          title="Lunch & dinner"
          selectedCount={filters.mealTags.length}
          open={openMeal}
          onToggle={() => setOpenMeal((v) => !v)}
        >
          <div className="flex flex-wrap gap-2">
            {(["lunch", "dinner"] as MealTag[]).map((tag) => {
                const label = tag === "lunch" ? "Lunch" : "Dinner";
                const pressed = filters.mealTags.includes(tag);
                return (
                  <ToggleChip
                    key={tag}
                    label={label}
                    pressed={pressed}
                    onToggle={() =>
                      onChange({
                        ...filters,
                        mealTags: pressed
                          ? filters.mealTags.filter((x) => x !== tag)
                          : [...filters.mealTags, tag],
                      })
                    }
                  />
                );
              }
            )}
          </div>
        </FilterSection>

        <FilterSection
          id="filter-cuisine"
          title="Cuisine"
          selectedCount={filters.cuisineGroups.length}
          open={openCuisine}
          onToggle={() => setOpenCuisine((v) => !v)}
        >
          <div className="flex flex-wrap gap-2">
            {cuisineGroups.map((c) => {
              const pressed = filters.cuisineGroups.includes(c);
              return (
                <ToggleChip
                  key={c}
                  label={c}
                  pressed={pressed}
                  onToggle={() =>
                    onChange({
                      ...filters,
                      cuisineGroups: pressed
                        ? filters.cuisineGroups.filter((x) => x !== c)
                        : [...filters.cuisineGroups, c],
                    })
                  }
                />
              );
            })}
          </div>
        </FilterSection>

        {dishTypes.length > 0 ? (
          <FilterSection
            id="filter-dish"
            title="Dish type"
            selectedCount={filters.dishTypes.length}
            open={openDish}
            onToggle={() => setOpenDish((v) => !v)}
          >
            <div className="flex flex-wrap gap-2">
              {dishTypes.map((t) => {
                const pressed = filters.dishTypes.includes(t);
                return (
                  <ToggleChip
                    key={t}
                    label={t}
                    pressed={pressed}
                    onToggle={() =>
                      onChange({
                        ...filters,
                        dishTypes: pressed
                          ? filters.dishTypes.filter((x) => x !== t)
                          : [...filters.dishTypes, t],
                      })
                    }
                  />
                );
              })}
            </div>
          </FilterSection>
        ) : null}

        <FilterSection
          id="filter-price"
          title="Price"
          selectedCount={filters.priceRanges.length}
          open={openPrice}
          onToggle={() => setOpenPrice((v) => !v)}
        >
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGE_ORDER.map((idRange) => {
              const pressed = filters.priceRanges.includes(idRange);
              return (
                <ToggleChip
                  key={idRange}
                  label={PRICE_RANGE_LABEL[idRange]}
                  pressed={pressed}
                  onToggle={() =>
                    onChange({
                      ...filters,
                      priceRanges: pressed
                        ? filters.priceRanges.filter((x) => x !== idRange)
                        : [...filters.priceRanges, idRange],
                    })
                  }
                />
              );
            })}
          </div>
        </FilterSection>
      </div>
    </div>
  );
}
