import AsyncStorage from "@react-native-async-storage/async-storage";

export type CarProfile = {
  name: string;
  heroImageUri: string | null; // will be base64 data URL on web
};

const CAR_KEY = "garage.car.v1";

export async function getCar(): Promise<CarProfile> {
  const raw = await AsyncStorage.getItem(CAR_KEY);
  if (!raw) return { name: "My Car", heroImageUri: null };
  try {
    return JSON.parse(raw) as CarProfile;
  } catch {
    return { name: "My Car", heroImageUri: null };
  }
}

export async function saveCar(next: CarProfile): Promise<void> {
  await AsyncStorage.setItem(CAR_KEY, JSON.stringify(next));
}
