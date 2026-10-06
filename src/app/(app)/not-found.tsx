import { NotFoundCard } from "@/components/shared/not-found-card";

// Inside the app layout, so the header stays. Wrong role, hidden asset and unknown id all end up here.
export default function AppNotFound() {
  return <NotFoundCard />;
}
