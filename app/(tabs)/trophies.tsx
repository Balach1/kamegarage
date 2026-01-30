import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { getCar } from "@/lib/carStorage";
import { getMods } from "@/lib/storage";

type Trophy = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progressText?: string;
};

export default function TrophiesScreen() {
  const [modsCount, setModsCount] = useState(0);
  const [installedCount, setInstalledCount] = useState(0);
  const [plannedCount, setPlannedCount] = useState(0);
  const [hasBeforeAfter, setHasBeforeAfter] = useState(false);
  const [spentInstalled, setSpentInstalled] = useState(0);
  const [hasMileage, setHasMileage] = useState(false);
  const [hasMot, setHasMot] = useState(false);
  const [specComplete, setSpecComplete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const [mods, car] = await Promise.all([getMods(), getCar()]);
        if (!alive) return;

        setModsCount(mods.length);

        const installed = mods.filter((m) => m.status === "installed");
        const planned = mods.filter((m) => m.status === "planned");
        setInstalledCount(installed.length);
        setPlannedCount(planned.length);

        setHasBeforeAfter(mods.some((m) => !!m.beforeUri && !!m.afterUri));

        let sum = 0;
        for (const m of installed) {
          if (typeof m.cost === "number" && Number.isFinite(m.cost)) sum += m.cost;
        }
        setSpentInstalled(sum);

        setHasMileage(car.currentMileage != null);
        setHasMot(!!car.motExpiryISO);

        const s = car.specs;
        const complete =
          s?.bhp != null &&
          s?.mpg != null &&
          s?.zeroToSixty != null &&
          !!s?.drivetrain &&
          !!s?.transmission &&
          !!s?.colour;

        setSpecComplete(complete);
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  const trophies: Trophy[] = useMemo(() => {
    return [
      {
        id: "first_mod",
        icon: "🏁",
        title: "First Mod",
        description: "Add your first mod.",
        earned: modsCount >= 1,
        progressText: `${Math.min(modsCount, 1)}/1`,
      },
      {
        id: "first_installed",
        icon: "🛠️",
        title: "Installed Something",
        description: "Install your first mod.",
        earned: installedCount >= 1,
        progressText: `${Math.min(installedCount, 1)}/1`,
      },
      {
        id: "planner",
        icon: "🧠",
        title: "Planner",
        description: "Add your first planned mod.",
        earned: plannedCount >= 1,
        progressText: `${Math.min(plannedCount, 1)}/1`,
      },
      {
        id: "before_after",
        icon: "📸",
        title: "Before & After",
        description: "Log a mod with both before and after photos.",
        earned: hasBeforeAfter,
        progressText: hasBeforeAfter ? "1/1" : "0/1",
      },
      {
        id: "five_installed",
        icon: "🔥",
        title: "Build Momentum",
        description: "Install 5 mods.",
        earned: installedCount >= 5,
        progressText: `${Math.min(installedCount, 5)}/5`,
      },
      {
        id: "thousand_spent",
        icon: "💸",
        title: "Investor",
        description: "Spend £1,000 on installed mods.",
        earned: spentInstalled >= 1000,
        progressText: `£${Math.min(spentInstalled, 1000).toLocaleString()}/£1,000`,
      },
      {
        id: "mileage_set",
        icon: "🛣️",
        title: "Miles Matter",
        description: "Set your current mileage.",
        earned: hasMileage,
        progressText: hasMileage ? "1/1" : "0/1",
      },
      {
        id: "mot_set",
        icon: "🧾",
        title: "Road Legal",
        description: "Set your MOT expiry date.",
        earned: hasMot,
        progressText: hasMot ? "1/1" : "0/1",
      },
      {
        id: "spec_master",
        icon: "📋",
        title: "Spec Master",
        description: "Complete your spec sheet (incl. colour).",
        earned: specComplete,
        progressText: specComplete ? "1/1" : "0/1",
      },
    ];
  }, [
    modsCount,
    installedCount,
    plannedCount,
    hasBeforeAfter,
    spentInstalled,
    hasMileage,
    hasMot,
    specComplete,
  ]);

  const earnedCount = trophies.filter((t) => t.earned).length;

  return (
    <Screen>
      <Text style={styles.title}>Trophies</Text>
      <Text style={styles.subTitle}>
        {earnedCount}/{trophies.length} unlocked
      </Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {trophies.map((t) => (
          <View
            key={t.id}
            style={[styles.trophyCard, !t.earned && styles.trophyLocked]}
          >
            <Text style={styles.icon}>{t.icon}</Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.trophyTitle}>
                {t.title} {!t.earned ? "🔒" : "✅"}
              </Text>
              <Text style={styles.trophyDesc}>{t.description}</Text>
              {t.progressText ? (
                <Text style={styles.progress}>{t.progressText}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subTitle: { color: "#aaa", fontWeight: "700", marginBottom: 14 },

  trophyCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
    alignItems: "center",
  },
  trophyLocked: { opacity: 0.6 },
  icon: { fontSize: 24 },
  trophyTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  trophyDesc: { color: "#bbb", marginTop: 4, lineHeight: 18 },
  progress: { color: "#888", fontWeight: "800", marginTop: 8 },
});
