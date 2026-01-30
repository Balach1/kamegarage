import { Screen } from "@/components/screen";
import { getCar, saveCar } from "@/lib/carStorage";
import { clearServices } from "@/lib/serviceStorage";
import { clearMods } from "@/lib/storage";
import { clearUnlockedTrophies } from "@/lib/trophyStorage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [unit, setUnit] = useState<"mi" | "km">("mi");

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const car = await getCar();
        if (!alive) return;
        setUnit(car.mileageUnit ?? "mi");
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  async function setMileageUnit(next: "mi" | "km") {
    const car = await getCar();
    await saveCar({ ...car, mileageUnit: next });
    setUnit(next);
  }

  async function resetModsOnly() {
    const doReset = async () => {
      await clearMods();
      await clearUnlockedTrophies();
    };

    if (Platform.OS === "web") {
      if (window.confirm("Reset all mods?")) await doReset();
      return;
    }

    Alert.alert("Reset Mods", "This will delete all mods.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => void doReset() },
    ]);
  }

  async function resetEntireGarage() {
    const doReset = async () => {
      await clearMods();
      await clearServices();
      await clearUnlockedTrophies();

      await saveCar({
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
        mileageUnit: "mi",
      });

      setUnit("mi");
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Reset entire garage?\n\nThis will delete all mods, services and reset your car profile."
        )
      ) {
        await doReset();
      }
      return;
    }

    Alert.alert(
      "Reset Garage",
      "This will delete all mods, services and reset your car.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => void doReset() },
      ]
    );
  }

  async function clearMotDate() {
    const doClear = async () => {
      const car = await getCar();
      await saveCar({ ...car, motExpiryISO: null });
    };

    if (Platform.OS === "web") {
      if (window.confirm("Clear MOT date?")) await doClear();
      return;
    }

    Alert.alert("Clear MOT", "This will remove your saved MOT date.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void doClear() },
    ]);
  }

  async function clearServiceHistory() {
    const doClear = async () => {
      await clearServices();
    };

    if (Platform.OS === "web") {
      if (window.confirm("Clear service history?")) await doClear();
      return;
    }

    Alert.alert(
      "Clear Service History",
      "This will delete all service entries.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => void doClear() },
      ]
    );
  }

  async function resetTrophiesOnly() {
    const doReset = async () => {
      await clearUnlockedTrophies();
    };

    if (Platform.OS === "web") {
      if (window.confirm("Reset trophies?")) await doReset();
      return;
    }

    Alert.alert(
      "Reset Trophies",
      "This will reset trophy progress so you can unlock them again.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => void doReset() },
      ]
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionHeader}>Units</Text>

      <View style={styles.segmentWrap}>
  <TouchableOpacity
    style={[styles.segmentBtn, styles.segmentLeft, unit === "mi" && styles.segmentActive]}
    onPress={() => void setMileageUnit("mi")}
    activeOpacity={0.85}
  >
    <Text style={[styles.segmentText, unit === "mi" && styles.segmentTextActive]}>
      mi
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.segmentBtn, styles.segmentRight, unit === "km" && styles.segmentActive]}
    onPress={() => void setMileageUnit("km")}
    activeOpacity={0.85}
  >
    <Text style={[styles.segmentText, unit === "km" && styles.segmentTextActive]}>
      km
    </Text>
  </TouchableOpacity>
</View>

      <Text style={styles.sectionHeader}>Maintenance</Text>

      <TouchableOpacity style={styles.btn} onPress={clearMotDate}>
        <Text style={styles.btnText}>Clear MOT Date</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={clearServiceHistory}>
        <Text style={styles.btnText}>Clear Service History</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Garage</Text>

      <TouchableOpacity style={styles.btn} onPress={resetModsOnly}>
        <Text style={styles.btnText}>Reset Mods Only</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={resetTrophiesOnly}>
        <Text style={styles.btnText}>Reset Trophies Only</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.danger]}
        onPress={resetEntireGarage}
      >
        <Text style={[styles.btnText, styles.dangerText]}>
          Reset Entire Garage
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 28, fontWeight: "600", marginBottom: 20 },

  sectionHeader: {
    color: "#888",
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
    textTransform: "uppercase",
    fontSize: 12,
  },

  row: { flexDirection: "row", gap: 12 },

  btn: {
  flex: 1,
  backgroundColor: "#1a1a1a",
  paddingVertical: 10,      // was 14
  borderRadius: 12,
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#2a2a2a",
  marginBottom: 10,         // was 12
},
btnText: {
  color: "#fff",
  fontWeight: "800",
  fontSize: 13,             // smaller
},

  btnActive: {
    borderColor: "#ff3b3b",
  },
  btnTextActive: {
    color: "#ff3b3b",
    fontWeight: "900",
  },

  danger: { borderColor: "#402" },
  dangerText: { color: "#ff3b3b" },
  segmentWrap: {
  flexDirection: "row",
  borderWidth: 1,
  borderColor: "#2a2a2a",
  borderRadius: 12,
  backgroundColor: "#1a1a1a",
  overflow: "hidden",
  marginBottom: 12,
},

segmentBtn: {
  flex: 1,
  paddingVertical: 10, // smaller than before
  alignItems: "center",
  justifyContent: "center",
},

segmentLeft: {
  borderRightWidth: 1,
  borderRightColor: "#2a2a2a",
},

segmentRight: {},

segmentActive: {
  backgroundColor: "#0f0f0f",
},

segmentText: {
  color: "#bbb",
  fontWeight: "900",
  fontSize: 13,
  letterSpacing: 0.3,
},

segmentTextActive: {
  color: "#ff3b3b",
},

});
