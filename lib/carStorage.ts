import AsyncStorage from "@react-native-async-storage/async-storage";

export type CarProfile = {
  name: string;
  heroImageUri: string | null; // base64 data URL on web
  currentMileage: number | null;
  motExpiryISO: string | null; // store as ISO date string
};

const CAR_KEY = "garage.car.v2";

const DEFAULT_CAR: CarProfile = {
  name: "My Car",
  heroImageUri: null,
  currentMileage: null,
  motExpiryISO: null,
};

export async function getCar(): Promise<CarProfile> {
  const raw = await AsyncStorage.getItem(CAR_KEY);

  // Migration: if they have v1 key, pull it in once
  if (!raw) {
    const v1raw = await AsyncStorage.getItem("garage.car.v1");
    if (v1raw) {
      try {
        const v1 = JSON.parse(v1raw) as { name: string; heroImageUri: string | null };
        const migrated: CarProfile = {
          ...DEFAULT_CAR,
          name: v1.name ?? DEFAULT_CAR.name,
          heroImageUri: v1.heroImageUri ?? null,
        };
        await AsyncStorage.setItem(CAR_KEY, JSON.stringify(migrated));
        return migrated;
      } catch {
        return DEFAULT_CAR;
      }
    }
    return DEFAULT_CAR;
  }

  try {
    const data = JSON.parse(raw) as Partial<CarProfile>;
    return {
      ...DEFAULT_CAR,
      ...data,
      name: data.name ?? DEFAULT_CAR.name,
      heroImageUri: data.heroImageUri ?? null,
      currentMileage:
        typeof data.currentMileage === "number" && Number.isFinite(data.currentMileage)
          ? data.currentMileage
          : null,
      motExpiryISO: typeof data.motExpiryISO === "string" ? data.motExpiryISO : null,
    };
  } catch {
    return DEFAULT_CAR;
  }
}

export async function saveCar(next: CarProfile): Promise<void> {
  await AsyncStorage.setItem(CAR_KEY, JSON.stringify(next));
}
