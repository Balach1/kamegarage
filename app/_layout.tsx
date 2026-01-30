import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TrophyToast } from "@/components/trophyToast";
import { checkForNewTrophy } from "@/lib/trophyEngine";
import { onTrophyCheck } from "@/lib/trophyEvents";

export default function RootLayout() {
  const [toast, setToast] = useState<{ icon: string; title: string } | null>(null);

  useEffect(() => {
    let alive = true;

    const unsub = onTrophyCheck(() => {
      void (async () => {
        if (!alive) return;
        if (toast) return; // don't stack toasts

        const newest = await checkForNewTrophy();
        if (!alive) return;

        if (newest) setToast({ icon: newest.icon, title: newest.title });
      })();
    });

    return () => {
      alive = false;
      unsub();
    };
  }, [toast]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        <TrophyToast trophy={toast} onDone={() => setToast(null)} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
