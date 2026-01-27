import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";

import { IncomeScreen } from "@/components/screens";

export default function IncomeTab() {
  const insets = useSafeAreaInsets();

  // Mock data
  const mockIncomeSources = [
    {
      id: 1,
      name: "Salário",
      icon: "cash" as const,
      amount: 8500,
      type: "monthly" as const,
      color: "#10b981",
    },
    {
      id: 2,
      name: "Freelance",
      icon: "sparkles" as const,
      amount: 3200,
      type: "active" as const,
      color: "#3b82f6",
    },
    {
      id: 3,
      name: "Dividendos",
      icon: "trending-up" as const,
      amount: 750,
      type: "yield" as const,
      color: "#f59e0b",
    },
  ];

  const mockRecentInflows = [
    {
      id: 1,
      title: "Pagamento Merchant",
      subtitle: "Hoje • #20492",
      amount: 1240,
      isNew: true,
    },
    {
      id: 2,
      title: "Salário Mensal",
      subtitle: "Ontem • Salário",
      amount: 4250,
    },
    {
      id: 3,
      title: "Crédito Dividendos",
      subtitle: "2 dias atrás • Inv",
      amount: 340.5,
    },
  ];

  const handleAddPress = () => {
    router.push("/(app)/new-transaction?type=income");
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <IncomeScreen
        totalIncome={12450}
        percentageChange={14.2}
        monthlyGoal={15000}
        incomeSources={mockIncomeSources}
        recentInflows={mockRecentInflows}
        onAddPress={handleAddPress}
      />
    </View>
  );
}
