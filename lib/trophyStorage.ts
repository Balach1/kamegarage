import AsyncStorage from "@react-native-async-storage/async-storage";

export const TROPHY_KEY = "garage.trophies.unlocked.v1";

export async function getUnlockedTrophies(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(TROPHY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function saveUnlockedTrophies(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(TROPHY_KEY, JSON.stringify(ids));
}

export async function clearUnlockedTrophies(): Promise<void> {
  await AsyncStorage.removeItem(TROPHY_KEY);
}
