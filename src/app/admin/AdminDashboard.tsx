"use client";

import { useCallback, useMemo, useState } from "react";
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
  createdAt: string;
  updatedAt: string;
};

const emptyForm = (): Omit<Row, "id" | "createdAt" | "updatedAt"> => ({
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
});

function rowToForm(r: Row): Omit<Row, "id" | "createdAt" | "updatedAt"> {
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
  };
}

export default function AdminDashboard({
  initialRows,
}: {
  initialRows: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [town, setTown] = useState("Manchester");
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

  async function geocode() {
    if (!form.name.trim()) {
      setMsg("Enter a name first.");
      return;
    }
    setGeoBusy(true);
    setMsg(null);
    try {
      const params = new URLSearchParams({
        name: form.name.trim(),
        city: town.trim() || "Manchester",
        country: "UK",
      });
      const res = await fetch(`/api/geocode?${params}`);
      const data = (await res.json()) as {
        result: null | { lat: number; lng: number; label: string };
        error?: string;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Geocode failed");
        return;
      }
      if (!data.result) {
        setMsg("No location found — try a different name or town.");
        return;
      }
      setForm((f) => ({
        ...f,
        lat: data.result!.lat,
        lng: data.result!.lng,
        geocodeSource: "manual",
        geocodeLabel: data.result!.label,
      }));
      setMsg("Location filled from search.");
    } finally {
      setGeoBusy(false);
    }
  }

  async function save() {
    if (!form.name.trim()) {
      setMsg("Name is required.");
      return;
    }
    setSaveBusy(true);
    setMsg(null);
    try {
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
        setMsg("Created.");
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
      setMsg("Saved.");
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Pins & reviews</h1>
        <div className="flex flex-wrap gap-2">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            All pins ({rows.length})
          </h2>
          <ul className="mt-2 max-h-[480px] space-y-1 overflow-auto rounded-xl border border-white/10 bg-background/30 p-2">
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

        <div className="space-y-4 rounded-xl border border-white/10 bg-background/40 p-4">
          <h2 className="text-sm font-semibold">
            {selectedId === "new"
              ? "New restaurant"
              : selected
                ? `Edit — ${selected.name}`
                : "Select a pin or create new"}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Name *</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label>
              <span className="text-xs text-muted">Town (for lookup)</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="Manchester"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={geoBusy}
                onClick={() => void geocode()}
                className="w-full rounded-lg border border-sky-400/30 bg-sky-600/60 py-1.5 text-sm text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {geoBusy ? "Looking up…" : "Look up location"}
              </button>
            </div>
            <label>
              <span className="text-xs text-muted">Latitude</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm tabular-nums"
                value={form.lat ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lat: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label>
              <span className="text-xs text-muted">Longitude</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm tabular-nums"
                value={form.lng ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lng: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Cuisine / type</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.cuisine}
                onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Price (raw text)</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </label>
            <label>
              <span className="text-xs text-muted">Rating (0–5)</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
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
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">What I ordered</span>
              <textarea
                className="mt-1 min-h-[64px] w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.whatIOrdered}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whatIOrdered: e.target.value }))
                }
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Distance</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.distanceText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, distanceText: e.target.value }))
                }
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Review</span>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.review}
                onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Google Maps URL (optional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.googleMapsUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    googleMapsUrl: e.target.value || null,
                  }))
                }
                placeholder="Place page or directions link — leave blank to use pin on public map"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Website (optional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.websiteUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    websiteUrl: e.target.value || null,
                  }))
                }
                placeholder="https://…"
              />
              {suggestedWebsite ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-2.5 py-2 text-xs">
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
            <label className="sm:col-span-2">
              <span className="text-xs text-muted">Menu / menu link (optional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-background/80 px-2 py-1.5 text-sm"
                value={form.menuUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    menuUrl: e.target.value || null,
                  }))
                }
                placeholder="Menu page, PDF, or delivery app link"
              />
            </label>
            {form.geocodeLabel ? (
              <p className="sm:col-span-2 text-xs text-muted">
                Geocode: {form.geocodeLabel}
              </p>
            ) : null}
          </div>

          {msg ? <p className="text-sm text-sky-200/90">{msg}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saveBusy || selectedId === null}
              onClick={() => void save()}
              className="rounded-lg border border-sky-400/30 bg-sky-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40"
            >
              {saveBusy ? "Saving…" : "Save"}
            </button>
            {selectedId && selectedId !== "new" ? (
              <button
                type="button"
                onClick={() => void remove()}
                className="rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
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
