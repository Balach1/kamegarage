import AsyncStorage from "@react-native-async-storage/async-storage";


export type ServiceEntry = {
  id: string;
  type: string;         // e.g. "Oil change"
  dateISO: string;      // ISO string
  mileage: number | null;
  notes: string;
};

const SERVICE_KEY = "garage.services.v1";

export async function getServices(): Promise<ServiceEntry[]> {
  const raw = await AsyncStorage.getItem(SERVICE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ServiceEntry[];
  } catch {
    return [];
  }
}

export async function addService(entry: ServiceEntry): Promise<void> {
  const current = await getServices();
  const next = [entry, ...current];
  await AsyncStorage.setItem(SERVICE_KEY, JSON.stringify(next));
}

export async function deleteService(id: string): Promise<void> {
  const current = await getServices();
  const next = current.filter((s) => s.id !== id);
  await AsyncStorage.setItem(SERVICE_KEY, JSON.stringify(next));
}

export async function clearServices(): Promise<void> {
  await AsyncStorage.removeItem(SERVICE_KEY);
}
