import { usePathname } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { getEarnedTrophyCount } from "@/lib/trophyCount";

const BG = "#000000";

export default function TabsLayout() {
  const pathname = usePathname();
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web") {
      SystemUI.setBackgroundColorAsync(BG).catch(() => { });
    }
  }, []);

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
    <>
      <StatusBar style="light" />

      <NativeTabs
        backgroundColor={BG}
      >
        <NativeTabs.Trigger name="index">
          <Icon
            sf={{ default: "car", selected: "car.fill" }}
            drawable="ic_menu_home"
          />
          <Label>Garage</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="timeline">
          <Icon
            sf={{ default: "clock", selected: "clock.fill" }}
            drawable="ic_menu_recent_history"
          />
          <Label>Timeline</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="trophies">
          <Icon
            sf={{ default: "trophy", selected: "trophy.fill" }}
            drawable="ic_menu_myplaces"
          />
          <Label>Trophies</Label>

        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="service">
          <Icon
            sf={{ default: "wrench.and.screwdriver", selected: "wrench.and.screwdriver.fill" }}
            drawable="ic_menu_report_image"
          />
          <Label>Service</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
            drawable="ic_menu_more"
          />
          <Label>Settings</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
