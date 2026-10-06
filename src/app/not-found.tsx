import { NotFoundCard } from "@/components/shared/not-found-card";

// Unknown URLs outside the route groups: the same card, no header.
export default function NotFound() {
  return <NotFoundCard />;
}
