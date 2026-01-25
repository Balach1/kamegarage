import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Screen } from "@/components/screen";
import { CarProfile, getCar, saveCar } from "@/lib/carStorage";
import { getMods, ModEntry } from "@/lib/storage";

export default function GarageScreen() {
  const [car, setCar] = useState<CarProfile>({
    name: "My Car",
    heroImageUri: null,
  });

  const [mods, setMods] = useState<ModEntry[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(car.name);
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


  const modsCount = mods.length;

  const totalSpent = useMemo(() => {
    let sum = 0;
    for (const m of mods) {
      if (typeof m.cost === "number" && Number.isFinite(m.cost)) sum += m.cost;
    }
    return sum;
  }, [mods]);

  const recentMods = useMemo(() => mods.slice(0, 5), [mods]);


  async function saveName(nextName: string) {
    const cleaned = nextName.trim() || "My Car";
    const next: CarProfile = { ...car, name: cleaned };
    setCar(next);
    setNameDraft(cleaned);
    await saveCar(next);
  }

  // Load car + mods whenever the Garage screen focuses
  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const [carData, modsData] = await Promise.all([getCar(), getMods()]);
        if (!alive) return;

        setCar(carData);
        setNameDraft(carData.name);
        setMods(modsData);
      })();

      return () => {
        alive = false;
      };
    }, [])
  );

  // Auto-hero: if user hasn't set a hero, use most recent mod's "after" photo

  async function pickHero() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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

    const next: CarProfile = {
      ...car,
      heroImageUri: uri,
    };

    setCar(next);
    await saveCar(next);
  }


  return (
    <Screen>
      <Text style={styles.title}>Your Garage</Text>

      <View style={styles.card}>
        {heroUri ? (
          <Image source={{ uri: heroUri }} style={styles.carImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>Add a hero photo</Text>
          </View>
        )}

        <TouchableOpacity style={styles.heroBtn} onPress={pickHero}>
          <Text style={styles.heroBtnText}>
            {car.heroImageUri
              ? "Change hero photo"
              : latestAfterUri
                ? "Set hero photo (override auto)"
                : "Set hero photo"}
          </Text>
        </TouchableOpacity>

        {isEditingName ? (
          <View style={styles.nameRow}>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              placeholder="Car name"
              placeholderTextColor="#777"
              style={styles.nameInput}
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

            <TouchableOpacity
              style={styles.nameSaveBtn}
              onPress={async () => {
                await saveName(nameDraft);
                setIsEditingName(false);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.nameSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditingName(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.carName}>{car.name}</Text>
            <Text style={styles.tapToEdit}>Tap to rename</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{modsCount}</Text>
            <Text style={styles.statLabel}>Mods</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statValue}>
              £{totalSpent.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
        </View>

        <View style={styles.recentSection}>
  <Text style={styles.sectionTitle}>Recent mods</Text>

  {recentMods.length === 0 ? (
    <Text style={styles.emptyText}>No mods yet — add your first one.</Text>
  ) : (
    <View style={styles.recentList}>
      {recentMods.map((m) => (
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

      {mods.length > 5 ? (
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push("/timeline")}
        >
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )}
</View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/add-mod")}
        >
          <Text style={styles.buttonText}>+ Add Mod</Text>
        </TouchableOpacity>

      </View>
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
  },
  carImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  heroPlaceholderText: {
    color: "#aaa",
    fontWeight: "600",
  },
  heroBtn: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  heroBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  carName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  statLabel: {
    color: "#aaa",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  nameInput: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  nameSaveBtn: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  nameSaveText: {
    color: "#fff",
    fontWeight: "800",
  },
  tapToEdit: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  resetBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0f0f0f",
  },
  resetText: {
    color: "#ff3b3b",
    fontWeight: "700",
  },
recentSection: {
  marginTop: 6,
  marginBottom: 14,
},
sectionTitle: {
  color: "#fff",
  fontWeight: "700",
  marginBottom: 10,
},
emptyText: {
  color: "#888",
},
recentList: {
  gap: 8,
},
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
recentMeta: {
  color: "#bbb",
  fontWeight: "700",
},
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
viewAllText: {
  color: "#fff",
  fontWeight: "800",
  fontSize: 12,
},


});
