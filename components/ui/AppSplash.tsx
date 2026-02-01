import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  onFinished: () => void;
};

export function AppSplash({ onFinished }: Props) {
  useEffect(() => {
    // Safety fallback: always continue immediately
    const t = setTimeout(onFinished, 50);
    return () => clearTimeout(t);
  }, [onFinished]);

  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
});
