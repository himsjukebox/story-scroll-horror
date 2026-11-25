import type { Metadata } from "next";
import { SpikeClient } from "@/vision/spike/SpikeClient";

// Throwaway page for tasks.md Task 1. Not linked from anywhere, hidden from
// search engines, and removed or hidden before submission (Task 16).
export const metadata: Metadata = {
  title: "Spike (internal)",
  robots: { index: false, follow: false },
};

export default function SpikePage() {
  return <SpikeClient />;
}
