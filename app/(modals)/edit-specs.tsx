import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { getCar, saveCar } from "@/lib/carStorage";

type Drivetrain = "RWD" | "FWD" | "AWD";
type Transmission = "Manual" | "Auto" | "Semi";

const COLOURS = [
  "Black",
  "White",
  "Silver",
  "Grey",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
] as const;

export default function EditSpecsScreen() {
  const [bhp, setBhp] = useState("");
  const [mpg, setMpg] = useState("");
  const [zeroToSixty, setZeroToSixty] = useState("");

  const [drivetrain, setDrivetrain] = useState<Drivetrain | "">("");
  const [transmission, setTransmission] = useState<Transmission | "">("");

  // ✅ NEW: colour state
  const [colour, setColour] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const car = await getCar();
        if (!alive) return;

        setBhp(car.specs?.bhp != null ? String(car.specs.bhp) : "");
        setMpg(car.specs?.mpg != null ? String(car.specs.mpg) : "");
        setZeroToSixty(
          car.specs?.zeroToSixty != null ? String(car.specs.zeroToSixty) : ""
        );

        const dt = car.specs?.drivetrain ?? "";
        setDrivetrain(dt === "RWD" || dt === "FWD" || dt === "AWD" ? dt : "");

        const tr = car.specs?.transmission ?? "";
        setTransmission(tr === "Manual" || tr === "Auto" || tr === "Semi" ? tr : "");

        // ✅ load colour
        setColour(car.specs?.colour ?? "");
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  function toNumberOrNull(v: string) {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  function goBackOrHome() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function save() {
    const car = await getCar();

    const next = {
      ...car,
      specs: {
        bhp: toNumberOrNull(bhp),
        mpg: toNumberOrNull(mpg),
        zeroToSixty: toNumberOrNull(zeroToSixty),
        drivetrain: drivetrain || null,
        transmission: transmission || null,
        colour: colour || null, // ✅ CRITICAL
      },
    };

    await saveCar(next);

    // ✅ Debug proof (remove later)
    const check = await getCar();
    console.log("Saved colour:", check.specs?.colour);

    goBackOrHome();
  }

  const Content = (
    <Screen>
      <Text style={styles.title}>Edit Spec Sheet</Text>

      <Text style={styles.label}>BHP</Text>
      <TextInput
        value={bhp}
        onChangeText={setBhp}
        keyboardType="numeric"
        placeholder="e.g. 160"
        placeholderTextColor="#777"
        style={styles.input}
      />

      <Text style={styles.label}>MPG</Text>
      <TextInput
        value={mpg}
        onChangeText={setMpg}
        keyboardType="numeric"
        placeholder="e.g. 32"
        placeholderTextColor="#777"
        style={styles.input}
      />

      <Text style={styles.label}>0–60 (seconds)</Text>
      <TextInput
        value={zeroToSixty}
        onChangeText={setZeroToSixty}
        keyboardType="numeric"
        placeholder="e.g. 6.8"
        placeholderTextColor="#777"
        style={styles.input}
      />

      <Text style={styles.label}>Drivetrain</Text>
      <View style={styles.segmentRow}>
        {(["RWD", "FWD", "AWD"] as const).map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setDrivetrain(v)}
            style={[styles.segment, drivetrain === v && styles.segmentActive]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.segmentText,
                drivetrain === v && styles.segmentTextActive,
              ]}
            >
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Transmission</Text>
      <View style={styles.segmentRow}>
        {(["Manual", "Auto", "Semi"] as const).map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setTransmission(v)}
            style={[styles.segment, transmission === v && styles.segmentActive]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.segmentText,
                transmission === v && styles.segmentTextActive,
              ]}
            >
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Colour</Text>
      <View style={styles.colourRow}>
        {COLOURS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setColour(c)}
            style={[styles.colourPill, colour === c && styles.colourPillActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.colourText, colour === c && styles.colourTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Save Specs</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={goBackOrHome}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </Screen>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {Platform.OS === "web" ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {Content}
        </ScrollView>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {Content}
          </ScrollView>
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 14 },
  label: { color: "#bbb", fontWeight: "800", marginBottom: 6, marginTop: 10 },

  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#222",
  },

  segmentRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  segmentActive: { borderColor: "#fff" },
  segmentText: { color: "#bbb", fontWeight: "900" },
  segmentTextActive: { color: "#fff" },

  colourRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  colourPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  colourPillActive: { borderColor: "#fff" },
  colourText: { color: "#bbb", fontWeight: "900", fontSize: 12 },
  colourTextActive: { color: "#fff" },

  saveBtn: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  saveText: { color: "#fff", fontWeight: "900" },

  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0f0f0f",
  },
  cancelText: { color: "#bbb", fontWeight: "800" },
});
