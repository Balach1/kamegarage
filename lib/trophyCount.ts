import { computeTrophies } from "@/lib/trophyEngine";

export async function getEarnedTrophyCount(): Promise<number> {
  const trophies = await computeTrophies();
  return trophies.filter((t) => t.earned).length;
}
