"use client";

import { useCallback, useMemo, useState } from "react";
import { ManualLocationMapModal } from "@/components/admin/ManualLocationMapModal";
import { googleMapsUrlFromLatLng } from "@/lib/mapsLinks";
import { COUNTRY_SELECT_OPTIONS } from "@/lib/countryCodes";
import {
  formatUkDateFromIso,
  parseUkDateToIso,
  ukDateTodayLocal,
} from "@/lib/entryDate";
import {
  getSuggestedWebsite,
  hasExplicitNoWebsite,
} from "@/lib/suggestedWebsites";

type Row = {
  id: string;
  name: string;
  cuisine: string;
  price: string;
  whatIOrdered: string;
  distanceText: string;
  rating: number | null;
  review: string;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
  menuUrl: string | null;
  lat: number | null;
  lng: number | null;
  geocodeSource: string | null;
  geocodeLabel: string | null;
  lunch: boolean;
  dinner: boolean;
  /** ISO YYYY-MM-DD from DB */
  entryDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormFields = Omit<Row, "id" | "createdAt" | "updatedAt" | "entryDate"> & {
  /** DD/MM/YYYY for the date input */
  entryDateUk: string;
};

const emptyForm = (): FormFields => ({
  name: "",
  cuisine: "",
  price: "",
  whatIOrdered: "",
  distanceText: "",
  rating: null,
  review: "",
  googleMapsUrl: null,
  websiteUrl: null,
  menuUrl: null,
  lat: null,
  lng: null,
  geocodeSource: null,
  geocodeLabel: null,
  lunch: false,
  dinner: false,
  entryDateUk: ukDateTodayLocal(),
});

function rowToForm(r: Row): FormFields {
  return {
    name: r.name,
    cuisine: r.cuisine,
    price: r.price,
    whatIOrdered: r.whatIOrdered,
    distanceText: r.distanceText,
    rating: r.rating,
    review: r.review,
    googleMapsUrl: r.googleMapsUrl,
    websiteUrl: r.websiteUrl,
    menuUrl: r.menuUrl,
    lat: r.lat,
    lng: r.lng,
    geocodeSource: r.geocodeSource,
    geocodeLabel: r.geocodeLabel,
    lunch: r.lunch,
    dinner: r.dinner,
    entryDateUk: formatUkDateFromIso(r.entryDate) || "",
  };
}

export default function AdminDashboard({
  initialRows,
}: {
  initialRows: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [selectedId, setSelectedId] = useState<string | "new" | null>("new");
  const [form, setForm] = useState<FormFields>(emptyForm());
  const [town, setTown] = useState("Manchester");
  /** ISO2 `gb` or `world` for Nominatim/Places (see `countryCodes`). */
  const [countryCode, setCountryCode] = useState("gb");
  const [geoBusy, setGeoBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntries, setAuditEntries] = useState<
    Array<{
      id: string;
      actor: string;
      action: string;
      entityType: string;
      entityId: string | null;
      summary: string | null;
      createdAt: string;
    }>
  >([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [manualMapOpen, setManualMapOpen] = useState(false);
  const [websiteBusy, setWebsiteBusy] = useState(false);
  /** After a successful save, download full DB CSV (same as Export CSV). */
  const [exportCsvAfterEntry, setExportCsvAfterEntry] = useState(false);

  const selected = useMemo(
    () => (selectedId && selectedId !== "new" ? rows.find((r) => r.id === selectedId) : null),
    [rows, selectedId]
  );

  const suggestedWebsite = useMemo(
    () => getSuggestedWebsite(form.name),
    [form.name]
  );
  const explicitNoSuggestedWebsite = useMemo(
    () => hasExplicitNoWebsite(form.name),
    [form.name]
  );

  const startNew = useCallback(() => {
    setSelectedId("new");
    setForm(emptyForm());
    setTown("Manchester");
    setCountryCode("gb");
    setMsg(null);
  }, []);

  const editRow = useCallback((r: Row) => {
    setSelectedId(r.id);
    setForm(rowToForm(r));
    setMsg(null);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const [exportBusy, setExportBusy] = useState(false);

  async function downloadFullCsvExport(): Promise<
    { ok: true } | { ok: false; message: string }
  > {
    const res = await fetch("/api/admin/export/csv", { credentials: "include" });
    if (!res.ok) {
      return {
        ok: false,
        message: res.status === 401 ? "Not signed in." : "Export failed.",
      };
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition");
    const m = cd?.match(/filename="([^"]+)"/);
    const filename =
      m?.[1] ?? `qasimeats-export-${new Date().toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  }

  async function exportCsv() {
    setExportBusy(true);
    setMsg(null);
    try {
      const r = await downloadFullCsvExport();
      setMsg(r.ok ? "Download started." : r.message);
    } finally {
      setExportBusy(false);
    }
  }

  async function geocode() {
    const name = form.name.trim();
    if (!name) {
      setMsg("Enter a restaurant name first.");
      return;
    }
    setGeoBusy(true);
    setMsg(null);
    try {
      const params = new URLSearchParams({
        name,
        city: town.trim() || "Manchester",
        country: countryCode,
      });
      const res = await fetch(`/api/geocode?${params}`, {
        credentials: "same-origin",
      });
      let data: {
        result: null | {
          lat: number;
          lng: number;
          label: string;
          websiteUrl?: string | null;
          source?: "nominatim" | "google_places";
        };
        error?: string;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setMsg("Bad response from geocoder — try again.");
        return;
      }
      if (!res.ok) {
        setMsg(data.error ?? `Geocode failed (${res.status})`);
        return;
      }
      if (!data.result) {
        setMsg("No location found — try a different name or town.");
        return;
      }
      const { lat, lng, label, websiteUrl: placesSite, source: geoSrc } =
        data.result;
      const mapsUrl = googleMapsUrlFromLatLng(lat, lng);
      const suggestedSite = getSuggestedWebsite(name);
      const geocodeSource =
        geoSrc === "google_places" ? "google_places" : "nominatim";
      setForm((f) => ({
        ...f,
        lat,
        lng,
        geocodeSource,
        geocodeLabel: label,
        googleMapsUrl: mapsUrl,
        websiteUrl: placesSite ?? suggestedSite ?? f.websiteUrl,
      }));
      setMsg(
        placesSite
          ? "Location, website (Google Places), and links updated."
          : geoSrc === "google_places"
            ? "Location found via Google Places (no OpenStreetMap match for that query)."
            : "Location and links updated from lookup."
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Geocode request failed.");
    } finally {
      setGeoBusy(false);
    }
  }

  async function findWebsite() {
    const name = form.name.trim();
    if (!name) {
      setMsg("Enter a restaurant name first.");
      return;
    }
    if (form.lat == null || form.lng == null) {
      setMsg("Set a location first (Find location or Manual find location).");
      return;
    }
    setWebsiteBusy(true);
    setMsg(null);
    try {
      const params = new URLSearchParams({
        name,
        city: town.trim() || "Manchester",
        country: countryCode,
        lat: String(form.lat),
        lng: String(form.lng),
      });
      const res = await fetch(`/api/place-website?${params}`, {
        credentials: "same-origin",
      });
      let data: { websiteUrl?: string | null; error?: string } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setMsg("Bad response from website lookup — try again.");
        return;
      }
      if (!res.ok) {
        setMsg(
          data.error ??
            (res.status === 401
              ? "Not signed in."
              : `Website lookup failed (${res.status})`)
        );
        return;
      }
      const w = data.websiteUrl?.trim();
      if (w) {
        setForm((f) => ({ ...f, websiteUrl: w }));
        setMsg("Website filled from Google Places.");
      } else {
        setMsg(
          "No website in Google’s listing for this name/location — try Find website again after adjusting the name, or paste a URL manually."
        );
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Website lookup failed.");
    } finally {
      setWebsiteBusy(false);
    }
  }

  const applyManualLocation = useCallback(
    async (coords: { lat: number; lng: number }) => {
      const { lat, lng } = coords;
      let label: string | null = null;
      let warn: string | null = null;
      const name = form.name.trim();
      try {
        const qs = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
        });
        const res = await fetch(`/api/reverse-geocode?${qs}`, {
          credentials: "same-origin",
        });
        let data: {
          label?: string | null;
          error?: string;
        } = {};
        try {
          data = (await res.json()) as typeof data;
        } catch {
          warn = "Could not read address details for this pin.";
        }
        if (res.ok) {
          label = data.label ?? null;
        } else {
          warn = data.error ?? `Reverse lookup failed (${res.status}).`;
        }
      } catch (e) {
        warn = e instanceof Error ? e.message : "Reverse lookup failed.";
      }

      const mapsUrl = googleMapsUrlFromLatLng(lat, lng);
      const suggestedSite = getSuggestedWebsite(name);
      setForm((f) => ({
        ...f,
        lat,
        lng,
        geocodeSource: "manual",
        geocodeLabel:
          label ?? `Pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        googleMapsUrl: mapsUrl,
        websiteUrl: suggestedSite ?? f.websiteUrl,
      }));
      setManualMapOpen(false);
      setMsg(
        warn
          ? `Location saved from map. ${warn}`
          : label
            ? "Location set from map (address matched). Use Find website if you need the site URL."
            : "Location set from map. Use Find website if you need the site URL."
      );
    },
    [form.name]
  );

  async function save() {
    if (!form.name.trim()) {
      setMsg("Name is required.");
      return;
    }
    setSaveBusy(true);
    setMsg(null);
    try {
      const entryIso = parseUkDateToIso(form.entryDateUk);
      if (form.entryDateUk.trim() !== "" && entryIso === null) {
        setMsg("Entry date must be DD/MM/YYYY (e.g. 10/04/2026) or left empty.");
        setSaveBusy(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        cuisine: form.cuisine,
        price: form.price,
        whatIOrdered: form.whatIOrdered,
        distanceText: form.distanceText,
        rating: form.rating,
        review: form.review,
        googleMapsUrl: form.googleMapsUrl || null,
        websiteUrl: form.websiteUrl || null,
        menuUrl: form.menuUrl || null,
        lat: form.lat,
        lng: form.lng,
        geocodeSource: form.geocodeSource,
        geocodeLabel: form.geocodeLabel,
        lunch: form.lunch,
        dinner: form.dinner,
        entryDate: entryIso,
      };

      if (selectedId === "new") {
        const res = await fetch("/api/admin/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg((data as { error?: string }).error ?? "Save failed");
          return;
        }
        const row = (data as { restaurant: Row }).restaurant;
        setRows((r) => [...r, row].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedId(row.id);
        setForm(rowToForm(row));
        if (exportCsvAfterEntry) {
          const ex = await downloadFullCsvExport();
          setMsg(
            ex.ok
              ? "Created. CSV downloaded."
              : `Created. CSV export failed: ${ex.message}`
          );
        } else {
          setMsg("Created.");
        }
        return;
      }

      if (!selectedId) return;

      const res = await fetch(`/api/admin/restaurants/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((data as { error?: string }).error ?? "Save failed");
        return;
      }
      const row = (data as { restaurant: Row }).restaurant;
      setRows((r) =>
        r.map((x) => (x.id === row.id ? row : x)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setForm(rowToForm(row));
      if (exportCsvAfterEntry) {
        const ex = await downloadFullCsvExport();
        setMsg(
          ex.ok
            ? "Saved. CSV downloaded."
            : `Saved. CSV export failed: ${ex.message}`
        );
      } else {
        setMsg("Saved.");
      }
    } finally {
      setSaveBusy(false);
    }
  }

  async function remove() {
    if (!selectedId || selectedId === "new") return;
    if (!window.confirm("Delete this restaurant from the database?")) return;
    const res = await fetch(`/api/admin/restaurants/${selectedId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setMsg("Delete failed");
      return;
    }
    setRows((r) => r.filter((x) => x.id !== selectedId));
    startNew();
    setMsg("Deleted.");
  }

  async function loadAudit() {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/admin/audit?limit=100");
      const data = (await res.json()) as { entries?: typeof auditEntries };
      setAuditEntries(data.entries ?? []);
    } finally {
      setAuditLoading(false);
    }
  }

  const fieldBase =
    "mt-1 w-full min-w-0 max-w-full rounded-lg border border-white/15 bg-background/80 px-2 py-2 text-base sm:px-2 sm:py-1.5 sm:text-sm";

  return (
    <div className="min-w-0 space-y-8">
      {manualMapOpen ? (
        <ManualLocationMapModal
          onClose={() => setManualMapOpen(false)}
          onConfirm={applyManualLocation}
          initialPin={
            form.lat != null && form.lng != null
              ? { lat: form.lat, lng: form.lng }
              : null
          }
        />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <h1 className="min-w-0 text-xl font-semibold tracking-tight">Pins & reviews</h1>
        <div className="flex min-w-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={startNew}
            className="rounded-lg border border-white/15 bg-surface-elevated px-3 py-1.5 text-sm hover:bg-white/10"
          >
            New pin
          </button>
          <button
            type="button"
            onClick={() => {
              setAuditOpen((v) => !v);
              if (!auditOpen) void loadAudit();
            }}
            className="rounded-lg border border-white/15 bg-surface-elevated px-3 py-1.5 text-sm hover:bg-white/10"
          >
            {auditOpen ? "Hide audit log" : "Audit log"}
          </button>
          <button
            type="button"
            disabled={exportBusy}
            onClick={() => void exportCsv()}
            className="rounded-lg border border-white/15 bg-surface-elevated px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            {exportBusy ? "Exporting…" : "Export CSV"}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            Log out
          </button>
        </div>
      </div>

      {auditOpen ? (
        <section className="rounded-xl border border-white/10 bg-background/40 p-4">
          <h2 className="text-sm font-semibold">Audit log</h2>
          {auditLoading ? (
            <p className="mt-2 text-sm text-muted">Loading…</p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {auditEntries.map((e) => (
                <li
                  key={e.id}
                  className="border-b border-white/5 pb-2 text-muted last:border-0"
                >
                  <span className="text-foreground/90">{e.createdAt}</span> —{" "}
                  <span className="text-foreground">{e.actor}</span>{" "}
                  <span className="text-sky-200/90">{e.action}</span>{" "}
                  {e.entityType}
                  {e.entityId ? ` (${e.entityId})` : ""}
                  {e.summary ? ` — ${e.summary}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="order-2 min-w-0 lg:order-none">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            All pins ({rows.length})
          </h2>
          <ul className="mt-2 max-h-[min(280px,42svh)] space-y-1 overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 bg-background/30 p-2 sm:max-h-[min(360px,50svh)] lg:max-h-[480px]">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => editRow(r)}
                  className={[
                    "w-full rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    selectedId === r.id
                      ? "bg-sky-500/20 text-sky-50"
                      : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="truncate text-xs text-muted">{r.cuisine}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 min-w-0 space-y-4 overflow-x-hidden rounded-xl border border-white/10 bg-background/40 p-3 sm:p-4 lg:order-none">
          <h2 className="break-words text-sm font-semibold">
            {selectedId === "new"
              ? "New restaurant"
              : selected
                ? `Edit — ${selected.name}`
                : "Select a pin or create new"}
          </h2>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">Name *</span>
              <input
                className={fieldBase}
                autoComplete="off"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>

            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">Entry date</span>
              <input
                className={`${fieldBase} tabular-nums`}
                autoComplete="off"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                value={form.entryDateUk}
                onChange={(e) =>
                  setForm((f) => ({ ...f, entryDateUk: e.target.value }))
                }
              />
              <span className="mt-1 block text-[11px] text-muted">
                Defaults to today for new pins. Clear the field to leave the
                date unset (e.g. older entries).
              </span>
            </label>

            <label className="min-w-0 sm:col-span-1">
              <span className="text-xs text-muted">Town for lookup</span>
              <input
                className={fieldBase}
                autoComplete="address-level2"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Manchester"
              />
            </label>
            <label className="min-w-0 sm:col-span-1">
              <span className="text-xs text-muted">Country</span>
              <select
                className={fieldBase}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {COUNTRY_SELECT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-muted">
                Default UK + Manchester-style local bias. Choose Worldwide to search
                OpenStreetMap / Google without a country filter.
              </span>
            </label>
            <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 sm:justify-end">
              <button
                type="button"
                disabled={geoBusy}
                onClick={() => void geocode()}
                className="min-h-11 w-full touch-manipulation rounded-lg border border-sky-400/30 bg-sky-600/60 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 sm:min-h-0 sm:py-2"
              >
                {geoBusy ? "Looking up…" : "Find location"}
              </button>
              <button
                type="button"
                onClick={() => setManualMapOpen(true)}
                className="min-h-11 w-full touch-manipulation rounded-lg border border-white/20 bg-surface-elevated py-2.5 text-sm font-medium hover:bg-white/10 sm:min-h-0 sm:py-2"
              >
                Manual find location
              </button>
            </div>

            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted sm:col-span-2">
              Filled from lookup (edit if needed)
            </p>
            <label className="min-w-0">
              <span className="text-xs text-muted">Latitude</span>
              <input
                className={`${fieldBase} tabular-nums`}
                inputMode="decimal"
                value={form.lat ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lat: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="min-w-0">
              <span className="text-xs text-muted">Longitude</span>
              <input
                className={`${fieldBase} tabular-nums`}
                inputMode="decimal"
                value={form.lng ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lng: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">Google Maps URL</span>
              <input
                className={fieldBase}
                inputMode="url"
                value={form.googleMapsUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    googleMapsUrl: e.target.value || null,
                  }))
                }
                placeholder="Set by lookup from coordinates"
              />
            </label>
            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">Website</span>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                <input
                  className={`${fieldBase} mt-0 sm:min-w-0 sm:flex-1`}
                  inputMode="url"
                  value={form.websiteUrl ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      websiteUrl: e.target.value || null,
                    }))
                  }
                  placeholder="https://…"
                />
                <button
                  type="button"
                  disabled={websiteBusy}
                  onClick={() => void findWebsite()}
                  className="min-h-11 shrink-0 touch-manipulation rounded-lg border border-white/20 bg-surface-elevated px-3 py-2.5 text-sm font-medium hover:bg-white/10 disabled:opacity-50 sm:min-h-0 sm:min-w-[140px] sm:py-2"
                >
                  {websiteBusy ? "Looking up…" : "Find website"}
                </button>
              </div>
              {suggestedWebsite ? (
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-2.5 py-2 text-xs">
                  <span className="shrink-0 font-medium text-sky-200/90">
                    Suggested
                  </span>
                  <span className="min-w-0 flex-1 break-all text-foreground/85">
                    {suggestedWebsite}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 rounded-md border border-sky-400/40 bg-sky-600/50 px-2 py-1 text-xs font-medium text-white hover:bg-sky-600/70 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={form.websiteUrl?.trim() === suggestedWebsite}
                    onClick={() =>
                      setForm((f) => ({ ...f, websiteUrl: suggestedWebsite }))
                    }
                  >
                    {form.websiteUrl?.trim() === suggestedWebsite
                      ? "Using suggestion"
                      : "Use suggestion"}
                  </button>
                </div>
              ) : explicitNoSuggestedWebsite ? (
                <p className="mt-2 text-xs text-muted">
                  No dedicated site on file for this name (social / stall only).
                </p>
              ) : null}
            </label>
            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">Menu link</span>
              <input
                className={fieldBase}
                inputMode="url"
                value={form.menuUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    menuUrl: e.target.value || null,
                  }))
                }
                placeholder="Optional — add manually if you have one"
              />
            </label>
            {form.geocodeLabel ? (
              <p className="break-words text-xs text-muted sm:col-span-2">
                Lookup match: {form.geocodeLabel}
              </p>
            ) : null}

            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted sm:col-span-2">
              Your review
            </p>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted">Meal tags</span>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/25 bg-background/80 text-sky-600 focus:ring-sky-500/40"
                    checked={form.lunch}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lunch: e.target.checked }))
                    }
                  />
                  Lunch
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/25 bg-background/80 text-sky-600 focus:ring-sky-500/40"
                    checked={form.dinner}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dinner: e.target.checked }))
                    }
                  />
                  Dinner
                </label>
              </div>
            </div>
            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">Cuisine / type</span>
              <input
                className={fieldBase}
                value={form.cuisine}
                onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
              />
            </label>
            <label className="min-w-0">
              <span className="text-xs text-muted">Price (raw text)</span>
              <input
                className={fieldBase}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </label>
            <label className="min-w-0">
              <span className="text-xs text-muted">Rating (0–5)</span>
              <input
                className={fieldBase}
                type="number"
                step="0.5"
                min={0}
                max={5}
                value={form.rating ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rating:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">What I ordered</span>
              <textarea
                className={`${fieldBase} min-h-[88px] resize-y sm:min-h-[64px]`}
                value={form.whatIOrdered}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whatIOrdered: e.target.value }))
                }
              />
            </label>
            <label className="min-w-0 sm:col-span-2">
              <span className="text-xs text-muted">Review</span>
              <textarea
                className={`${fieldBase} min-h-[140px] resize-y sm:min-h-[120px]`}
                value={form.review}
                onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
              />
            </label>
          </div>

          {msg ? (
            <p className="break-words text-sm text-sky-200/90">{msg}</p>
          ) : null}

          <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground/90">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/25 bg-background/80 text-sky-600 focus:ring-sky-500/40"
              checked={exportCsvAfterEntry}
              onChange={(e) => setExportCsvAfterEntry(e.target.checked)}
            />
            <span>
              Export CSV After Entry
              <span className="mt-0.5 block text-xs font-normal text-muted">
                After Save succeeds, downloads a full database export (same as
                Export CSV). Leave off for faster saves.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-2 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              disabled={saveBusy || selectedId === null}
              onClick={() => void save()}
              className="min-h-11 min-w-[120px] touch-manipulation rounded-lg border border-sky-400/30 bg-sky-600/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40 sm:min-h-0 sm:py-2"
            >
              {saveBusy ? "Saving…" : "Save"}
            </button>
            {selectedId && selectedId !== "new" ? (
              <button
                type="button"
                onClick={() => void remove()}
                className="min-h-11 touch-manipulation rounded-lg border border-red-400/30 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 sm:min-h-0 sm:py-2"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
