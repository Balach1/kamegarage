import { ReactNode, useMemo } from "react";
import { StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  noTop?: boolean;
  noBottom?: boolean;

  /**
   * If true, constrains content width on large screens (tablet / desktop).
   * Keeps UI from looking stretched.
   */
  constrain?: boolean;
};

export function Screen({
  children,
  style,
  noTop,
  noBottom,
  constrain = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSmall = width < 360;
  const isTablet = width >= 768;

  const paddingHorizontal = isTablet ? 24 : isSmall ? 14 : 16;

  // Optional: keep content from becoming too wide on tablets
  const contentMaxWidth = 720;

  const outerStyle = useMemo(
    () => [
      styles.root,
      {
        paddingTop: noTop ? 0 : insets.top,
        paddingBottom: noBottom ? 0 : insets.bottom,
        paddingHorizontal,
      },
      style,
    ],
    [insets.top, insets.bottom, noTop, noBottom, paddingHorizontal, style]
  );

  if (!constrain || !isTablet) {
    return <View style={outerStyle}>{children}</View>;
  }

  return (
    <View style={outerStyle}>
      <View style={[styles.constrain, { maxWidth: contentMaxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  constrain: {
    width: "100%",
    alignSelf: "center",
  },
});
