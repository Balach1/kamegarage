import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  noTop?: boolean;
  noBottom?: boolean;
};

export function Screen({ children, style, noTop, noBottom }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: noTop ? 0 : insets.top,
          paddingBottom: noBottom ? 0 : insets.bottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 16,
  },
});
