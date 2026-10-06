"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CARD_INCLUDED } from "./asset-card-layout";

const VISIBLE = 3;

/** First three tags and "+N"; a click on it shows all of them (the only part of the card that grows). */
export function IncludedTags({ tags }: { tags: string[] }) {
  const [open, setOpen] = useState(false);
  if (tags.length === 0) return <div aria-hidden className={CARD_INCLUDED} />;

  const shown = open ? tags : tags.slice(0, VISIBLE);
  const hidden = tags.length - VISIBLE;

  return (
    <div className={cn("flex items-start gap-2 text-sm", CARD_INCLUDED)}>
      <span className="flex h-7 shrink-0 items-center text-text-muted">Included</span>
      <ul className={cn("flex min-w-0 gap-2", open ? "flex-wrap" : "overflow-hidden")}>
        {shown.map((tag) => (
          <li
            key={tag}
            title={tag}
            className="h-7 max-w-[11rem] truncate rounded-full bg-muted/60 px-3 leading-7"
          >
            {tag}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="h-7 shrink-0 rounded-full px-2 font-semibold text-primary outline-none hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {open ? "Show less" : `+${hidden}`}
        </button>
      )}
    </div>
  );
}
