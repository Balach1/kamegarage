import { Screen } from "@/components/screen";
import { saveCar } from "@/lib/carStorage";
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
      await saveCar({ name: "My Car", heroImageUri: null });
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Reset entire garage?\n\nThis will delete all mods and reset your car."
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

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity style={styles.btn} onPress={resetModsOnly}>
        <Text style={styles.btnText}>Reset Mods Only</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.danger]} onPress={resetEntireGarage}>
        <Text style={[styles.btnText, styles.dangerText]}>
          Reset Entire Garage
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 28, fontWeight: "600", marginBottom: 20 },
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
