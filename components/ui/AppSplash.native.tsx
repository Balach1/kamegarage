import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import RpmSplashGauge from "./RpmSplashGauge";

type Props = { onFinished: () => void };

export function AppSplash({ onFinished }: Props) {
  const finishedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinished();
    }, 3500);

    return () => clearTimeout(t);
  }, [onFinished]);

  const done = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinished();
  };

  return (
    <View style={styles.root}>
      <RpmSplashGauge onFinished={done} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0B0B" },
});
