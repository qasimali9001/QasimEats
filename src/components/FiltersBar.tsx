"use client";

import type { ReviewFilters } from "@/lib/types";

type Props = {
  cuisines: string[];
  prices: string[];
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
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-black/10 bg-white text-zinc-900 hover:bg-zinc-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function FiltersBar({ cuisines, prices, filters, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-black/10 bg-white/80 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search (name, cuisine, review)…"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-black/20"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={filters.includeUnlocated}
            onChange={(e) =>
              onChange({ ...filters, includeUnlocated: e.target.checked })
            }
            className="h-4 w-4 rounded border-black/20"
          />
          Include unlocated
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Cuisine
        </div>
        {cuisines.map((c) => {
          const pressed = filters.cuisines.includes(c);
          return (
            <ToggleChip
              key={c}
              label={c}
              pressed={pressed}
              onToggle={() =>
                onChange({
                  ...filters,
                  cuisines: pressed
                    ? filters.cuisines.filter((x) => x !== c)
                    : [...filters.cuisines, c],
                })
              }
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Price
        </div>
        {prices.map((p) => {
          const pressed = filters.prices.includes(p);
          return (
            <ToggleChip
              key={p}
              label={p}
              pressed={pressed}
              onToggle={() =>
                onChange({
                  ...filters,
                  prices: pressed
                    ? filters.prices.filter((x) => x !== p)
                    : [...filters.prices, p],
                })
              }
            />
          );
        })}
        <div className="ml-auto flex items-center gap-2 text-sm text-zinc-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
            className="w-40"
          />
          <span className="w-10 text-right tabular-nums">{filters.minRating}</span>
        </div>
      </div>
    </div>
  );
}

