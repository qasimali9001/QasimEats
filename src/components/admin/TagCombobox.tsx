"use client";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  hint?: string;
  className?: string;
};

export function TagCombobox({
  id,
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  hint,
  className,
}: Props) {
  const listId = `${id}-datalist`;
  return (
    <label className="block min-w-0">
      <span className="text-xs text-muted">{label}</span>
      <input
        id={id}
        className={
          className ??
          "mt-1 w-full min-w-0 max-w-full rounded-lg border border-white/15 bg-background/80 px-2 py-2 text-base sm:px-2 sm:py-1.5 sm:text-sm"
        }
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {hint ? (
        <span className="mt-1 block text-[11px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
