"use client";

import { useCallback, useId, useState } from "react";

type Props = {
  tags: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  inputClassName: string;
};

export function DishTagsEditor({
  tags,
  onChange,
  suggestions,
  inputClassName,
}: Props) {
  const [draft, setDraft] = useState("");
  const baseId = useId();
  const listId = `${baseId}-dish-datalist`;

  const add = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t) return;
      if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
        setDraft("");
        return;
      }
      onChange([...tags, t].sort((a, b) => a.localeCompare(b)));
      setDraft("");
    },
    [tags, onChange]
  );

  const remove = useCallback(
    (t: string) => {
      onChange(tags.filter((x) => x !== t));
    },
    [tags, onChange]
  );

  return (
    <div className="min-w-0 sm:col-span-2">
      <span className="text-xs text-muted">Dish types</span>
      <p className="mt-0.5 text-[11px] text-muted">
        Multiple tags allowed (e.g. Ramen + Gyoza). Only these tags are used for
        map filters — nothing is inferred from your order text.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-surface-elevated/90 py-1 pl-3 pr-1 text-sm text-foreground shadow-sm ring-1 ring-white/5"
          >
            <span className="max-w-[200px] truncate">{t}</span>
            <button
              type="button"
              onClick={() => remove(t)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          className={`${inputClassName} mt-0 sm:min-w-0 sm:flex-1`}
          list={listId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Add a dish type…"
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => add(draft)}
          className="shrink-0 rounded-lg border border-sky-400/35 bg-sky-600/50 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600/70 sm:py-1.5"
        >
          Add
        </button>
      </div>
    </div>
  );
}
