import Link from "next/link";
import { EyeIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContactBuyer } from "@/features/messaging/components/contact-actions";
import type { PairConversation } from "@/features/messaging/queries";

/** Buttons of a catalog card: View profile and Contact buyer / Open conversation. */
export function BuyerCardActions({
  buyer,
  viewerSuspended,
  contact,
}: {
  buyer: { id: string; name: string };
  viewerSuspended: boolean;
  /** Own published assets to pick from and the conversations that already exist with this buyer. */
  contact?: { assets: { id: number; headline: string }[]; existing: PairConversation[] };
}) {
  return (
    <>
      <Link
        href={`/buyers/${buyer.id}`}
        aria-label={`View profile of ${buyer.name}`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 flex-1 border-primary px-5 text-primary sm:flex-none",
        )}
      >
        <EyeIcon aria-hidden />
        View profile
      </Link>
      <ContactBuyer
        buyer={{ id: buyer.id, name: buyer.name }}
        assets={contact?.assets ?? []}
        existing={contact?.existing ?? []}
        suspended={viewerSuspended}
        className="flex flex-1 sm:flex-none"
        buttonClassName="flex-1 sm:flex-none"
      />
    </>
  );
}
