"use client";

import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyOpenFreeMapEggeatsTheme,
  DEFAULT_MAP_STYLE_URL,
} from "@/lib/mapStyle";

const MANCHESTER = { lat: 53.4808, lng: -2.2426 };

type Props = {
  onClose: () => void;
  /** Called after user confirms; close modal in parent on success. */
  onConfirm: (coords: { lat: number; lng: number }) => Promise<void>;
  /** Map center / initial pin when opening. */
  initialPin?: { lat: number; lng: number } | null;
};

function pinEl() {
  const el = document.createElement("div");
  el.className = "manual-loc-pin";
  el.style.width = "32px";
  el.style.height = "40px";
  el.style.cursor = "grab";
  el.innerHTML = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 2C9.5 2 4.5 7.1 4.5 13.4c0 8.2 9.8 18.8 10.4 19.5.4.4 1.1.4 1.5 0 .6-.7 10.4-11.3 10.4-19.5C26.8 7.1 21.8 2 16 2z" fill="#38bdf8" stroke="#0ea5e9" stroke-width="1.5"/>
      <circle cx="16" cy="13" r="4" fill="#0c4a6e"/>
    </svg>`;
  return el;
}

export function ManualLocationMapModal({
  onClose,
  onConfirm,
  initialPin,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(() =>
    initialPin &&
    Number.isFinite(initialPin.lat) &&
    Number.isFinite(initialPin.lng)
      ? { lat: initialPin.lat, lng: initialPin.lng }
      : null
  );
  const [confirmBusy, setConfirmBusy] = useState(false);

  const initialView = useMemo(() => {
    if (
      initialPin != null &&
      Number.isFinite(initialPin.lat) &&
      Number.isFinite(initialPin.lng)
    ) {
      return {
        center: [initialPin.lng, initialPin.lat] as [number, number],
        zoom: 15,
      };
    }
    return {
      center: [MANCHESTER.lng, MANCHESTER.lat] as [number, number],
      zoom: 12,
    };
  }, [initialPin?.lat, initialPin?.lng]);

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
      center: initialView.center,
      zoom: initialView.zoom,
      canvasContextAttributes: {
        antialias: true,
        failIfMajorPerformanceCaveat: false,
      },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    let lastW = 0;
    let lastH = 0;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.round(cr.width);
      const h = Math.round(cr.height);
      if (w === lastW && h === lastH) return;
      if (w < 1 || h < 1) return;
      lastW = w;
      lastH = h;
      map.resize();
    });
    ro.observe(container);

    const applyBasemapTheme = () => {
      applyOpenFreeMapEggeatsTheme(map);
    };

    map.once("load", () => {
      map.resize();
      applyBasemapTheme();
    });
    map.once("idle", () => {
      map.resize();
      applyBasemapTheme();
    });

    if (process.env.NODE_ENV === "development") {
      map.on("error", (e) => {
        console.warn("[manual-map]", e.error?.message ?? e);
      });
    }

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      if (!markerRef.current) {
        const m = new maplibregl.Marker({
          element: pinEl(),
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([lng, lat])
          .addTo(map);
        m.on("dragend", () => {
          const ll = m.getLngLat();
          setPin({ lat: ll.lat, lng: ll.lng });
        });
        markerRef.current = m;
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }
      setPin({ lat, lng });
    });

    mapRef.current = map;

    return () => {
      ro.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [initialView]);

  // If parent passed initialPin and marker wasn't created by click yet, add marker after load.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialPin || markerRef.current) return;
    if (!Number.isFinite(initialPin.lat) || !Number.isFinite(initialPin.lng)) return;

    const add = () => {
      if (markerRef.current) return;
      const { lng, lat } = initialPin;
      const m = new maplibregl.Marker({
        element: pinEl(),
        draggable: true,
        anchor: "bottom",
      })
        .setLngLat([lng, lat])
        .addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        setPin({ lat: ll.lat, lng: ll.lng });
      });
      markerRef.current = m;
      setPin({ lat, lng });
    };

    if (map.loaded()) add();
    else map.once("load", add);
  }, [initialPin?.lat, initialPin?.lng]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleConfirm = useCallback(async () => {
    if (!pin) return;
    setConfirmBusy(true);
    try {
      await onConfirm(pin);
    } finally {
      setConfirmBusy(false);
    }
  }, [onConfirm, pin]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-[max(0.75rem,env(safe-area-inset-top))_max(0.75rem,env(safe-area-inset-right))_max(0.75rem,env(safe-area-inset-bottom))_max(0.75rem,env(safe-area-inset-left))] backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-loc-title"
    >
      <div className="flex max-h-[min(100dvh,720px)] w-full max-w-3xl min-h-0 flex-col overflow-hidden rounded-xl border border-white/15 bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <h2 id="manual-loc-title" className="text-base font-semibold">
              Manual find location
            </h2>
            <p className="mt-1 text-sm text-muted">
              Pan and zoom, then tap the map to place a pin. Drag to fine-tune.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 shrink-0 touch-manipulation rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10 sm:min-h-0 sm:py-1.5"
          >
            Close
          </button>
        </div>

        <div className="relative min-h-0 flex-1 touch-manipulation">
          <div
            ref={containerRef}
            className="h-[min(42svh,380px)] w-full min-h-[200px] sm:h-[min(50vh,400px)] sm:min-h-[280px] [&_.maplibregl-canvas]:outline-none"
          />
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
          <p className="min-w-0 break-all text-xs text-muted sm:break-words">
            {pin
              ? `Selected: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`
              : "No pin yet — tap the map to place one."}
          </p>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 touch-manipulation rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/10 sm:min-h-0 sm:flex-initial sm:py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!pin || confirmBusy}
              onClick={() => void handleConfirm()}
              className="min-h-11 flex-1 touch-manipulation rounded-lg border border-sky-400/30 bg-sky-600/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40 sm:min-h-0 sm:flex-initial sm:py-2"
            >
              {confirmBusy ? "Applying…" : "Use this location"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
