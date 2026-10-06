import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string };

// Menu per role (spec 7.2). `/assets` is the buyer catalog: sellers have no Assets item.
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  BUYER: [
    { href: "/assets", label: "Assets" },
    { href: "/profile", label: "My profile" },
    { href: "/messages", label: "Messages" },
  ],
  SELLER: [
    { href: "/buyers", label: "Buyers" },
    { href: "/my-assets", label: "My assets" },
    { href: "/messages", label: "Messages" },
  ],
  MANAGER: [
    { href: "/admin/users", label: "Participants" },
    { href: "/admin/assets", label: "Assets" },
  ],
};
