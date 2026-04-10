"use client";

import { useState, type ReactNode } from "react";
import {
  PRICE_RANGE_LABEL,
  PRICE_RANGE_ORDER,
} from "@/lib/foodMeta";
import type { ReviewFilters } from "@/lib/types";

type Props = {
  cuisineGroups: string[];
  dishTypes: string[];
  filters: ReviewFilters;
  onChange: (next: ReviewFilters) => void;
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

export function FiltersBar({
  cuisineGroups,
  dishTypes,
  filters,
  onChange,
}: Props) {
  const [openCuisine, setOpenCuisine] = useState(false);
  const [openDish, setOpenDish] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-b border-white/10 bg-surface/90 px-4 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search (name, cuisine, dish, review)…"
            className="w-full rounded-xl border border-white/15 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-0 placeholder:text-muted focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/20"
          />
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={filters.includeUnlocated}
            onChange={(e) =>
              onChange({ ...filters, includeUnlocated: e.target.checked })
            }
            className="h-4 w-4 rounded border-white/25 bg-background/60"
          />
          Include unlocated
        </label>
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
      </div>

      <div className="flex flex-col gap-2">
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
