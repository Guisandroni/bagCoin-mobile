import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "heroui-native";

type TabItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
};

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (key: string) => void;
}

const tabs: TabItem[] = [
  { key: "home", label: "Home", icon: "home-outline", iconFilled: "home" },
  { key: "expenses", label: "Despesas", icon: "wallet-outline", iconFilled: "wallet" },
  { key: "income", label: "Receitas", icon: "cash-outline", iconFilled: "cash" },
  { key: "reports", label: "Relatórios", icon: "bar-chart-outline", iconFilled: "bar-chart" },
  { key: "profile", label: "Perfil", icon: "person-outline", iconFilled: "person" },
];

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-white/40 dark:border-white/10 pb-8 pt-3">
      <View className="flex-row items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              className="items-center gap-0.5 relative"
            >
              <Ionicons
                name={isActive ? tab.iconFilled : tab.icon}
                size={24}
                color={isActive ? "#3b82f6" : "#9ca3af"}
              />
              <Text
                className={cn(
                  "text-[8px] font-bold uppercase tracking-widest",
                  isActive ? "text-blue-500" : "text-slate-400/60"
                )}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
