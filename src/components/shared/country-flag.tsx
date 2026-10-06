import type { FlagComponent } from "country-flag-icons/react/3x2";
import { AE, CA, CY, CZ, EE, GB, GE, IE, LT, MT, PL } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

const FLAGS: Record<string, FlagComponent> = {
  AE, CA, CY, CZ, EE, GB, GE, IE, LT, MT, PL,
};

/** SVG flag (3:2) with a fixed size, so lists do not shift while it loads. Size via className, e.g. `w-6`. */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const Flag = FLAGS[code];
  const box = cn("aspect-[3/2] shrink-0 rounded-[3px] border border-border", className);
  if (!Flag) return <span aria-hidden className={cn(box, "bg-muted")} />;
  return <Flag aria-hidden focusable={false} className={cn(box, "object-cover")} />;
}
