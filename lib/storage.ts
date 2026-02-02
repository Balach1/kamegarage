import { emitTrophyCheck } from "@/lib/trophyEvents";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ModStatus = "planned" | "installed" | "removed";

export type ModEntry = {
  id: string;
  title: string;
  cost: number | null;
  dateISO: string;
  notes?: string;
  beforeUri?: string | null;
  afterUri?: string | null;
  status: ModStatus;
};

const MODS_KEY = "garage.mods.v1";

export async function getMods(): Promise<ModEntry[]> {
  const raw = await AsyncStorage.getItem(MODS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as any[];

    // ✅ Normalize + migrate older mods (default status -> installed)
    const normalized: ModEntry[] = parsed.map((m) => ({
      id: String(m.id),
      title: String(m.title ?? ""),
      cost: typeof m.cost === "number" && Number.isFinite(m.cost) ? m.cost : null,
      dateISO: String(m.dateISO ?? new Date().toISOString()),
      notes: typeof m.notes === "string" ? m.notes : "",
      beforeUri: typeof m.beforeUri === "string" ? m.beforeUri : null,
      afterUri: typeof m.afterUri === "string" ? m.afterUri : null,
      status:
        m.status === "planned" || m.status === "installed" || m.status === "removed"
          ? m.status
          : "installed",
    }));

    return normalized;
  } catch {
    return [];
  }
}

export async function saveMods(mods: ModEntry[]): Promise<void> {
  await AsyncStorage.setItem(MODS_KEY, JSON.stringify(mods));
  emitTrophyCheck(); // ✅
}

export async function addMod(entry: Omit<ModEntry, "status"> & Partial<Pick<ModEntry, "status">>): Promise<void> {
  const current = await getMods();

  const nextEntry: ModEntry = {
    ...entry,
    status: entry.status ?? "installed",
    notes: entry.notes ?? "",
    beforeUri: entry.beforeUri ?? null,
    afterUri: entry.afterUri ?? null,
  };

  const next = [nextEntry, ...current];
  await saveMods(next); // ✅ emits
}

export async function updateMod(updated: ModEntry): Promise<void> {
  const mods = await getMods();
  const next = mods.map((m) => (m.id === updated.id ? updated : m));
  await saveMods(next); // ✅ emits
}

export async function deleteMod(id: string): Promise<void> {
  const mods = await getMods();
  const next = mods.filter((m) => m.id !== id);
  await saveMods(next); // ✅ emits
}

export async function clearMods(): Promise<void> {
  await AsyncStorage.removeItem(MODS_KEY);
  emitTrophyCheck(); // ✅
}

emitTrophyCheck();
