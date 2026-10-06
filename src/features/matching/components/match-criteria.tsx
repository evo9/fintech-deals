import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MATCH_LABELS, type MatchResult } from "../score";

/** Criteria the buyer specified, each with a check or a cross. */
export function MatchCriteria({ match, className }: { match: MatchResult; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {match.criteria.map((c) => (
        <li key={c.key} className="flex items-center gap-2">
          {c.ok ? (
            <CheckIcon role="img" aria-label="Matches" className="size-4 shrink-0 text-success" />
          ) : (
            <XIcon role="img" aria-label="Does not match" className="size-4 shrink-0 text-danger-text" />
          )}
          {MATCH_LABELS[c.key]}
        </li>
      ))}
    </ul>
  );
}
