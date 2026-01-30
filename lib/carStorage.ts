import { emitTrophyCheck } from "@/lib/trophyEvents";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type MileageUnit = "mi" | "km";

export type CarSpecs = {
  bhp: number | null;
  mpg: number | null;
  zeroToSixty: number | null;
  drivetrain: string | null;
  transmission: string | null;
  colour: string | null;
};

export type CarProfile = {
  garageTitle: string;
  name: string;
  heroImageUri: string | null;
  currentMileage: number | null;
  motExpiryISO: string | null;
  specs: CarSpecs;

  // ✅ NEW
  mileageUnit: MileageUnit;
};

const KEY = "garage.car.v1";

export const DEFAULT_CAR: CarProfile = {
  garageTitle: "Your Garage",
  name: "My Car",
  heroImageUri: null,
  currentMileage: null,
  motExpiryISO: null,
  specs: {
    bhp: null,
    mpg: null,
    zeroToSixty: null,
    drivetrain: null,
    transmission: null,
    colour: null,
  },
  mileageUnit: "mi", // ✅ default UK-friendly
};

export async function getCar(): Promise<CarProfile> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT_CAR;

  try {
    const parsed = JSON.parse(raw);

    // ✅ Merge defaults so older saves get new fields automatically
    return {
      
      ...DEFAULT_CAR,
      ...parsed,
      specs: {
        ...DEFAULT_CAR.specs,
        ...(parsed?.specs ?? {}),
      },
      garageTitle: typeof parsed?.garageTitle === "string" ? parsed.garageTitle : "Your Garage",
      mileageUnit:
        parsed?.mileageUnit === "km" || parsed?.mileageUnit === "mi"
          ? parsed.mileageUnit
          : "mi",
    };
  } catch {
    return DEFAULT_CAR;
  }
}

export async function saveCar(car: CarProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(car));
  emitTrophyCheck();
}

