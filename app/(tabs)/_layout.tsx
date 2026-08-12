import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform } from "react-native";

import { rq } from "@/components/runquest/primitives";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: rq.teal,
        tabBarInactiveTintColor: rq.mist,
        headerShown: false,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: rq.midnight,
          borderTopColor: rq.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Quest",
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="explore" color={color} />,
        }}
      />
      <Tabs.Screen name="atlas" options={{ title: "Atlas", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="grid-view" color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="auto-graph" color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="history" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="tune" color={color} /> }} />
    </Tabs>
  );
}
