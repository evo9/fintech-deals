"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isShown, isStrongMatch, type MatchResult } from "../score";
import { MatchCriteria } from "./match-criteria";

/** "Matches 4 of 5" or a green "Strong match"; hover or focus lists which criteria matched. */
export function MatchBadge({ match, title = "Your interests" }: { match: MatchResult | null; title?: string }) {
  if (!isShown(match)) return null;
  const strong = isStrongMatch(match);

  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}>
        <Badge variant={strong ? "success" : "secondary"} className="tabular-nums">
          {strong ? "Strong match" : `Matches ${match.matched} of ${match.considered}`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex-col items-start p-3 text-sm">
        <p className="font-medium">{title}</p>
        <MatchCriteria match={match} />
      </TooltipContent>
    </Tooltip>
  );
}
