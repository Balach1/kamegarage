import { computeTrophies } from "@/lib/trophyEngine";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { CarProfile, DEFAULT_CAR, getCar, saveCar } from "@/lib/carStorage";
import { getMods, ModEntry } from "@/lib/storage";

export default function GarageScreen() {
  const [car, setCar] = useState<CarProfile>(DEFAULT_CAR);
  const [mods, setMods] = useState<ModEntry[]>([]);

  // Editing: garage title
  const [isEditingGarageTitle, setIsEditingGarageTitle] = useState(false);
  const [garageTitleDraft, setGarageTitleDraft] = useState(
    DEFAULT_CAR.garageTitle
  );

  // Editing: car name
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(DEFAULT_CAR.name);

  // Editing: mileage
  const [isEditingMileage, setIsEditingMileage] = useState(false);
  const [mileageDraft, setMileageDraft] = useState("");

  const [trophyCount, setTrophyCount] = useState(0);

  const unit = car.mileageUnit ?? "mi";
  const unitLabel = unit === "km" ? "km" : "mi";
  const mileagePlaceholder = unit === "km" ? "Kilometres" : "Miles";

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const [carData, modsData, trophies] = await Promise.all([
          getCar(),
          getMods(),
          computeTrophies(),
        ]);
        if (!alive) return;

        setCar(carData);
        setMods(modsData);
        setTrophyCount(trophies.filter((t) => t.earned).length);

        // ✅ sync drafts from storage every focus
        setGarageTitleDraft(carData.garageTitle ?? DEFAULT_CAR.garageTitle);
        setNameDraft(carData.name ?? DEFAULT_CAR.name);
        setMileageDraft(
          carData.currentMileage != null ? String(carData.currentMileage) : ""
        );
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  const latestAfterUri = useMemo(() => {
    const firstWithAfter = mods.find((m) => !!m.afterUri);
    return firstWithAfter?.afterUri ?? null;
  }, [mods]);

  const heroUri =
    car.heroImageUri !== null
      ? car.heroImageUri
      : mods.length > 0
      ? latestAfterUri
      : null;

  const installedModsCount = useMemo(
    () => mods.filter((m) => m.status === "installed").length,
    [mods]
  );

  const installedCount = useMemo(
    () => mods.filter((m) => m.status === "installed").length,
    [mods]
  );
  const plannedCount = useMemo(
    () => mods.filter((m) => m.status === "planned").length,
    [mods]
  );

  const installedSpent = useMemo(() => {
    let sum = 0;
    for (const m of mods) {
      if (m.status !== "installed") continue;
      if (typeof m.cost === "number" && Number.isFinite(m.cost)) sum += m.cost;
    }
    return sum;
  }, [mods]);

  const plannedCost = useMemo(() => {
    let sum = 0;
    for (const m of mods) {
      if (m.status !== "planned") continue;
      if (typeof m.cost === "number" && Number.isFinite(m.cost)) sum += m.cost;
    }
    return sum;
  }, [mods]);

  const recentInstalledMods = useMemo(
    () => mods.filter((m) => m.status === "installed").slice(0, 5),
    [mods]
  );

  const recentPlannedMods = useMemo(
    () => mods.filter((m) => m.status === "planned").slice(0, 5),
    [mods]
  );

  async function saveGarageTitle(nextTitle: string) {
    const cleaned = nextTitle.trim() || DEFAULT_CAR.garageTitle;
    const next: CarProfile = { ...car, garageTitle: cleaned };
    setCar(next);
    setGarageTitleDraft(cleaned);
    await saveCar(next);
  }

  async function saveName(nextName: string) {
    const cleaned = nextName.trim() || DEFAULT_CAR.name;
    const next: CarProfile = { ...car, name: cleaned };
    setCar(next);
    setNameDraft(cleaned);
    await saveCar(next);
  }

  async function saveMileage(next: string) {
    const cleaned = next.replace(/[^0-9]/g, "");
    const n = cleaned ? Number(cleaned) : null;
    const safe = typeof n === "number" && Number.isFinite(n) ? n : null;

    const nextCar: CarProfile = { ...car, currentMileage: safe };
    setCar(nextCar);
    setMileageDraft(safe != null ? String(safe) : "");
    await saveCar(nextCar);
  }

  async function pickHero() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const uri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;

    const next: CarProfile = { ...car, heroImageUri: uri };
    setCar(next);
    await saveCar(next);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Garage title */}
          {isEditingGarageTitle ? (
            <View style={styles.pageTitleRow}>
              <TextInput
                value={garageTitleDraft}
                onChangeText={setGarageTitleDraft}
                autoFocus
                placeholder="Garage title"
                placeholderTextColor="#777"
                style={styles.pageTitleInput}
                returnKeyType="done"
                onSubmitEditing={async () => {
                  await saveGarageTitle(garageTitleDraft);
                  setIsEditingGarageTitle(false);
                  Keyboard.dismiss();
                }}
                onBlur={async () => {
                  await saveGarageTitle(garageTitleDraft);
                  setIsEditingGarageTitle(false);
                }}
              />

              <TouchableOpacity
                onPress={async () => {
                  await saveGarageTitle(garageTitleDraft);
                  setIsEditingGarageTitle(false);
                  Keyboard.dismiss();
                }}
                style={styles.pageTitleSaveBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.pageTitleSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pageTitleRow}
              activeOpacity={0.75}
              onPress={() => {
                setIsEditingName(false);
                setIsEditingMileage(false);
                setIsEditingGarageTitle(true);
              }}
            >
              <Text testID="garage.title" style={styles.title}>
                {car.garageTitle ?? DEFAULT_CAR.garageTitle}
              </Text>
              <Ionicons name="pencil" size={16} color="#aaa" />
            </TouchableOpacity>
          )}

          {/* Header row: Name + edit + Mileage */}
          {isEditingName ? (
            <View style={styles.headerRow}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus
                placeholder="Car name"
                placeholderTextColor="#777"
                style={styles.nameInputRow}
                returnKeyType="done"
                onSubmitEditing={async () => {
                  await saveName(nameDraft);
                  setIsEditingName(false);
                  Keyboard.dismiss();
                }}
                onBlur={async () => {
                  await saveName(nameDraft);
                  setIsEditingName(false);
                }}
              />

              {/* Mileage visible while editing name */}
              {isEditingMileage ? (
                <TextInput
                  value={mileageDraft}
                  onChangeText={(t) => setMileageDraft(t.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  placeholder={mileagePlaceholder}
                  placeholderTextColor="#777"
                  style={styles.mileageInput}
                  returnKeyType="done"
                  onSubmitEditing={async () => {
                    await saveMileage(mileageDraft);
                    setIsEditingMileage(false);
                    Keyboard.dismiss();
                  }}
                  onBlur={async () => {
                    await saveMileage(mileageDraft);
                    setIsEditingMileage(false);
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={styles.mileageChip}
                  activeOpacity={0.75}
                  onPress={() => {
                    setIsEditingGarageTitle(false);
                    setIsEditingName(false);
                    setIsEditingMileage(true);
                  }}
                >
                  <Text style={styles.mileageText}>
                    {car.currentMileage != null
                      ? `${car.currentMileage.toLocaleString()} ${unitLabel}`
                      : `Set ${unitLabel}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.nameTap}
                activeOpacity={0.75}
                onPress={() => {
                  setIsEditingGarageTitle(false);
                  setIsEditingMileage(false);
                  setIsEditingName(true);
                }}
              >
                <Text style={styles.carNameRow} numberOfLines={1}>
                  {car.name}
                </Text>
                <Ionicons name="pencil" size={14} color="#aaa" />
              </TouchableOpacity>

              {isEditingMileage ? (
                <TextInput
                  value={mileageDraft}
                  onChangeText={(t) => setMileageDraft(t.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  placeholder={mileagePlaceholder}
                  placeholderTextColor="#777"
                  style={styles.mileageInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={async () => {
                    await saveMileage(mileageDraft);
                    setIsEditingMileage(false);
                    Keyboard.dismiss();
                  }}
                  onBlur={async () => {
                    await saveMileage(mileageDraft);
                    setIsEditingMileage(false);
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={styles.mileageChip}
                  activeOpacity={0.75}
                  onPress={() => {
                    setIsEditingGarageTitle(false);
                    setIsEditingName(false);
                    setIsEditingMileage(true);
                  }}
                >
                  <Text style={styles.mileageText}>
                    {car.currentMileage != null
                      ? `${car.currentMileage.toLocaleString()} ${unitLabel}`
                      : `Set ${unitLabel}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Hero (tap to add/change) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pickHero}
            style={{ marginBottom: 12 }}
          >
            {heroUri ? (
              <View style={styles.heroWrap}>
                <Image source={{ uri: heroUri }} style={styles.carImage} />
                <View style={styles.heroOverlayIcon}>
                  <Ionicons name="camera" size={16} color="#bbb" />
                </View>
              </View>
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="add-circle-outline" size={22} color="#bbb" />
                <Text style={styles.heroPlaceholderText}>Add hero photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Mods + trophies */}
          <View style={styles.statInlineRow}>
            <TouchableOpacity
              style={styles.inlineStat}
              activeOpacity={0.75}
              onPress={() => router.push("/timeline")}
            >
              <Text style={styles.statValueInline}>🔧 {installedModsCount}</Text>
              <Text style={styles.statLabelInline}>Mods</Text>
            </TouchableOpacity>

            {trophyCount > 0 ? <Text style={styles.inlineDivider}>·</Text> : null}

            <TouchableOpacity
              style={styles.inlineStat}
              activeOpacity={0.75}
              onPress={() => router.push("/trophies")}
            >
              <Text style={styles.statValueInline}>🏆 {trophyCount}</Text>
              <Text style={styles.statLabelInline}>Trophies</Text>
            </TouchableOpacity>
          </View>

          {/* Spec sheet */}
          <View style={styles.specCard}>
            <Text style={styles.specTitle}>Spec sheet</Text>

            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>BHP</Text>
                <Text style={styles.specValue}>
                  {car.specs?.bhp != null ? String(car.specs.bhp) : "—"}
                </Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Colour</Text>
                <Text style={styles.specValue}>{car.specs?.colour ?? "—"}</Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>MPG</Text>
                <Text style={styles.specValue}>
                  {car.specs?.mpg != null ? String(car.specs.mpg) : "—"}
                </Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>0–60</Text>
                <Text style={styles.specValue}>
                  {car.specs?.zeroToSixty != null
                    ? `${car.specs.zeroToSixty}s`
                    : "—"}
                </Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Drivetrain</Text>
                <Text style={styles.specValue}>
                  {car.specs?.drivetrain ?? "—"}
                </Text>
              </View>

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Transmission</Text>
                <Text style={styles.specValue}>
                  {car.specs?.transmission ?? "—"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editSpecsBtn}
              onPress={() => router.push("/edit-specs")}
            >
              <Text style={styles.editSpecsText}>Edit specs</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Mods */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent mods</Text>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.subSectionTitle}>
                Installed ({installedCount})
              </Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  Spent · £{installedSpent.toLocaleString()}
                </Text>
              </View>
            </View>

            {recentInstalledMods.length === 0 ? (
              <Text style={styles.emptyText}>No installed mods yet.</Text>
            ) : (
              <View style={styles.recentList}>
                {recentInstalledMods.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.recentItem}
                    onPress={() => router.push(`/edit-mod?id=${m.id}`)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.recentName} numberOfLines={1}>
                      {m.title}
                    </Text>

                    <Text style={styles.recentMeta}>
                      {m.cost != null ? `£${m.cost}` : "£—"}
                    </Text>
                  </TouchableOpacity>
                ))}

                {installedCount > 5 ? (
                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push("/timeline")}
                  >
                    <Text style={styles.viewAllText}>View timeline</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.subSectionTitle}>Planned ({plannedCount})</Text>

              <View style={styles.pillPlanned}>
                <Text style={styles.pillPlannedText}>
                  Budget · £{plannedCost.toLocaleString()}
                </Text>
              </View>
            </View>

            {recentPlannedMods.length === 0 ? (
              <Text style={styles.emptyText}>No planned mods yet.</Text>
            ) : (
              <View style={styles.recentList}>
                {recentPlannedMods.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.recentItem}
                    onPress={() => router.push(`/edit-mod?id=${m.id}`)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.recentName} numberOfLines={1}>
                      {m.title}
                    </Text>

                    <Text style={styles.recentMeta}>
                      {m.cost != null ? `£${m.cost}` : "£—"}
                    </Text>
                  </TouchableOpacity>
                ))}

                {plannedCount > 5 ? (
                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push("/timeline")}
                  >
                    <Text style={styles.viewAllText}>View timeline</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          {/* Add Mod */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/add-mod")}
          >
            <Text style={styles.buttonText}>+ Add Mod</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Garage title edit
  pageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },
  pageTitleInput: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  pageTitleSaveBtn: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  pageTitleSaveText: {
    color: "#fff",
    fontWeight: "900",
  },

  // Header row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  nameTap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  carNameRow: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    flexShrink: 1,
  },
  nameInputRow: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  mileageChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  mileageText: {
    color: "#bbb",
    fontWeight: "800",
    fontSize: 12,
  },
  mileageInput: {
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    textAlign: "right",
  },

  // Hero
  carImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  heroWrap: { position: "relative" },
  heroOverlayIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(15,15,15,0.65)",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroPlaceholderText: { color: "#aaa", fontWeight: "700" },

  // Inline stats
  statInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  inlineStat: { alignItems: "center" },
  statValueInline: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statLabelInline: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  inlineDivider: { color: "#444", fontSize: 18, marginTop: -6 },

  // Spec sheet
  sectionTitle: { color: "#fff", fontWeight: "700", marginBottom: 10 },
  specCard: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  specTitle: { color: "#fff", fontWeight: "900", marginBottom: 10 },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  specItem: {
    width: "48%",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  specLabel: {
    color: "#888",
    fontWeight: "800",
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  specValue: { color: "#fff", fontWeight: "900", fontSize: 14 },
  editSpecsBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  editSpecsText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  // Recent
  recentSection: { marginTop: 6, marginBottom: 14 },
  emptyText: { color: "#888" },
  recentList: { gap: 8 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  recentName: {
    color: "#fff",
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  recentMeta: { color: "#bbb", fontWeight: "700" },

  viewAllBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  viewAllText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
    marginTop: 8,
  },
  subSectionTitle: { color: "#bbb", fontWeight: "800" },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  pillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  pillPlanned: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  pillPlannedText: { color: "#ffb020", fontWeight: "900", fontSize: 12 },

  // Button
  button: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
