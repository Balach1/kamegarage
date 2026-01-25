import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Screen } from "@/components/screen";
import { getMods, ModEntry, updateMod } from "@/lib/storage";

export default function EditModScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [mod, setMod] = useState<ModEntry | null>(null);
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const mods = await getMods();
      const found = mods.find((m) => m.id === id);
      if (!found) {
        router.back();
        return;
      }

      setMod(found);
      setTitle(found.title);
      setCost(found.cost != null ? String(found.cost) : "");
      setNotes(found.notes ?? "");
      setBeforeUri(found.beforeUri);
      setAfterUri(found.afterUri);
    })();
  }, [id]);

  async function pickImage(setter: (uri: string) => void) {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setter(uri);
    }
  }

  async function saveChanges() {
    if (!mod) return;

    const parsedCost = cost.trim() ? Number(cost) : null;
    const safeCost =
      typeof parsedCost === "number" && Number.isFinite(parsedCost)
        ? parsedCost
        : null;

    const updated: ModEntry = {
      ...mod,
      title: title.trim(),
      cost: safeCost,
      notes: notes.trim(),
      beforeUri,
      afterUri,
    };

    await updateMod(updated);
    router.back();
  }

  if (!mod) return null;

  return (
    <Screen>
      <Text style={styles.title}>Edit Mod</Text>

      <Text style={styles.label}>Mod name</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholderTextColor="#777"
      />

      <Text style={styles.label}>Cost (£)</Text>
      <TextInput
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
        style={styles.input}
        placeholderTextColor="#777"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notes]}
        multiline
        placeholderTextColor="#777"
      />

      <View style={styles.photoRow}>
        <View style={styles.photoCard}>
          <Text style={styles.photoLabel}>Before</Text>
          {beforeUri ? (
            <Image source={{ uri: beforeUri }} style={styles.photo} />
          ) : (
            <View style={styles.placeholder} />
          )}
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={() => pickImage(setBeforeUri)}
          >
            <Text style={styles.photoBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.photoCard}>
          <Text style={styles.photoLabel}>After</Text>
          {afterUri ? (
            <Image source={{ uri: afterUri }} style={styles.photo} />
          ) : (
            <View style={styles.placeholder} />
          )}
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={() => pickImage(setAfterUri)}
          >
            <Text style={styles.photoBtnText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 14,
  },
  label: {
    color: "#bbb",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#222",
  },
  notes: {
    height: 90,
    textAlignVertical: "top",
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  photoCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  photoLabel: {
    color: "#bbb",
    fontWeight: "600",
    marginBottom: 6,
  },
  photo: {
    height: 120,
    borderRadius: 12,
  },
  placeholder: {
    height: 120,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  photoBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  photoBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
