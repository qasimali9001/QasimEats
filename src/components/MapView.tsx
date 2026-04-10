"use client";

import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyOpenFreeMapEggeatsTheme,
  DEFAULT_MAP_STYLE_URL,
} from "@/lib/mapStyle";
import type { LatLng, Review } from "@/lib/types";

type Props = {
  reviews: Review[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSetLocation?: (id: string, location: LatLng) => void;
  resolveMode?: boolean;
};

const manchester: LatLng = { lat: 53.4808, lng: -2.2426 };

function clampRating(r: number) {
  return Math.max(1, Math.min(5, r));
}

/**
 * Continuous hue from red (1★) → yellow (~3★) → green (5★).
 * Each 0.5 step shifts hue smoothly so pins are easy to compare.
 */
function pinColors(rating: number | null, selected: boolean) {
  if (rating == null) {
    return {
      fill: selected ? "#d4d4d8" : "#fafafa",
      stroke: selected ? "#52525b" : "#71717a",
      dot: "#a1a1aa",
    };
  }

  const r = clampRating(rating);
  // 1 → 0° (red), 5 → 120° (green); passes through yellow ~60° around 3★
  const hue = ((r - 1) / 4) * 120;

  const fillSat = selected ? 92 : 88;
  const fillLight = selected ? 86 : 91;
  const strokeSat = 72;
  const strokeLight = selected ? 26 : 32;
  const dotSat = 90;
  const dotLight = selected ? 40 : 46;

  return {
    fill: `hsl(${hue} ${fillSat}% ${fillLight}%)`,
    stroke: `hsl(${hue} ${strokeSat}% ${strokeLight}%)`,
    dot: `hsl(${hue} ${dotSat}% ${dotLight}%)`,
  };
}

function pinSvg(selected: boolean, rating: number | null) {
  const { fill, stroke, dot } = pinColors(rating, selected);
  const sw = selected ? 1.75 : 1.25;
  return `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 2C9.5 2 4.5 7.1 4.5 13.4c0 8.2 9.8 18.8 10.4 19.5.4.4 1.1.4 1.5 0 .6-.7 10.4-11.3 10.4-19.5C26.8 7.1 21.8 2 16 2z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
      <circle cx="16" cy="13" r="4" fill="${dot}"/>
    </svg>
  `;
}

export function MapView({
  reviews,
  selectedId,
  onSelect,
  onSetLocation,
  resolveMode = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  /** Keep map init effect stable: never depend on selectedId / callback identity or the map remounts → black flash. */
  const selectedIdRef = useRef(selectedId);
  const resolveModeRef = useRef(resolveMode);
  const onSetLocationRef = useRef(onSetLocation);
  selectedIdRef.current = selectedId;
  resolveModeRef.current = resolveMode;
  onSetLocationRef.current = onSetLocation;

  const [view, setView] = useState(() => ({
    center: [manchester.lng, manchester.lat] as [number, number],
    zoom: 12,
  }));

  const located = useMemo(
    () => reviews.filter((r): r is Review & { location: LatLng } => Boolean(r.location)),
    [reviews]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const envStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
    const style =
      typeof envStyle === "string" && envStyle.trim().length > 0
        ? envStyle.trim()
        : DEFAULT_MAP_STYLE_URL;

    const container = containerRef.current;

    const map = new maplibregl.Map({
      container,
      style,
      center: view.center,
      zoom: view.zoom,
      canvasContextAttributes: {
        antialias: true,
        /** Windows / hybrid GPUs: avoid silent GL failure → blank map. */
        failIfMajorPerformanceCaveat: false,
      },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    const applyBasemapTheme = () => {
      applyOpenFreeMapEggeatsTheme(map);
    };

    let lastW = 0;
    let lastH = 0;
    const doResize = () => {
      map.resize();
    };

    /** Only resize when size really changes — spurious observer callbacks + resize() can flash black. */
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.round(cr.width);
      const h = Math.round(cr.height);
      if (w === lastW && h === lastH) return;
      if (w < 1 || h < 1) return;
      lastW = w;
      lastH = h;
      doResize();
    });
    ro.observe(container);

    map.once("load", () => {
      doResize();
      applyBasemapTheme();
    });
    map.once("idle", () => {
      doResize();
      applyBasemapTheme();
    });

    if (process.env.NODE_ENV === "development") {
      map.on("error", (e) => {
        console.warn("[map]", e.error?.message ?? e);
      });
    }

    map.on("moveend", () => {
      const c = map.getCenter();
      setView({ center: [c.lng, c.lat], zoom: map.getZoom() });
    });

    map.on("click", (e) => {
      if (!resolveModeRef.current) return;
      const id = selectedIdRef.current;
      if (!id) return;
      onSetLocationRef.current?.(id, { lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    mapRef.current = map;

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // Map must mount once; selection/callbacks use refs above.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, []);

  // One marker per review — no clustering.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: maplibregl.Marker[] = [];

    for (const r of located) {
      const isSelected = selectedId === r.id;

      const el = document.createElement("button");
      el.type = "button";
      el.title = r.name;
      el.setAttribute("aria-label", r.name);
      el.className = [
        "group flex flex-col items-center justify-end outline-none",
        "focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
      ].join(" ");
      el.style.cursor = "pointer";
      el.style.padding = "0";
      el.style.border = "none";
      el.style.background = "transparent";
      el.innerHTML = pinSvg(isSelected, r.rating);
      el.onclick = (e) => {
        e.stopPropagation();
        onSelect(r.id);
      };

      const m = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        offset: [0, -4],
      })
        .setLngLat([r.location.lng, r.location.lat])
        .addTo(map);
      markers.push(m);
    }

    return () => {
      for (const m of markers) m.remove();
    };
  }, [located, selectedId, onSelect]);

  // Ensure selected point is in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const r = reviews.find((x) => x.id === selectedId);
    if (!r?.location) return;
    map.easeTo({
      center: [r.location.lng, r.location.lat],
      duration: 300,
      zoom: Math.max(map.getZoom(), 14),
    });
  }, [selectedId, reviews]);

  return (
    <div className="relative isolate h-full min-h-0 w-full min-w-0 overflow-hidden [&_.maplibregl-canvas]:outline-none">
      <div
        ref={containerRef}
        className="h-full min-h-[280px] w-full touch-manipulation overflow-hidden md:min-h-0"
      />
      {resolveMode ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur">
          Click the map to set the selected restaurant&apos;s location.
        </div>
      ) : null}
    </div>
  );
}
