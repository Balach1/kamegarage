import { getCar } from "@/lib/carStorage";
import { getMods } from "@/lib/storage";
import { getUnlockedTrophies, saveUnlockedTrophies } from "@/lib/trophyStorage";

export type TrophyDef = {
  id: string;
  title: string;
  icon: string;
  earned: boolean;
};

export async function computeTrophies(): Promise<TrophyDef[]> {
  const [mods, car] = await Promise.all([getMods(), getCar()]);

  const modsCount = mods.length;
  const installed = mods.filter((m) => m.status === "installed");
  const planned = mods.filter((m) => m.status === "planned");

  const installedCount = installed.length;
  const plannedCount = planned.length;

  const hasBeforeAfter = mods.some((m) => !!m.beforeUri && !!m.afterUri);

  let spentInstalled = 0;
  for (const m of installed) {
    if (typeof m.cost === "number" && Number.isFinite(m.cost)) spentInstalled += m.cost;
  }

  const hasMileage = car.currentMileage != null;
  const hasMot = !!car.motExpiryISO;

  const s = car.specs;
  const specComplete =
    s?.bhp != null &&
    s?.mpg != null &&
    s?.zeroToSixty != null &&
    !!s?.drivetrain &&
    !!s?.transmission &&
    !!s?.colour;

  return [
    { id: "first_mod", icon: "🏁", title: "First Mod", earned: modsCount >= 1 },
    { id: "first_installed", icon: "🛠️", title: "Installed Something", earned: installedCount >= 1 },
    { id: "planner", icon: "🧠", title: "Planner", earned: plannedCount >= 1 },
    { id: "before_after", icon: "📸", title: "Before & After", earned: hasBeforeAfter },
    { id: "five_installed", icon: "🔥", title: "Build Momentum", earned: installedCount >= 5 },
    { id: "thousand_spent", icon: "💸", title: "Investor", earned: spentInstalled >= 1000 },
    { id: "mileage_set", icon: "🛣️", title: "Miles Matter", earned: hasMileage },
    { id: "mot_set", icon: "🧾", title: "Road Legal", earned: hasMot },
    { id: "spec_master", icon: "📋", title: "Spec Master", earned: specComplete },
  ];
}

/**
 * Returns the newest unlocked trophy (if any), and persists unlock state.
 */
export async function checkForNewTrophy(): Promise<TrophyDef | null> {
  const [trophies, unlocked] = await Promise.all([computeTrophies(), getUnlockedTrophies()]);

  const earnedIds = trophies.filter((t) => t.earned).map((t) => t.id);
  const newIds = earnedIds.filter((id) => !unlocked.includes(id));

  if (newIds.length === 0) return null;

  // show the first new trophy (simple + consistent)
  const newest = trophies.find((t) => t.id === newIds[0]) ?? null;

  await saveUnlockedTrophies([...unlocked, ...newIds]);

  return newest;
}
