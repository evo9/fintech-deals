"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFocusFirstError } from "@/components/shared/use-focus-first-error";
import { formatAssetId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { startConversation } from "../actions";
import type { PairConversation } from "../queries";
import { MESSAGE_MAX, formDataToStartConversation, startConversationSchema } from "../schema";

type AssetOption = { id: number; headline: string };

type Target =
  | { kind: "asset"; asset: AssetOption }
  | { kind: "buyer"; buyer: { id: string; name: string }; assets: AssetOption[]; existing: PairConversation[] };

type Props = Target & {
  label: string;
  variant?: "default" | "outline";
  className?: string;
};

const GENERAL = "general";

function assetTemplate(id: number) {
  return `Hello, I'm interested in Asset ID ${formatAssetId(id)}. Could you share more details about `;
}

function buyerTemplate(asset: AssetOption | undefined) {
  return asset
    ? `Hello, I think Asset ID ${formatAssetId(asset.id)} could fit what you are looking for. `
    : "Hello, I'd like to discuss a possible deal with you. ";
}

/** "Contact seller" / "Contact buyer": a dialog with the context and a message template. */
export function ContactDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const title = props.kind === "asset" ? "Contact seller" : "Contact buyer";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant={props.variant ?? "default"} className={cn("h-10 px-5", props.className)} />
        }
      >
        {props.label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {props.kind === "asset" ? (
              <>
                About Asset ID {formatAssetId(props.asset.id)}: {props.asset.headline}
              </>
            ) : (
              <>To {props.buyer.name}</>
            )}
          </DialogDescription>
        </DialogHeader>
        <ContactForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ContactForm(props: Props) {
  const router = useRouter();
  // A transition, not useActionState: on success the page is refreshed and this dialog is replaced by an
  // "Open conversation" link, so the toast and the redirect must not depend on this component staying mounted.
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined> | null>(null);

  const [assetKey, setAssetKey] = useState(GENERAL);
  const assetOptions = props.kind === "buyer" ? props.assets : [];
  const chosen = assetOptions.find((a) => String(a.id) === assetKey);
  const template = props.kind === "asset" ? assetTemplate(props.asset.id) : buyerTemplate(chosen);

  const [body, setBody] = useState(template);
  const [edited, setEdited] = useState(false);
  // until the seller edits the text, the template follows the chosen asset
  const [seenTemplate, setSeenTemplate] = useState(template);
  if (template !== seenTemplate) {
    setSeenTemplate(template);
    if (!edited) setBody(template);
  }

  useFocusFirstError(errors);

  const existing =
    props.kind === "buyer"
      ? props.existing.find((c) => (c.assetId === null ? assetKey === GENERAL : String(c.assetId) === assetKey))
      : undefined;
  const bodyError = errors?.body?.[0];

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = startConversationSchema.safeParse(formDataToStartConversation(formData));
        if (!result.success) {
          setErrors(z.flattenError(result.error).fieldErrors);
          return;
        }
        setErrors(null);
        startTransition(async () => {
          const res = await startConversation(null, formData);
          if (res.ok) {
            toast.success("Message sent");
            router.push(`/messages/${res.data.conversationId}`);
          } else if (res.fieldErrors) {
            setErrors(res.fieldErrors);
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      <input type="hidden" name="kind" value={props.kind} />
      {props.kind === "asset" ? (
        <input type="hidden" name="assetId" value={props.asset.id} />
      ) : (
        <>
          <input type="hidden" name="buyerId" value={props.buyer.id} />
          <input type="hidden" name="assetId" value={assetKey === GENERAL ? "" : assetKey} />
          {assetOptions.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-asset">About (optional)</Label>
              <Select
                value={assetKey}
                items={[
                  { value: GENERAL, label: "General, no asset" },
                  ...assetOptions.map((a) => ({ value: String(a.id), label: `${formatAssetId(a.id)} ${a.headline}` })),
                ]}
                onValueChange={(v) => setAssetKey(String(v))}
              >
                <SelectTrigger id="contact-asset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="max-h-64">
                  <SelectItem value={GENERAL}>General, no asset</SelectItem>
                  {assetOptions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {formatAssetId(a.id)} {a.headline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="min-h-5 text-sm text-text-muted">
            {existing && (
              <>
                You already have a conversation about this.{" "}
                <Link href={`/messages/${existing.id}`} className="font-medium text-primary hover:underline">
                  Open conversation
                </Link>
              </>
            )}
          </p>
        </>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="contact-body">Message</Label>
          <span className="text-xs text-text-muted tabular-nums">
            {body.length}/{MESSAGE_MAX}
          </span>
        </div>
        <Textarea
          id="contact-body"
          name="body"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setEdited(true);
          }}
          rows={6}
          autoFocus
          aria-invalid={bodyError ? true : undefined}
          aria-describedby="contact-body-error"
        />
        <p id="contact-body-error" aria-live="polite" className="min-h-5 text-sm text-danger-text">
          {bodyError}
        </p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send message"}
        </Button>
      </DialogFooter>
    </form>
  );
}
