import AsyncStorage from "@react-native-async-storage/async-storage";

export type ModEntry = {
  id: string;
  title: string;
  cost: number | null;
  dateISO: string;
  notes: string;
  beforeUri: string | null;
  afterUri: string | null;
};

const MODS_KEY = "garage.mods.v1";

export async function getMods(): Promise<ModEntry[]> {
  const raw = await AsyncStorage.getItem(MODS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ModEntry[];
  } catch {
    return [];
  }
}

export async function addMod(mod: ModEntry): Promise<void> {
  const existing = await getMods();
  const next = [mod, ...existing]; // newest first
  await AsyncStorage.setItem(MODS_KEY, JSON.stringify(next));
}

export async function clearMods(): Promise<void> {
  await AsyncStorage.removeItem(MODS_KEY);
}

export async function deleteMod(id: string): Promise<void> {
  const mods = await getMods();
  const next = mods.filter((m) => m.id !== id);
  await AsyncStorage.setItem(MODS_KEY, JSON.stringify(next));
}

export async function updateMod(updated: ModEntry): Promise<void> {
  const mods = await getMods();
  const next = mods.map((m) => (m.id === updated.id ? updated : m));
  await AsyncStorage.setItem(MODS_KEY, JSON.stringify(next));
}

export async function saveMods(mods: ModEntry[]): Promise<void> {
  await AsyncStorage.setItem(MODS_KEY, JSON.stringify(mods));
}


