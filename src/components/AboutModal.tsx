"use client";

import { useEffect, useId } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AboutModal({ open, onClose }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close about dialog"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] max-h-[min(85vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-surface-elevated p-5 text-sm leading-relaxed text-foreground shadow-2xl ring-1 ring-black/30 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            About QasimEats
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium text-muted hover:bg-white/10 hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-foreground/95">
          <p>
            QasimEats is my Food Tracker that I have created for the masses, as
            we all know my opinion on food is the correct one always and has
            never been wrong on such a non-subjective topic as food ratings.
          </p>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">Ratings</h3>
            <p>
              I hate how ratings are done on most websites since they are super
              inflated. Why is a Google rating lower than 4 a cause for concern?
              Make it make sense.
            </p>
          </div>

          <p>
            So for my personal vendetta, the ratings on this website are a bit
            stricter. A rating of 2.5 is Average, and I mean AVERAGE.
            That&apos;s a place that I&apos;m not ringing the town bells for, but
            also I didn&apos;t feel like I got robbed.
          </p>

          <p>
            If you have any questions or want to send a strongly worded email
            about how wrong I am for slandering your favourite place, feel free
            to contact me at{" "}
            <a
              href="mailto:Qasimali9001@hotmail.co.uk"
              className="font-medium text-sky-300 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-200"
            >
              Qasimali9001@hotmail.co.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
