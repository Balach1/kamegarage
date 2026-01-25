import { getMods, ModEntry, saveMods } from "@/lib/storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";


import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { Screen } from "@/components/screen";

export default function TimelineScreen() {
  const [mods, setModsState] = useState<ModEntry[]>([]);
  const [undoItem, setUndoItem] = useState<ModEntry | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const data = await getMods();
        if (alive) setModsState(data);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  async function confirmDelete(id: string) {
    const doDelete = async () => {
      const current = await getMods();
      const removed = current.find((m) => m.id === id) ?? null;
      const next = current.filter((m) => m.id !== id);

      await saveMods(next);
      setModsState(next);

      if (undoTimer) clearTimeout(undoTimer);

      setUndoItem(removed);
      const timer = setTimeout(() => setUndoItem(null), 4000);
      setUndoTimer(timer);
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this mod?")) await doDelete();
      return;
    }

    Alert.alert("Delete Mod", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  }

  async function undoDelete() {
    if (!undoItem) return;

    const current = await getMods();
    const restored = [undoItem, ...current];

    await saveMods(restored);
    setModsState(restored);
    setUndoItem(null);

    if (undoTimer) clearTimeout(undoTimer);
  }

  function renderRightActions(onDelete: () => void) {
    return (
      <TouchableOpacity style={styles.swipeDelete} onPress={onDelete}>
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Timeline</Text>

      {mods.length === 0 ? (
        <Text style={styles.empty}>No mods yet. Add your first mod.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {mods.map((m) => {
            const Card = (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={() => router.push(`/edit-mod?id=${m.id}`)}>
  <Text style={styles.modTitle}>{m.title}</Text>
</TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => confirmDelete(m.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={styles.photoBox}>
                    <Text style={styles.photoLabel}>Before</Text>
                    {m.beforeUri ? (
                      <Image source={{ uri: m.beforeUri }} style={styles.photo} />
                    ) : (
                      <View style={styles.placeholder} />
                    )}
                  </View>

                  <View style={styles.photoBox}>
                    <Text style={styles.photoLabel}>After</Text>
                    {m.afterUri ? (
                      <Image source={{ uri: m.afterUri }} style={styles.photo} />
                    ) : (
                      <View style={styles.placeholder} />
                    )}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    {m.cost != null ? `£${m.cost}` : "£—"}
                  </Text>
                  <Text style={styles.meta}>
                    {new Date(m.dateISO).toLocaleDateString()}
                  </Text>
                </View>

                {m.notes ? (
                  <Text style={styles.notes}>{m.notes}</Text>
                ) : null}
              </View>
            );

            // Web = no swipe
            if (Platform.OS === "web") {
              return <View key={m.id}>{Card}</View>;
            }

            // Mobile = swipe
            return (
              <Swipeable
                key={m.id}
                renderRightActions={() =>
                  renderRightActions(() => confirmDelete(m.id))
                }
                overshootRight={false}
              >
                {Card}
              </Swipeable>
            );
          })}
        </ScrollView>
      )}

      {undoItem ? (
        <View style={styles.undoBar}>
          <Text style={styles.undoText}>Mod deleted</Text>

          <TouchableOpacity onPress={undoDelete} style={styles.undoBtn}>
            <Text style={styles.undoBtnText}>UNDO</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 14,
  },
  empty: {
    color: "#aaa",
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  deleteText: {
    color: "#ff3b3b",
    fontWeight: "700",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  photoBox: {
    flex: 1,
  },
  photoLabel: {
    color: "#bbb",
    fontWeight: "600",
    marginBottom: 6,
  },
  photo: {
    height: 140,
    borderRadius: 12,
  },
  placeholder: {
    height: 140,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  meta: {
    color: "#bbb",
    fontWeight: "600",
  },
  notes: {
    color: "#ddd",
    marginTop: 10,
    lineHeight: 18,
  },
  swipeDelete: {
    width: 90,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff3b3b",
    borderRadius: 16,
    marginBottom: 12,
  },
  swipeDeleteText: {
    color: "#fff",
    fontWeight: "900",
  },
  undoBar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  undoText: {
    color: "#fff",
    fontWeight: "700",
  },
  undoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  undoBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
});
