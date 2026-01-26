import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { CarProfile, getCar, saveCar } from "@/lib/carStorage";
import { addService, deleteService, getServices, ServiceEntry } from "@/lib/serviceStorage";

export default function ServiceScreen() {
  const [car, setCar] = useState<CarProfile>({
    name: "My Car",
    heroImageUri: null,
    currentMileage: null,
    motExpiryISO: null,
  });

  const [services, setServices] = useState<ServiceEntry[]>([]);

  // form state
  const [type, setType] = useState("");
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [motInput, setMotInput] = useState(""); // YYYY-MM-DD

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [c, s] = await Promise.all([getCar(), getServices()]);
        if (!alive) return;
        setCar(c);
        setServices(s);

        // show MOT in yyyy-mm-dd if stored
        if (c.motExpiryISO) {
          const d = new Date(c.motExpiryISO);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setMotInput(`${yyyy}-${mm}-${dd}`);
        } else {
          setMotInput("");
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const motLabel = useMemo(() => {
    if (!car.motExpiryISO) return "Not set";

    const d = new Date(car.motExpiryISO);
    if (Number.isNaN(d.getTime())) return "Not set";

    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }, [car.motExpiryISO]);

  const motCountdown = useMemo(() => {
    if (!car.motExpiryISO) return null;

    const expiry = new Date(car.motExpiryISO);
    if (Number.isNaN(expiry.getTime())) return null;

    // Compare in UTC days to avoid timezone quirks
    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const expUTC = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());

    const diffDays = Math.ceil((expUTC - nowUTC) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, status: "bad" as const };
    }
    if (diffDays === 0) {
      return { text: "Due today", status: "warn" as const };
    }
    if (diffDays <= 30) {
      return { text: `Due in ${diffDays} days`, status: "warn" as const };
    }
    return { text: `Due in ${diffDays} days`, status: "ok" as const };
  }, [car.motExpiryISO]);


  async function saveMot() {
    const trimmed = motInput.trim();

    const showError = (msg: string) => {
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Invalid date", msg);
      }
    };

    // blank = clear MOT
    if (!trimmed) {
      const fresh = await getCar();
      const next: CarProfile = { ...fresh, motExpiryISO: null };
      setCar(next);
      await saveCar(next);
      return;
    }

    // UK format: DD-MM-YYYY
    const ok = /^\d{2}-\d{2}-\d{4}$/.test(trimmed);
    if (!ok) {
      showError("Use format DD-MM-YYYY (e.g. 17-05-2026).");
      return;
    }

    const [dd, mm, yyyy] = trimmed.split("-").map(Number);

    // validate real calendar date
    const test = new Date(Date.UTC(yyyy, mm - 1, dd));
    if (
      Number.isNaN(test.getTime()) ||
      test.getUTCDate() !== dd ||
      test.getUTCMonth() !== mm - 1 ||
      test.getUTCFullYear() !== yyyy
    ) {
      showError("That date isn’t valid. Example: 17-05-2026");
      return;
    }

    const iso = test.toISOString();

    const fresh = await getCar();
    const next: CarProfile = { ...fresh, motExpiryISO: iso };

    setCar(next);          // update UI instantly
    await saveCar(next);   // persist
    setMotInput(trimmed);  // keep UK format in input
  }

  async function addServiceEntry() {
    if (!type.trim()) return;

    const parsedMileage = mileage.trim() ? Number(mileage) : null;
    const safeMileage =
      typeof parsedMileage === "number" && Number.isFinite(parsedMileage)
        ? parsedMileage
        : null;

    const entry: ServiceEntry = {
      id: String(Date.now()),
      type: type.trim(),
      dateISO: new Date().toISOString(),
      mileage: safeMileage,
      notes: notes.trim(),
    };

    await addService(entry);
    const next = await getServices();
    setServices(next);

    // clear form
    setType("");
    setMileage("");
    setNotes("");
  }

  async function confirmDelete(id: string) {
    const doDelete = async () => {
      await deleteService(id);
      const next = await getServices();
      setServices(next);
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this service entry?")) await doDelete();
      return;
    }

    Alert.alert("Delete entry", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void doDelete() },
    ]);
  }

  return (
    <Screen>
      <Text style={styles.title}>Service</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* MOT card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MOT</Text>

          <Text style={styles.cardMeta}>Current: {motLabel}</Text>
          {motCountdown ? (
            <View
              style={[
                styles.motBadge,
                motCountdown.status === "bad" && styles.motBad,
                motCountdown.status === "warn" && styles.motWarn,
                motCountdown.status === "ok" && styles.motOk,
              ]}
            >
              <Text style={styles.motBadgeText}>{motCountdown.text}</Text>
            </View>
          ) : null}

          <TextInput
            value={motInput}
            onChangeText={setMotInput}
            placeholder="DD-MM-YYYY (e.g. 17-05-2026)"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <TouchableOpacity style={styles.secondaryBtn} onPress={saveMot}>
            <Text style={styles.secondaryBtnText}>Save MOT date</Text>
          </TouchableOpacity>
        </View>

        {/* Add service entry */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add service entry</Text>

          <TextInput
            value={type}
            onChangeText={setType}
            placeholder="Type (e.g. Oil change)"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <TextInput
            value={mileage}
            onChangeText={setMileage}
            placeholder="Mileage (optional)"
            placeholderTextColor="#777"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            placeholderTextColor="#777"
            style={[styles.input, styles.notes]}
            multiline
          />

          <TouchableOpacity
            style={[styles.primaryBtn, !type.trim() && { opacity: 0.4 }]}
            onPress={addServiceEntry}
            disabled={!type.trim()}
          >
            <Text style={styles.primaryBtnText}>Add entry</Text>
          </TouchableOpacity>
        </View>

        {/* Service history */}
        <Text style={styles.sectionTitle}>History</Text>

        {services.length === 0 ? (
          <Text style={styles.emptyText}>No service entries yet.</Text>
        ) : (
          services.map((s) => (
            <View key={s.id} style={styles.entry}>
              <View style={styles.entryTop}>
                <Text style={styles.entryTitle}>{s.type}</Text>
                <TouchableOpacity
                  onPress={() => confirmDelete(s.id)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.entryMeta}>
                {new Date(s.dateISO).toLocaleDateString()}
                {s.mileage != null ? ` • ${s.mileage.toLocaleString()} mi` : ""}
              </Text>

              {s.notes ? <Text style={styles.entryNotes}>{s.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardMeta: {
    color: "#bbb",
    marginBottom: 10,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#fff",
    marginBottom: 10,
  },
  notes: { height: 90, textAlignVertical: "top" },
  primaryBtn: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  secondaryBtn: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryBtnText: { color: "#fff", fontWeight: "800" },
  sectionTitle: {
    color: "#fff",
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 10,
  },
  emptyText: { color: "#888" },
  entry: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
  },
  entryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  entryTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  entryMeta: { color: "#bbb", fontWeight: "600" },
  entryNotes: { color: "#ddd", marginTop: 8, lineHeight: 18 },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  deleteText: { color: "#ff3b3b", fontWeight: "800", fontSize: 12 },
  motBadge: {
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  motBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  motBad: {
    backgroundColor: "#2a0f0f",
    borderColor: "#ff3b3b",
  },
  motWarn: {
    backgroundColor: "#2a200f",
    borderColor: "#ffb020",
  },
  motOk: {
    backgroundColor: "#0f2a15",
    borderColor: "#2bd46a",
  },

});
