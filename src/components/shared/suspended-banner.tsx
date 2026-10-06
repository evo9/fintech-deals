import { TriangleAlertIcon } from "lucide-react";

export function SuspendedBanner({ reason }: { reason: string | null }) {
  const trimmed = reason?.trim();
  const because = trimmed ? `: ${/[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`}` : ".";
  return (
    <div role="status" className="mt-3 border-y border-warning/30 bg-warning/10 text-warning-text">
      <p className="mx-auto flex max-w-[1280px] items-start gap-2 px-4 py-3 text-sm font-medium">
        <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0 break-words">
          Your account is suspended{because} You can browse, but publishing and messaging are disabled.
        </span>
      </p>
    </div>
  );
}
