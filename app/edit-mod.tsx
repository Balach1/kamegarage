import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
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
import { deleteMod, getMods, ModEntry, updateMod } from "@/lib/storage";

function toNumberOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

async function pickImageAsDataUri(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.7,
    base64: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
  return uri;
}

export default function EditModScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const modId = useMemo(() => (typeof id === "string" ? id : ""), [id]);

  const [mod, setMod] = useState<ModEntry | null>(null);

  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  // ✅ photo drafts (so user can change then Save once)
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        if (!modId) return;

        const mods = await getMods();
        const found = mods.find((m) => m.id === modId) ?? null;
        if (!alive) return;

        setMod(found);

        setTitle(found?.title ?? "");
        setCost(found?.cost != null ? String(found.cost) : "");
        setNotes(found?.notes ?? "");

        setBeforeUri(found?.beforeUri ?? null);
        setAfterUri(found?.afterUri ?? null);
      })();

      return () => {
        alive = false;
      };
    }, [modId])
  );

  async function save() {
    if (!mod) return;

    const next: ModEntry = {
      ...mod,
      title: title.trim() || "Untitled mod",
      cost: toNumberOrNull(cost),
      notes: notes.trim(),
      beforeUri,
      afterUri,
    };

    await updateMod(next);
    router.back();
  }

  async function confirmDelete() {
    if (!mod) return;

    const doDelete = async () => {
      await deleteMod(mod.id);
      router.back();
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this mod?")) await doDelete();
      return;
    }

    Alert.alert("Delete mod", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void doDelete() },
    ]);
  }

  async function replaceBefore() {
    const uri = await pickImageAsDataUri();
    if (!uri) return;
    setBeforeUri(uri);
  }

  async function replaceAfter() {
    const uri = await pickImageAsDataUri();
    if (!uri) return;
    setAfterUri(uri);
  }

  function removeBefore() {
    setBeforeUri(null);
  }

  function removeAfter() {
    setAfterUri(null);
  }

  const Content = (
    <Screen>
      <Text style={styles.title}>Edit Mod</Text>

      {!mod ? (
        <Text style={styles.empty}>
          {modId ? "Mod not found." : "Missing mod id."}
        </Text>
      ) : (
        <>
          {/* Photos */}
          <Text style={styles.section}>Photos</Text>

          <View style={styles.photoRow}>
            <View style={styles.photoCol}>
              <Text style={styles.photoLabel}>Before</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={replaceBefore}
                style={styles.photoBox}
              >
                {beforeUri ? (
                  <Image source={{ uri: beforeUri }} style={styles.photoImg} />
                ) : (
                  <Text style={styles.photoPlaceholder}>Add before photo</Text>
                )}
              </TouchableOpacity>

              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.smallBtn} onPress={replaceBefore}>
                  <Text style={styles.smallBtnText}>
                    {beforeUri ? "Replace" : "Upload"}
                  </Text>
                </TouchableOpacity>

                {beforeUri ? (
                  <TouchableOpacity style={styles.smallBtnGhost} onPress={removeBefore}>
                    <Text style={styles.smallBtnGhostText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.photoCol}>
              <Text style={styles.photoLabel}>After</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={replaceAfter}
                style={styles.photoBox}
              >
                {afterUri ? (
                  <Image source={{ uri: afterUri }} style={styles.photoImg} />
                ) : (
                  <Text style={styles.photoPlaceholder}>Add after photo</Text>
                )}
              </TouchableOpacity>

              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.smallBtn} onPress={replaceAfter}>
                  <Text style={styles.smallBtnText}>
                    {afterUri ? "Replace" : "Upload"}
                  </Text>
                </TouchableOpacity>

                {afterUri ? (
                  <TouchableOpacity style={styles.smallBtnGhost} onPress={removeAfter}>
                    <Text style={styles.smallBtnGhostText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          {/* Fields */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Coilovers"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <Text style={styles.label}>Cost (£)</Text>
          <TextInput
            value={cost}
            onChangeText={(t) => setCost(t.replace(/[^0-9.]/g, ""))}
            keyboardType="numeric"
            placeholder="e.g. 650"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything to remember…"
            placeholderTextColor="#777"
            style={[styles.input, styles.notes]}
            multiline
          />

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </Screen>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {Platform.OS === "web" ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          {Content}
        </ScrollView>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
            {Content}
          </ScrollView>
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 12 },
  empty: { color: "#bbb", fontWeight: "700" },

  section: { color: "#fff", fontWeight: "900", marginTop: 6, marginBottom: 10 },

  photoRow: { flexDirection: "row", gap: 12, marginBottom: 6 },
  photoCol: { flex: 1 },
  photoLabel: { color: "#bbb", fontWeight: "800", marginBottom: 8 },

  photoBox: {
    height: 130,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { width: "100%", height: "100%" },
  photoPlaceholder: { color: "#888", fontWeight: "700" },

  photoActions: { flexDirection: "row", gap: 10, marginTop: 10 },

  smallBtn: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  smallBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  smallBtnGhost: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  smallBtnGhostText: { color: "#ff3b3b", fontWeight: "900", fontSize: 12 },

  label: { color: "#bbb", fontWeight: "800", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#222",
  },
  notes: { height: 110, textAlignVertical: "top" },

  saveBtn: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  saveText: { color: "#fff", fontWeight: "900" },

  deleteBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0f0f0f",
  },
  deleteText: { color: "#ff3b3b", fontWeight: "900" },

  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0f0f0f",
    marginBottom: 30,
  },
  cancelText: { color: "#bbb", fontWeight: "800" },
});
