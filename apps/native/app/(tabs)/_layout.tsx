import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0B1420",
          ...(Platform.OS === "ios" && { shadowColor: "transparent" }),
          ...(Platform.OS === "android" && { elevation: 0 }),
        },
        headerTintColor: "#F1F5F9",
        headerTitleStyle: {
          color: "#F1F5F9",
          fontWeight: "700",
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: "#0B1420",
          borderTopColor: "rgba(66,71,84,0.15)",
          borderTopWidth: 0.5,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#ADC6FF",
        tabBarInactiveTintColor: "rgba(241,245,249,0.4)",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="home" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="arrow-down-circle" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="arrow-up-circle" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="pie-chart" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="person-circle" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
