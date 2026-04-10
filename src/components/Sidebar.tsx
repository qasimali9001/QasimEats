"use client";

import { formatPricePounds } from "@/lib/foodMeta";
import type { Review } from "@/lib/types";

type Props = {
  review: Review | null;
  open?: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-muted">—</span>;
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
          isFull || isHalf ? "text-sky-200" : "text-white/25"
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
      <span className="ml-2 text-sm text-muted">{rating}</span>
    </span>
  );
}

export function Sidebar({ review, open, onClose, children }: Props) {
  const isOpen = open ?? Boolean(review);

  return (
    <aside
      className={[
        "absolute right-0 top-0 z-20 h-full w-[420px] max-w-[90vw]",
        "border-l border-white/10 bg-surface/98 backdrop-blur-md",
        "transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs font-medium tracking-wide text-muted">
              QasimEats
            </div>
            <h2 className="truncate text-lg font-semibold text-foreground">
              {review?.name ?? "Resolve locations"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {review ? (
                <>
                  <span className="font-medium text-foreground/90">
                    {review.cuisineGroup}
                  </span>
                  <span className="text-white/25">·</span>
                  <span className="text-foreground/80">{review.cuisine}</span>
                  <span className="text-white/25">·</span>
                  <span className="tabular-nums text-foreground/90">
                    {formatPricePounds(review.pricePounds)}
                  </span>
                  <span className="text-white/25">·</span>
                  <Stars rating={review.rating ?? null} />
                </>
              ) : (
                <span>
                  Auto-geocode by name (Manchester, UK) or click the map to set a pin.
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground shadow-sm hover:bg-white/10"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5">
          {review ? (
            <div className="space-y-5">
              {review.dishTypes.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Dish type
                  </div>
                  <div className="mt-1 text-sm text-foreground/90">
                    {review.dishTypes.join(" · ")}
                  </div>
                </div>
              ) : null}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  What I ordered
                </div>
                <div className="mt-1 text-sm leading-6 text-foreground/95">
                  {review.whatIOrdered || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Review
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
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

