import { Screen } from "@/components/screen";
import { addMod } from "@/lib/storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";


import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AddModScreen() {
    const [title, setTitle] = useState("");
    const [cost, setCost] = useState("");
    const [beforeUri, setBeforeUri] = useState<string | null>(null);
    const [afterUri, setAfterUri] = useState<string | null>(null);

    const canSave = title.trim().length > 0;
    const [notes, setNotes] = useState("");

    return (
        <Screen>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Add Mod</Text>

                <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Mod name</Text>
            <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. BC Racing coilovers"
                placeholderTextColor="#777"
                style={styles.input}
            />

            <Text style={styles.label}>Cost (£)</Text>
            <TextInput
                value={cost}
                onChangeText={setCost}
                placeholder="e.g. 850"
                placeholderTextColor="#777"
                keyboardType="numeric"
                style={styles.input}
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Huge difference in turn-in"
                placeholderTextColor="#777"
                style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                multiline
            />

            <Text style={styles.sectionTitle}>Before / After</Text>

            <View style={styles.photoRow}>
                <View style={styles.photoCard}>
                    <Text style={styles.photoLabel}>Before</Text>
                    {beforeUri ? (
                        <Image source={{ uri: beforeUri }} style={styles.photo} />
                    ) : (
                        <View style={styles.photoPlaceholder} />
                    )}
                    <TouchableOpacity
                        style={styles.photoBtn}
                        onPress={() => pickImage((uri) => setBeforeUri(uri))}

                    >
                        <Text style={styles.photoBtnText}>Pick photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.photoCard}>
                    <Text style={styles.photoLabel}>After</Text>
                    {afterUri ? (
                        <Image source={{ uri: afterUri }} style={styles.photo} />
                    ) : (
                        <View style={styles.photoPlaceholder} />
                    )}
                    <TouchableOpacity
                        style={styles.photoBtn}
                        onPress={() => pickImage((uri) => setAfterUri(uri))}
                    >
                        <Text style={styles.photoBtnText}>Pick photo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                disabled={!canSave}
                onPress={async () => {
                    const parsedCost = cost.trim() ? Number(cost) : null;
                    const safeCost = Number.isFinite(parsedCost as number) ? parsedCost : null;

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
                }}
            >
                <Text style={styles.saveBtnText}>Save Mod</Text>
            </TouchableOpacity>
        </Screen>
    );
}

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

    if (asset.base64) {
      setter(`data:image/jpeg;base64,${asset.base64}`);
    } else {
      setter(asset.uri);
    }
  }
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    title: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "600",
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "#1a1a1a",
    },
    cancelText: {
        color: "#bbb",
        fontWeight: "600",
    },
    label: {
        color: "#bbb",
        marginBottom: 8,
        marginTop: 10,
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
    sectionTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 18,
        marginBottom: 10,
    },
    photoRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 18,
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
        marginBottom: 8,
        fontWeight: "600",
    },
    photoPlaceholder: {
        height: 120,
        borderRadius: 12,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    photo: {
        height: 120,
        borderRadius: 12,
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
        fontWeight: "600",
    },
    saveBtn: {
        backgroundColor: "#ff3b3b",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: "auto",
    },
    saveBtnDisabled: {
        opacity: 0.4,
    },
    saveBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
