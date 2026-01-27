import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "../ui";

interface ChartCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface InsightCard {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface BreakdownItem {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  amount: number;
  transactionCount: number;
  percentageChange: number;
}

interface ReportsScreenProps {
  totalSpend: number;
  percentageDecrease: number;
  selectedPeriod: "daily" | "weekly" | "monthly";
  categories: ChartCategory[];
  insights: InsightCard[];
  breakdown: BreakdownItem[];
  onPeriodChange?: (period: "daily" | "weekly" | "monthly") => void;
  onBackPress?: () => void;
  onAddPress?: () => void;
}

export function ReportsScreen({
  totalSpend,
  percentageDecrease,
  selectedPeriod,
  categories,
  insights,
  breakdown,
  onPeriodChange,
  onBackPress,
  onAddPress,
}: ReportsScreenProps) {
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalSpend);

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-6 border-b border-transparent">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBackPress} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            Insights Financeiros
          </Text>
          <Pressable className="p-2 -mr-2">
            <Ionicons name="calendar" size={20} color="#374151" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Period Tabs */}
        <View className="px-6 mt-4">
          <View className="flex-row gap-8 border-b border-slate-100 dark:border-slate-800">
            {(["daily", "weekly", "monthly"] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => onPeriodChange?.(period)}
                className={`pb-3 ${selectedPeriod === period ? "border-b-2 border-slate-900 dark:border-white" : ""}`}
              >
                <Text
                  className={`text-sm ${
                    selectedPeriod === period
                      ? "font-semibold text-slate-900 dark:text-white"
                      : "font-medium text-slate-400"
                  }`}
                >
                  {period === "daily" ? "Diário" : period === "weekly" ? "Semanal" : "Mensal"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Total Spend */}
        <View className="mt-12 items-center px-6">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            Gasto Mensal Total
          </Text>
          <Text className="text-5xl font-light tracking-tight text-slate-900 dark:text-white">
            {formattedTotal}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-4">
            <Text className="text-xs font-medium text-slate-500">Reduziu em</Text>
            <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-slate-900 dark:text-white">
                {percentageDecrease}%
              </Text>
            </View>
          </View>
        </View>

        {/* Donut Chart Placeholder */}
        <View className="mt-16 items-center px-6">
          <View className="relative w-56 h-56 items-center justify-center">
            {/* Simplified donut representation */}
            <View className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700" />
            <View className="absolute inset-[3px] rounded-full bg-white dark:bg-slate-900 items-center justify-center">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {categories[0]?.name}
              </Text>
              <Text className="text-2xl font-light text-slate-900 dark:text-white">
                {categories[0]?.percentage}%
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View className="flex-row flex-wrap justify-center gap-x-8 gap-y-6 mt-12">
            {categories.map((category, index) => {
              const formattedAmount = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(category.amount);

              return (
                <View key={index} className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {category.name}
                    </Text>
                  </View>
                  <Text className="text-base font-medium text-slate-900 dark:text-white">
                    {formattedAmount}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Insights */}
        <View className="mt-20 -mx-6">
          <View className="flex-row items-center justify-between px-6 mb-6">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Principais Insights
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          >
            {insights.map((insight) => (
              <View
                key={insight.id}
                className="min-w-[260px] p-6 rounded-3xl"
                style={{ backgroundColor: insight.bgColor }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-4"
                  style={{ backgroundColor: `${insight.color}30` }}
                >
                  <Ionicons name={insight.icon} size={20} color={insight.color} />
                </View>
                <Text
                  className="text-sm font-semibold mb-2"
                  style={{ color: insight.color }}
                >
                  {insight.title}
                </Text>
                <Text className="text-xs leading-relaxed" style={{ color: `${insight.color}99` }}>
                  {insight.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Detailed Breakdown */}
        <View className="mt-16 mb-20 px-6">
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            Detalhamento
          </Text>
          <View className="gap-8">
            {breakdown.map((item) => {
              const formattedAmount = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.amount);

              return (
                <View key={item.id} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                      <Ionicons name={item.icon} size={18} color="#9ca3af" />
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </Text>
                      <Text className="text-[10px] text-slate-400">
                        {item.transactionCount} Transações
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formattedAmount}
                    </Text>
                    <Text
                      className={`text-[10px] ${
                        item.percentageChange > 0 ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {item.percentageChange > 0 ? "+" : ""}
                      {item.percentageChange}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={onAddPress}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-900 dark:bg-white rounded-full items-center justify-center shadow-2xl"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>
    </View>
  );
}
