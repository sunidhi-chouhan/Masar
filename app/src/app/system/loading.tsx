import { PageLoader } from "@/components/loaders";

export default function Loading() {
  return <PageLoader variant="cycle" label="Running the evidence report across 10,000 residents…" />;
}
