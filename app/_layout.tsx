import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppSplash } from "@/components/ui/AppSplash"; // ✅ points to components/ui/AppSplash(.native/.web)

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {ready ? (
          <Stack screenOptions={{ headerShown: false }} />
        ) : (
          <AppSplash onFinished={() => setReady(true)} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
