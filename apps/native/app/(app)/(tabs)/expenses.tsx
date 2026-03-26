import { useState } from "react";
import { router } from "expo-router";
import { View } from "react-native";

import { ExpensesScreen } from "@/components/screens";

export default function ExpensesTab() {
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "custom">(
    "monthly",
  );

  // Mock data
  const mockCategories = [
    {
      id: 1,
      name: "Moradia & Aluguel",
      icon: "home" as const,
      amount: 2200,
      budget: 2000,
      isFixed: true,
    },
    {
      id: 2,
      name: "Alimentação",
      icon: "restaurant" as const,
      amount: 842.1,
      budget: 1000,
      transactionCount: 14,
    },
    {
      id: 3,
      name: "Transporte",
      icon: "car" as const,
      amount: 320.35,
      budget: 700,
      transactionCount: 8,
    },
    {
      id: 4,
      name: "Entretenimento",
      icon: "game-controller" as const,
      amount: 120,
      budget: 400,
      transactionCount: 5,
    },
    {
      id: 5,
      name: "Compras",
      icon: "cart" as const,
      amount: 0,
      budget: 500,
      transactionCount: 0,
    },
  ];

  const handleCategoryPress = (id: number) => {
    router.push(`/(app)/category/${id}`);
  };

  const handleAddPress = () => {
    router.push("/(app)/new-transaction?type=expense");
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpensesScreen
        totalExpenses={4892.45}
        percentageChange={12.4}
        categories={mockCategories}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onCategoryPress={handleCategoryPress}
        onAddPress={handleAddPress}
      />
    </View>
  );
}
