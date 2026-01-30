import { Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { TrophyToast } from "@/components/trophyToast";
import { checkForNewTrophy } from "@/lib/trophyEngine";

export default function RootLayout() {
  const pathname = usePathname();
  const [toast, setToast] = useState<{ icon: string; title: string } | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (toast) return;

      const newest = await checkForNewTrophy();
      if (!alive) return;

      if (newest) setToast({ icon: newest.icon, title: newest.title });
    })();

    return () => {
      alive = false;
    };
  }, [pathname, toast]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
      <TrophyToast trophy={toast} onDone={() => setToast(null)} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
