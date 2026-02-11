import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Screen } from "@/components/screen";
import { CarProfile, DEFAULT_CAR, getCar, saveCar } from "@/lib/carStorage";
import {
  addService,
  deleteService,
  getServices,
  ServiceEntry,
} from "@/lib/serviceStorage";

function formatDDMMYYYY(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not set";

  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function ServiceScreen() {
  const [car, setCar] = useState<CarProfile>(DEFAULT_CAR);
  const [services, setServices] = useState<ServiceEntry[]>([]);

  // form state
  const [type, setType] = useState("");
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");

  // Native date picker toggle
  const [showMotPicker, setShowMotPicker] = useState(false);
  const [motDraft, setMotDraft] = useState<Date>(new Date());


  const unitLabel = (car.mileageUnit ?? "mi") === "km" ? "km" : "mi";

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const [c, s] = await Promise.all([getCar(), getServices()]);
        if (!alive) return;

        setCar(c);
        setServices(s);
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  const motLabel = useMemo(() => {
    if (!car.motExpiryISO) return "Not set";
    return formatDDMMYYYY(car.motExpiryISO);
  }, [car.motExpiryISO]);

  const motCountdown = useMemo(() => {
    if (!car.motExpiryISO) return null;

    const expiry = new Date(car.motExpiryISO);
    if (Number.isNaN(expiry.getTime())) return null;

    // Compare in UTC days to avoid timezone quirks
    const now = new Date();
    const nowUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );
    const expUTC = Date.UTC(
      expiry.getUTCFullYear(),
      expiry.getUTCMonth(),
      expiry.getUTCDate()
    );

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

  async function onPickMotDate(selectedDate: Date) {
    const fresh = await getCar();
    const next: CarProfile = { ...fresh, motExpiryISO: selectedDate.toISOString() };
    setCar(next);
    await saveCar(next);
  }

  async function clearMot() {
    const doClear = async () => {
      const fresh = await getCar();
      const next: CarProfile = { ...fresh, motExpiryISO: null };
      setCar(next);
      await saveCar(next);
    };

    if (Platform.OS === "web") {
      if (window.confirm("Clear MOT date?")) await doClear();
      return;
    }

    Alert.alert("Clear MOT", "Remove saved MOT date?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void doClear() },
    ]);
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

          {/* Native picker trigger */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              const initial = car.motExpiryISO ? new Date(car.motExpiryISO) : new Date();
              setMotDraft(initial);
              setShowMotPicker(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>
              {car.motExpiryISO ? "Change MOT date" : "Set MOT date"}
            </Text>
          </TouchableOpacity>

          {car.motExpiryISO ? (
            <TouchableOpacity
              style={[styles.secondaryBtn, { marginTop: 10 }]}
              onPress={clearMot}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryBtnText, { color: "#ff3b3b" }]}>
                Clear MOT date
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* DateTimePicker */}
          {/* Date picker (Android = dialog, iOS = modal) */}
          {showMotPicker ? (
            Platform.OS === "ios" ? (
              <Modal
                transparent
                animationType="fade"
                visible={showMotPicker}
                onRequestClose={() => setShowMotPicker(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Select MOT date</Text>

                    <DateTimePicker
                      value={motDraft}
                      mode="date"
                      display="inline"
                      onChange={(_event, date) => {
                        if (date) setMotDraft(date);
                      }}
                    />

                    <View style={styles.modalRow}>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.modalBtnGhost]}
                        onPress={() => setShowMotPicker(false)}
                      >
                        <Text style={styles.modalBtnGhostText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalBtn}
                        onPress={() => {
                          setShowMotPicker(false);
                          void onPickMotDate(motDraft);
                        }}
                      >
                        <Text style={styles.modalBtnText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={car.motExpiryISO ? new Date(car.motExpiryISO) : new Date()}
                mode="date"
                display="default"
                onChange={(_event, date) => {
                  setShowMotPicker(false);
                  if (!date) return;
                  void onPickMotDate(date);
                }}
              />
            )
          ) : null}

        </View>

          <KeyboardAvoidingView>
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
              placeholder={`Mileage (optional) — ${unitLabel}`}
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
          </KeyboardAvoidingView>

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
                {s.mileage != null ? ` • ${s.mileage.toLocaleString()} ${unitLabel}` : ""}
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
  motBad: { backgroundColor: "#2a0f0f", borderColor: "#ff3b3b" },
  motWarn: { backgroundColor: "#2a200f", borderColor: "#ffb020" },
  motOk: { backgroundColor: "#0f2a15", borderColor: "#2bd46a" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
    padding: 14,
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
  modalBtnGhost: {
    backgroundColor: "transparent",
  },
  modalBtnGhostText: {
    color: "#bbb",
    fontWeight: "900",
  },

});
