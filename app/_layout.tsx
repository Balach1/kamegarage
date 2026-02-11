// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TrophyToast } from "@/components/trophyToast";
import { AppSplash } from "@/components/ui/AppSplash";
import { checkForNewTrophy } from "@/lib/trophyEngine";
import { onTrophyCheck } from "@/lib/trophyEvents";
import { KeyboardProvider, } from 'react-native-keyboard-controller';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ icon: string; title: string } | null>(null);

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

    void runTrophyCheck();

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.app}>
          {/* App always mounted */}
          <KeyboardProvider>

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />

              {/* Modals group */}
              <Stack.Screen
                name="(modals)/add-mod"
                options={{
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="(modals)/edit-mod"
                options={{
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="(modals)/edit-specs"
                options={{
                  presentation: "modal",
                }}
              />
            </Stack>
          </KeyboardProvider>

          {/* Splash OVERLAY (fixes half-height / showing app behind) */}
          {!ready ? (
            <View style={styles.splashOverlay} pointerEvents="auto">
              <AppSplash onFinished={() => setReady(true)} />
            </View>
          ) : null}

          {/* Toast always on top */}
          <TrophyToast trophy={toast} onDone={() => setToast(null)} />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  app: { flex: 1 },

  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999, // android
    backgroundColor: "#0B0B0B", // prevents “see-through” during load
  },
});
