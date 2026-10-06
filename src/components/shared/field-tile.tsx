import { cn } from "@/lib/utils";

/**
 * Label above, value below, in a bordered tile. Fixed height; a long value is cut with an
 * ellipsis and shown in full on hover (native title).
 */
export function FieldTile({
  label,
  value,
  highlight = false,
  valueClassName,
  className,
}: {
  label: string;
  value: string;
  /** Blue frame and blue value: the asking price. */
  highlight?: boolean;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-[60px] min-w-0 rounded-lg border px-3 py-1.5",
        highlight ? "border-primary/50 bg-primary-soft" : "bg-surface",
        className,
      )}
    >
      <p className={cn("truncate text-[13px] leading-5 text-text-muted", highlight && "text-foreground/70")}>{label}</p>
      <p
        title={value}
        className={cn(
          "truncate text-base leading-6 font-semibold tabular-nums",
          highlight && "text-primary",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}
