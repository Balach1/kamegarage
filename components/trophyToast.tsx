import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function TrophyToast({
  trophy,
  onDone,
}: {
  trophy: { icon: string; title: string } | null;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(-90)).current;

  useEffect(() => {
    if (!trophy) return;

    Animated.timing(slide, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      Animated.timing(slide, {
        toValue: -90,
        duration: 240,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 2200);

    return () => clearTimeout(t);
  }, [trophy, onDone, slide]);

  if (!trophy) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { top: insets.top + 10 },
        { transform: [{ translateY: slide }] },
      ]}
    >
      <Text style={styles.toastIcon}>{trophy.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.toastTitle}>Trophy Unlocked</Text>
        <Text style={styles.toastSub}>{trophy.title}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastIcon: { fontSize: 22 },
  toastTitle: { color: "#fff", fontWeight: "900", fontSize: 12, opacity: 0.9 },
  toastSub: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
