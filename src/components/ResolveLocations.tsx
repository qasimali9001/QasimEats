"use client";

import type { LatLng, Review } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  reviews: Review[];
  onSetLocation: (id: string, loc: LatLng, meta?: { label?: string }) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  enabled: boolean;
};

type Cache = Record<
  string,
  { lat: number; lng: number; label?: string; updatedAt: number }
>;

const LS_KEY = "qasimeats.locationCache.v1";

function loadCache(): Cache {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Cache;
  } catch {
    return {};
  }
}

function saveCache(c: Cache) {
  localStorage.setItem(LS_KEY, JSON.stringify(c));
}

async function geocodeName(name: string) {
  const url = new URL("/api/geocode", window.location.origin);
  url.searchParams.set("name", name);
  url.searchParams.set("city", "Manchester");
  url.searchParams.set("country", "UK");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    result: null | {
      lat: number;
      lng: number;
      label: string;
      importance?: number;
      query?: string;
    };
  };
  return data.result;
}

function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export function ResolveLocations({
  reviews,
  onSetLocation,
  selectedId,
  onSelect,
  enabled,
}: Props) {
  const [cache, setCache] = useState<Cache>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  useEffect(() => {
    setCache(loadCache());
  }, []);

  const unresolved = useMemo(
    () => reviews.filter((r) => r.needsLocation),
    [reviews]
  );

  useEffect(() => {
    if (!enabled) return;
    abortRef.current.aborted = false;
    return () => {
      abortRef.current.aborted = true;
    };
  }, [enabled]);

  async function geocodeOne(id: string, name: string) {
    setBusyId(id);
    try {
      const result = await geocodeName(name);
      if (!result) return;
      if (abortRef.current.aborted) return;

      onSetLocation(id, { lat: result.lat, lng: result.lng }, { label: result.label });

      const next: Cache = {
        ...cache,
        [id]: {
          lat: result.lat,
          lng: result.lng,
          label: result.label,
          updatedAt: Date.now(),
        },
      };
      setCache(next);
      saveCache(next);
    } finally {
      setBusyId(null);
    }
  }

  async function geocodeAll() {
    for (const r of unresolved) {
      if (abortRef.current.aborted) return;
      if (cache[r.id]) continue;
      await geocodeOne(r.id, r.name);
      // Basic client-side throttle.
      await new Promise((res) => setTimeout(res, 1200));
    }
  }

  function exportResolved() {
    const resolved = Object.entries(cache).map(([id, v]) => ({
      id,
      lat: v.lat,
      lng: v.lng,
      label: v.label,
      updatedAt: v.updatedAt,
    }));
    downloadJson("qasimeats-location-overrides.json", resolved);
  }

  if (!enabled) return null;

  return (
    <div className="mt-5 rounded-xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Resolve locations</div>
          <div className="text-sm text-zinc-600">
            We’ll try to find coordinates from the name (Manchester, UK). If it’s wrong,
            select the restaurant and click the map to override.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={geocodeAll}
            className="rounded-lg border border-black/10 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Auto-geocode all
          </button>
          <button
            type="button"
            onClick={exportResolved}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Export overrides
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-black/5">
        {unresolved.length ? (
          <ul className="divide-y divide-black/5">
            {unresolved.map((r) => {
              const cached = cache[r.id];
              const isSelected = selectedId === r.id;
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => onSelect(r.id)}
                    className={[
                      "min-w-0 flex-1 text-left",
                      isSelected ? "text-zinc-950" : "text-zinc-800",
                    ].join(" ")}
                  >
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="truncate text-xs text-zinc-500">
                      {cached?.label ? `Auto: ${cached.label}` : "No location yet"}
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => geocodeOne(r.id, r.name)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {busyId === r.id ? "Finding…" : "Find"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-3 text-sm text-zinc-600">All locations resolved.</div>
        )}
      </div>
    </div>
  );
}

