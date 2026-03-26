import { useState } from "react";
import { router } from "expo-router";
import { View } from "react-native";

import { ReportsScreen } from "@/components/screens";

export default function ReportsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("monthly");

  // Mock data
  const mockCategories = [
    { name: "Moradia", amount: 1207.5, percentage: 35, color: "#2d3436" },
    { name: "Alimentação", amount: 862.15, percentage: 25, color: "#636e72" },
    { name: "Utilidades", amount: 690, percentage: 20, color: "#b2bec3" },
    { name: "Outros", amount: 690.35, percentage: 20, color: "#dfe6e9" },
  ];

  const mockInsights = [
    {
      id: 1,
      title: "Aumento de Eficiência",
      description:
        "Reduzir gastos com alimentação em 10% pode adicionar R$ 86,20 à sua meta de economia mensal.",
      icon: "bulb" as const,
      color: "#0d9488",
      bgColor: "#f0fdfa",
    },
    {
      id: 2,
      title: "Alerta de Assinatura",
      description:
        "Encontramos 2 transações duplicadas na categoria 'Utilidades' da semana passada.",
      icon: "card" as const,
      color: "#7c3aed",
      bgColor: "#f5f3ff",
    },
    {
      id: 3,
      title: "Potencial de Economia",
      description:
        "Sua trajetória atual sugere que você vai superar sua meta de economia em 14%.",
      icon: "trending-up" as const,
      color: "#ea580c",
      bgColor: "#fff7ed",
    },
  ];

  const mockBreakdown = [
    {
      id: 1,
      name: "Moradia",
      icon: "home" as const,
      amount: 1207.5,
      transactionCount: 12,
      percentageChange: 2.4,
    },
    {
      id: 2,
      name: "Alimentação",
      icon: "restaurant" as const,
      amount: 862.15,
      transactionCount: 45,
      percentageChange: -15.2,
    },
  ];

  const handleAddPress = () => {
    router.push("/(app)/new-transaction");
  };

  return (
    <View style={{ flex: 1 }}>
      <ReportsScreen
        totalSpend={3450}
        percentageDecrease={12}
        selectedPeriod={selectedPeriod}
        categories={mockCategories}
        insights={mockInsights}
        breakdown={mockBreakdown}
        onPeriodChange={setSelectedPeriod}
        onAddPress={handleAddPress}
      />
    </View>
  );
}
