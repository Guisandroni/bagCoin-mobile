import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar, GlassCard } from "../ui";
import { cn } from "heroui-native";

interface ExpenseCategory {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  amount: number;
  budget?: number;
  transactionCount?: number;
  isFixed?: boolean;
}

interface ExpensesScreenProps {
  totalExpenses: number;
  percentageChange: number;
  categories: ExpenseCategory[];
  selectedPeriod: "monthly" | "custom";
  onPeriodChange?: (period: "monthly" | "custom") => void;
  onCategoryPress?: (id: number) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
}

export function ExpensesScreen({
  totalExpenses,
  percentageChange,
  categories,
  selectedPeriod,
  onPeriodChange,
  onCategoryPress,
  onAddPress,
  onBackPress,
}: ExpensesScreenProps) {
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalExpenses);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 pt-12 pb-2 border-b border-transparent">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={onBackPress} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </Pressable>
          <Text className="text-sm font-semibold tracking-tight">
            Análise de Agosto
          </Text>
          <Pressable className="p-2 -mr-2">
            <Ionicons name="ellipsis-horizontal" size={24} color="#1f2937" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2">
          <Pressable className="flex-1 py-2 items-center rounded-lg">
            <Text className="text-xs font-semibold text-slate-400">
              Receitas
            </Text>
          </Pressable>
          <Pressable className="flex-1 py-2 items-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
            <Text className="text-xs font-bold text-rose-500">Despesas</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pb-32">
        {/* Total */}
        <View className="mt-8 mb-10">
          <Text className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
            Gastos Atuais
          </Text>
          <Text className="text-5xl font-extrabold tracking-tighter text-rose-500">
            {formattedTotal}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-4">
            <Ionicons name="trending-up" size={14} color="#64748b" />
            <Text className="text-xs font-semibold text-slate-500">
              +{percentageChange}% vs mês anterior
            </Text>
          </View>
        </View>

        {/* Period Toggle */}
        <View className="flex-row p-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-10 max-w-[200px]">
          <Pressable
            onPress={() => onPeriodChange?.("monthly")}
            className={cn(
              "flex-1 py-1.5 items-center rounded-full",
              selectedPeriod === "monthly" && "bg-white dark:bg-slate-700 shadow-sm"
            )}
          >
            <Text
              className={cn(
                "text-xs font-bold",
                selectedPeriod === "monthly" ? "text-slate-900 dark:text-white" : "text-slate-400"
              )}
            >
              Mensal
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onPeriodChange?.("custom")}
            className={cn(
              "flex-1 py-1.5 items-center rounded-full",
              selectedPeriod === "custom" && "bg-white dark:bg-slate-700 shadow-sm"
            )}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                selectedPeriod === "custom" ? "text-slate-900 dark:text-white" : "text-slate-400"
              )}
            >
              Personalizado
            </Text>
          </Pressable>
        </View>

        {/* Categories Header */}
        <View className="flex-row items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Categorias
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
              Sincronizado
            </Text>
          </View>
        </View>

        {/* Categories List */}
        <View className="gap-8">
          {categories.map((category) => {
            const progress = category.budget
              ? (category.amount / category.budget) * 100
              : 0;
            const isOverBudget = progress > 100;
            const formattedAmount = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(category.amount);

            return (
              <Pressable
                key={category.id}
                onPress={() => onCategoryPress?.(category.id)}
                className="gap-3"
              >
                <View className="flex-row justify-between items-end">
                  <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 items-center justify-center">
                      <Ionicons name={category.icon} size={20} color="#374151" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                        {category.name}
                      </Text>
                      <Text className="text-[11px] text-slate-400">
                        {category.isFixed
                          ? "Despesa Fixa"
                          : `${category.transactionCount ?? 0} Transações`}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className={cn(
                        "text-sm font-bold",
                        isOverBudget ? "text-rose-500" : "text-slate-900 dark:text-white"
                      )}
                    >
                      {formattedAmount}
                    </Text>
                    {category.budget && (
                      <Text
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-tighter",
                          isOverBudget ? "text-rose-500/60" : "text-slate-400"
                        )}
                      >
                        {isOverBudget
                          ? "Acima do Limite"
                          : `Orçamento R$ ${(category.budget / 1000).toFixed(0)}k`}
                      </Text>
                    )}
                  </View>
                </View>
                <ProgressBar
                  progress={Math.min(progress, 100)}
                  color={isOverBudget ? "bg-rose-500" : "bg-slate-900 dark:bg-white"}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={onAddPress}
        className="absolute bottom-28 right-6 w-14 h-14 bg-slate-900 dark:bg-white rounded-full items-center justify-center shadow-2xl"
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}
