---
paths:
  - "src/components/**"
  - "src/features/**/components/**"
  - "src/app/**/*.tsx"
  - "src/app/globals.css"
---

# UI rules (spec sections 7-8)

- Colors only through theme tokens from `globals.css` (background, surface, border, text, text-muted, primary, primary-soft, success, warning, danger, role-*, ink). No raw hex in components.
- Radius hierarchy: cards 20px, field tiles 12px, buttons/tabs/inputs/badges fully rounded (pill).
- Active state: header navigation item = black pill (`bg-ink text-white`, as on n5deal.com). Tabs and segmented controls = white pill (`bg-surface`, `border-border`, `text-foreground`) on the muted track - never black. Hover must not change the text color of an active item.
- Cards are separated by a border, not a shadow. Shadow only on the floating header and popovers/dialogs.
- Font Inter via `next/font`. Prices, counters, numbers use `tabular-nums`; counters inside tabs have a fixed `min-w`.
- Sentence case everywhere. No uppercase labels, no eyebrow labels above sections.
- Never render a raw enum value: use labels from `lib/reference.ts`. Prices and dates only via `lib/format.ts`.
- No layout shift: `loading.tsx` skeletons have the exact size of the final cards; on filter/tab/sort/page change keep the old list at `opacity-60` with a thin progress bar (`useTransition` + `router.replace`), no skeletons.
- Flags and images have fixed width/height. Validation messages reserve space or appear without moving buttons.
- Motion only as a response to user action (dialog 150 ms fade+scale, filter panel, "+2" tags, new message). No entrance animations, no hover lift; card hover changes only border color. Respect `prefers-reduced-motion`.
- Every list has an empty state with an action. Every destructive action has a confirmation. Every action gives feedback (toast or visible change). Buttons are disabled while pending.
- Action name is the same across the chain: "Publish asset" -> toast "Asset published"; "Contact seller" -> "Message sent".
- User menu in the header has only Log out (no Switch account).
- Forms: `useActionState` + zod, no react-hook-form.
- Accessibility: visible focus ring, `<label>` for every field, `aria-label` on icon buttons, AA contrast.
- Visual reference: `.agent/screenshots/*.webp`.
