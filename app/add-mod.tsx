import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
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
import { addMod } from "@/lib/storage";

export default function AddModScreen() {
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);

  async function pickImage(setter: (uri: string) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  async function save() {
    const parsedCost = cost.trim() ? Number(cost) : null;
    const safeCost =
      typeof parsedCost === "number" && Number.isFinite(parsedCost)
        ? parsedCost
        : null;

    await addMod({
      id: String(Date.now()),
      title: title.trim(),
      cost: safeCost,
      dateISO: new Date().toISOString(),
      notes: notes.trim(),
      beforeUri,
      afterUri,
    });

    router.back();
  }

  const Content = (
    <Screen>
      <Text style={styles.title}>Add Mod</Text>

      <TextInput
        placeholder="Mod name"
        placeholderTextColor="#777"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Cost (£)"
        placeholderTextColor="#777"
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Notes"
        placeholderTextColor="#777"
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notes]}
        multiline
      />

      <View style={styles.photoRow}>
        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => pickImage((u) => setBeforeUri(u))}
        >
          {beforeUri ? (
            <Image source={{ uri: beforeUri }} style={styles.photo} />
          ) : (
            <Text style={styles.photoText}>Add Before</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => pickImage((u) => setAfterUri(u))}
        >
          {afterUri ? (
            <Image source={{ uri: afterUri }} style={styles.photo} />
          ) : (
            <Text style={styles.photoText}>Add After</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Save Mod</Text>
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
  title: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 14 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 10,
  },
  notes: { height: 90, textAlignVertical: "top" },
  photoRow: { flexDirection: "row", gap: 12, marginVertical: 14 },
  photoBox: {
    flex: 1,
    height: 120,
    backgroundColor: "#111",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  photo: { width: "100%", height: "100%", borderRadius: 12 },
  photoText: { color: "#aaa", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "800" },
});
