"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type FieldErrors = Record<string, string[] | undefined> | null | undefined;

const SCROLL_OFFSET = 120; // clears the sticky header

/**
 * Every form uses this: when validation fails (in the browser or on the server) it shows a toast,
 * scrolls to the first field marked `aria-invalid` and puts the focus there. Pass the errors object;
 * it runs again whenever a new one arrives.
 */
export function useFocusFirstError(errors: FieldErrors) {
  useEffect(() => {
    if (!errors || Object.values(errors).every((m) => !m?.length)) return;
    toast.error("Check the highlighted fields");
    const first = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
    if (!first) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = first.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
    first.focus({ preventScroll: true });
  }, [errors]);
}
