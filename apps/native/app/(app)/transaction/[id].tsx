import { router, useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { GlassCard } from "@/components/ui";

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock data - would be fetched from API
  const transaction = {
    id: Number(id),
    description: "Mercado Central",
    amount: 245.5,
    type: "expense" as const,
    category: "Alimentação",
    categoryIcon: "restaurant" as keyof typeof Ionicons.glyphMap,
    date: new Date(),
    account: "Nubank",
    notes: "Compras do mês",
  };

  const isExpense = transaction.type === "expense";
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(transaction.amount);

  const handleBackPress = () => {
    router.back();
  };

  const handleEdit = () => {
    // TODO: Navigate to edit screen
  };

  const handleDelete = () => {
    // TODO: Show delete confirmation
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <Pressable onPress={handleBackPress} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
          Detalhes
        </Text>
        <Pressable onPress={handleEdit} className="w-10 h-10 items-center justify-center">
          <Ionicons name="create-outline" size={24} color="#374151" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Amount */}
        <View className="items-center py-8">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: isExpense ? "#fee2e2" : "#d1fae5" }}
          >
            <Ionicons
              name={transaction.categoryIcon}
              size={32}
              color={isExpense ? "#ef4444" : "#10b981"}
            />
          </View>
          <Text
            className={`text-4xl font-extrabold ${isExpense ? "text-red-500" : "text-emerald-500"}`}
          >
            {isExpense ? "-" : "+"}{formattedAmount}
          </Text>
          <Text className="text-lg font-medium text-slate-900 dark:text-white mt-2">
            {transaction.description}
          </Text>
        </View>

        {/* Details */}
        <GlassCard className="p-4 gap-4">
          <View className="flex-row justify-between py-2">
            <Text className="text-slate-500">Categoria</Text>
            <View className="flex-row items-center gap-2">
              <Ionicons name={transaction.categoryIcon} size={16} color="#64748b" />
              <Text className="font-medium text-slate-900 dark:text-white">
                {transaction.category}
              </Text>
            </View>
          </View>

          <View className="h-px bg-slate-100 dark:bg-slate-800" />

          <View className="flex-row justify-between py-2">
            <Text className="text-slate-500">Data</Text>
            <Text className="font-medium text-slate-900 dark:text-white">
              {transaction.date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          <View className="h-px bg-slate-100 dark:bg-slate-800" />

          <View className="flex-row justify-between py-2">
            <Text className="text-slate-500">Conta</Text>
            <Text className="font-medium text-slate-900 dark:text-white">
              {transaction.account}
            </Text>
          </View>

          {transaction.notes && (
            <>
              <View className="h-px bg-slate-100 dark:bg-slate-800" />
              <View className="py-2">
                <Text className="text-slate-500 mb-2">Notas</Text>
                <Text className="text-slate-900 dark:text-white">{transaction.notes}</Text>
              </View>
            </>
          )}
        </GlassCard>

        {/* Delete Button */}
        <Pressable
          onPress={handleDelete}
          className="mt-8 py-4 items-center border border-red-100 dark:border-red-900 rounded-xl"
        >
          <Text className="text-red-500 font-medium">Excluir Transação</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
