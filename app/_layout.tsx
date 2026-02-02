import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TrophyToast } from "@/components/trophyToast";
import { AppSplash } from "@/components/ui/AppSplash"; // .native / .web auto
import { checkForNewTrophy } from "@/lib/trophyEngine";
import { onTrophyCheck } from "@/lib/trophyEvents";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ icon: string; title: string } | null>(null);

  // avoid stacking checks while one is already running / toast visible
  const checkingRef = useRef(false);

  async function runTrophyCheck() {
    if (checkingRef.current) return;
    if (toast) return;

    checkingRef.current = true;
    try {
      const newest = await checkForNewTrophy();
      if (newest) setToast({ icon: newest.icon, title: newest.title });
    } finally {
      checkingRef.current = false;
    }
  }

  useEffect(() => {
    const unsub = onTrophyCheck(() => {
      void runTrophyCheck();
    });

    // check once on mount (optional but nice)
    void runTrophyCheck();

    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Keep the router mounted always */}
        <Stack screenOptions={{ headerShown: false }} />

        {/* Splash as a full-screen overlay so app doesn't show behind */}
        {!ready ? (
          <View style={styles.splashOverlay} pointerEvents="auto">
            <AppSplash onFinished={() => setReady(true)} />
          </View>
        ) : null}

        {/* Toast always mounted */}
        <TrophyToast trophy={toast} onDone={() => setToast(null)} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Full screen overlay above the app
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999, // Android
    backgroundColor: "#0B0B0B", // match your splash bg to avoid flashes
  },
});
