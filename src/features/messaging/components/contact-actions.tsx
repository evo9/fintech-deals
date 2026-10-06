import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PairConversation } from "../queries";
import { ContactDialog } from "./contact-dialog";

type AssetOption = { id: number; headline: string };

/** Buyer side: "Contact seller", or "Open conversation" when one exists for this asset. */
export function ContactSeller({
  asset,
  suspended,
  conversationId,
  className,
  buttonClassName,
  size,
}: {
  asset: AssetOption;
  suspended: boolean;
  conversationId: string | null;
  className?: string;
  buttonClassName?: string;
  size?: "lg";
}) {
  const sizing = size === "lg" ? "h-11" : "h-10";
  if (suspended) {
    return (
      <span title="Your account is suspended" className={className}>
        <Button type="button" disabled className={cn(sizing, "px-5", buttonClassName)}>
          Contact seller
        </Button>
      </span>
    );
  }
  if (conversationId) {
    return (
      <span className={className}>
        <Link href={`/messages/${conversationId}`} className={cn(buttonVariants(), sizing, "px-5", buttonClassName)}>
          Open conversation
        </Link>
      </span>
    );
  }
  return (
    <span className={className}>
      <ContactDialog kind="asset" asset={asset} label="Contact seller" className={cn(sizing, buttonClassName)} />
    </span>
  );
}

/** Seller side: "Contact buyer", or "Open conversation" (the latest one) when they already talk. */
export function ContactBuyer({
  buyer,
  assets,
  existing,
  suspended,
  className,
  buttonClassName,
  size,
}: {
  buyer: { id: string; name: string };
  assets: AssetOption[];
  existing: PairConversation[];
  suspended: boolean;
  className?: string;
  buttonClassName?: string;
  size?: "lg";
}) {
  const sizing = size === "lg" ? "h-11" : "h-10";
  if (suspended) {
    return (
      <span title="Your account is suspended" className={className}>
        <Button type="button" disabled className={cn(sizing, "px-5", buttonClassName)}>
          Contact buyer
        </Button>
      </span>
    );
  }
  if (existing.length > 0) {
    return (
      <span className={className}>
        <Link href={`/messages/${existing[0].id}`} className={cn(buttonVariants(), sizing, "px-5", buttonClassName)}>
          Open conversation
        </Link>
      </span>
    );
  }
  return (
    <span className={className}>
      <ContactDialog
        kind="buyer"
        buyer={buyer}
        assets={assets}
        existing={existing}
        label="Contact buyer"
        className={cn(sizing, buttonClassName)}
      />
    </span>
  );
}
