// Sizes follow the width of the card itself (container queries), so the same card works in the catalog
// and in the narrower form preview. Row sizes shared by the card and its skeleton: every row has a fixed height, so the skeleton is
// exactly as tall as the real card at every breakpoint.
export const CARD = "flex gap-5 rounded-xl border bg-surface p-4 @xl:p-5";
export const CARD_BODY = "flex min-w-0 flex-1 flex-col gap-2";
export const CARD_FLAG_COLUMN = "hidden w-[120px] shrink-0 @xl:block";
export const CARD_HEADER = "flex h-6 items-center justify-between gap-3";
export const CARD_HEADLINE = "h-7";
export const CARD_TILES = "grid grid-cols-2 gap-2 @4xl:grid-cols-5";
export const CARD_CHIPS = "flex h-7 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
export const CARD_INCLUDED = "min-h-7";
export const CARD_DESCRIPTION = "h-10";
export const CARD_FOOTER = "flex flex-col gap-3 @xl:h-10 @xl:flex-row @xl:items-center @xl:justify-between";
export const CARD_BUTTONS = "flex gap-2";
