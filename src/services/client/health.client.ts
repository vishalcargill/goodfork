import type { HealthSnapshot } from "@/services/server/health.server";

export async function fetchHealthSnapshot(): Promise<HealthSnapshot> {
  const response = await fetch("/api/health", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Unable to load system status.");
  }

  return response.json();
}
