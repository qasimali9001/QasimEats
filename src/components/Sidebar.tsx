"use client";

import type { Review } from "@/lib/types";

type Props = {
  review: Review | null;
  open?: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-zinc-500">—</span>;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const out = [];
  for (let i = 0; i < 5; i++) {
    const isFull = i < full;
    const isHalf = i === full && half;
    out.push(
      <span
        key={i}
        className={
          isFull || isHalf ? "text-zinc-900" : "text-zinc-300 dark:text-zinc-700"
        }
        aria-hidden="true"
      >
        {isFull ? "★" : isHalf ? "☆" : "☆"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {out}
      <span className="ml-2 text-sm text-zinc-500">{rating}</span>
    </span>
  );
}

export function Sidebar({ review, open, onClose, children }: Props) {
  const isOpen = open ?? Boolean(review);

  return (
    <aside
      className={[
        "absolute right-0 top-0 z-20 h-full w-[420px] max-w-[90vw]",
        "border-l border-black/10 bg-white/95 backdrop-blur",
        "transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs font-medium tracking-wide text-zinc-500">
              QasimEats
            </div>
            <h2 className="truncate text-lg font-semibold text-zinc-950">
              {review?.name ?? "Resolve locations"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
              {review ? (
                <>
                  <span className="font-medium text-zinc-800">{review.cuisine}</span>
                  <span className="text-zinc-400">·</span>
                  <span>{review.price}</span>
                  <span className="text-zinc-400">·</span>
                  <Stars rating={review.rating ?? null} />
                </>
              ) : (
                <span className="text-zinc-500">
                  Auto-geocode by name (Manchester, UK) or click the map to set a pin.
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5">
          {review ? (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  What I ordered
                </div>
                <div className="mt-1 text-sm leading-6 text-zinc-900">
                  {review.whatIOrdered || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Review
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                  {review.review || "—"}
                </p>
              </div>

              {children}
            </div>
          ) : (
            <div className="space-y-5">{children}</div>
          )}
        </div>
      </div>
    </aside>
  );
}

