import { router, useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { GlassCard, ProgressBar } from "@/components/ui";
import { TransactionList } from "@/components/transactions";

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock data
  const category = {
    id: Number(id),
    name: "Alimentação",
    icon: "restaurant" as keyof typeof Ionicons.glyphMap,
    color: "#ef4444",
    budget: 1000,
    spent: 842.1,
    transactionCount: 14,
  };

  const transactions = [
    { id: 1, description: "Restaurante Japonês", amount: 89.9, type: "expense" as const, date: new Date(), categoryIcon: "restaurant" as const },
    { id: 2, description: "Supermercado", amount: 245.5, type: "expense" as const, date: new Date(Date.now() - 86400000), categoryIcon: "cart" as const },
    { id: 3, description: "Padaria", amount: 32.0, type: "expense" as const, date: new Date(Date.now() - 172800000), categoryIcon: "cafe" as const },
  ];

  const progress = (category.spent / category.budget) * 100;
  const remaining = category.budget - category.spent;
  const formattedSpent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(category.spent);
  const formattedBudget = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(category.budget);
  const formattedRemaining = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(remaining);

  const handleBackPress = () => {
    router.back();
  };

  const handleTransactionPress = (transactionId: number) => {
    router.push(`/(app)/transaction/${transactionId}`);
  };

  const handleEditBudget = () => {
    // TODO: Open budget edit modal
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <Pressable onPress={handleBackPress} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
          {category.name}
        </Text>
        <Pressable onPress={handleEditBudget} className="w-10 h-10 items-center justify-center">
          <Ionicons name="settings-outline" size={24} color="#374151" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Category Header */}
        <View className="items-center py-6">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Ionicons name={category.icon} size={32} color={category.color} />
          </View>
          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {formattedSpent}
          </Text>
          <Text className="text-slate-400 text-sm mt-1">
            de {formattedBudget} orçamento
          </Text>
        </View>

        {/* Progress Card */}
        <GlassCard className="p-4 mb-6">
          <View className="flex-row justify-between mb-3">
            <Text className="text-slate-500">Progresso do Orçamento</Text>
            <Text className="font-bold" style={{ color: progress > 100 ? "#ef4444" : "#10b981" }}>
              {progress.toFixed(0)}%
            </Text>
          </View>
          <ProgressBar
            progress={Math.min(progress, 100)}
            color={progress > 100 ? "bg-red-500" : "bg-emerald-500"}
          />
          <View className="flex-row justify-between mt-3">
            <Text className="text-xs text-slate-400">
              {category.transactionCount} transações
            </Text>
            <Text className="text-xs font-medium" style={{ color: remaining >= 0 ? "#10b981" : "#ef4444" }}>
              {remaining >= 0 ? `${formattedRemaining} restante` : `${formattedRemaining} acima`}
            </Text>
          </View>
        </GlassCard>

        {/* Transactions */}
        <TransactionList
          transactions={transactions}
          onTransactionPress={handleTransactionPress}
          headerTitle="Transações Recentes"
        />
      </ScrollView>
    </View>
  );
}
