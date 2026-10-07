import Link from "next/link";
import { EyeIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatAssetId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ContactSeller } from "@/features/messaging/components/contact-actions";

/** Buttons of a catalog card: View asset and Contact seller / Open conversation. */
export function AssetCardActions({
  asset,
  viewerSuspended,
  conversationId = null,
}: {
  asset: { id: number; headline: string };
  viewerSuspended: boolean;
  /** The buyer's existing conversation about this asset: the button becomes "Open conversation". */
  conversationId?: string | null;
}) {
  const id = formatAssetId(asset.id);

  return (
    <>
      <Link
        href={`/assets/${asset.id}`}
        aria-label={`View asset ${id}`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 flex-1 border-primary px-5 text-primary @xl:flex-none",
        )}
      >
        <EyeIcon aria-hidden />
        View asset
      </Link>
      <ContactSeller
        asset={{ id: asset.id, headline: asset.headline }}
        suspended={viewerSuspended}
        conversationId={conversationId}
        className="flex flex-1 @xl:flex-none"
        buttonClassName="flex-1 @xl:flex-none"
      />
    </>
  );
}
