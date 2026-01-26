import { Screen } from "@/components/screen";
import { getCar, saveCar } from "@/lib/carStorage";
import { clearServices } from "@/lib/serviceStorage";
import { clearMods } from "@/lib/storage";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function SettingsScreen() {
  async function resetModsOnly() {
    const doReset = async () => {
      await clearMods();
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
      await saveCar({ name: "My Car", heroImageUri: null, currentMileage: null, motExpiryISO: null });
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Reset entire garage?\n\nThis will delete all mods and reset your car profile."
        )
      ) {
        await doReset();
      }
      return;
    }

    Alert.alert("Reset Garage", "This will delete all mods and reset your car.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => void doReset() },
    ]);
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

    Alert.alert("Clear Service History", "This will delete all service entries.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void doClear() },
    ]);
  }

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>

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

      <TouchableOpacity style={[styles.btn, styles.danger]} onPress={resetEntireGarage}>
        <Text style={[styles.btnText, styles.dangerText]}>Reset Entire Garage</Text>
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

  btn: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 12,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  danger: { borderColor: "#402" },
  dangerText: { color: "#ff3b3b" },
});
