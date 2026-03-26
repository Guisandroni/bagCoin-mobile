import { Tabs } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#3B82F6";
const INACTIVE_COLOR = "rgba(148, 163, 184, 0.7)";

type TabConfig = {
  name: string;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  {
    name: "index",
    label: "HOME",
    iconActive: "home",
    iconInactive: "home-outline",
  },
  {
    name: "expenses",
    label: "EXPENSES",
    iconActive: "wallet",
    iconInactive: "wallet-outline",
  },
  {
    name: "income",
    label: "INCOME",
    iconActive: "cash",
    iconInactive: "cash-outline",
  },
  {
    name: "reports",
    label: "REPORTS",
    iconActive: "bar-chart",
    iconInactive: "bar-chart-outline",
  },
  {
    name: "profile",
    label: "PROFILE",
    iconActive: "person",
    iconInactive: "person-outline",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        borderTopWidth: 0.5,
        borderTopColor: "rgba(255, 255, 255, 0.5)",
        paddingBottom: insets.bottom,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: 6,
        }}
      >
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: state.routes[index]?.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 2,
                paddingBottom: 4,
              }}
            >
              {/* Icon */}
              <Ionicons
                name={isFocused ? tab.iconActive : tab.iconInactive}
                size={24}
                color={color}
              />

              {/* Label */}
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: "700",
                  color,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                {tab.label}
              </Text>

              {/* Active dot */}
              {isFocused && (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: ACTIVE_COLOR,
                    shadowColor: ACTIVE_COLOR,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="expenses" />
      <Tabs.Screen name="income" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
