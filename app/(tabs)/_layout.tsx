import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { getEarnedTrophyCount } from "@/lib/trophyCount";

export default function TabsLayout() {
  const pathname = usePathname();
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      const n = await getEarnedTrophyCount();
      if (alive) setEarnedCount(n);
    })();

    return () => {
      alive = false;
    };
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0f0f0f", borderTopColor: "#222" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Garage",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="garage" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="trophies"
        options={{
          title: "Trophies",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="service"
        options={{
          title: "Service",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#ff3b3b",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#0f0f0f",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
  },
});
