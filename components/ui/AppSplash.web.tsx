import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

export function AppSplash({ onFinished }: { onFinished: () => void }) {
  // Web: do nothing, proceed immediately
  useEffect(() => {
    onFinished();
  }, [onFinished]);

  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0B0B" },
});
