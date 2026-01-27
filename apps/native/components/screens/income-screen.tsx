import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard, ProgressBar } from "../ui";

interface IncomeSource {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  amount: number;
  type: "monthly" | "active" | "yield";
  color: string;
}

interface RecentInflow {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
  isNew?: boolean;
  imageUrl?: string;
}

interface IncomeScreenProps {
  totalIncome: number;
  percentageChange: number;
  monthlyGoal: number;
  incomeSources: IncomeSource[];
  recentInflows: RecentInflow[];
  onAddPress?: () => void;
  onBackPress?: () => void;
}

export function IncomeScreen({
  totalIncome,
  percentageChange,
  monthlyGoal,
  incomeSources,
  recentInflows,
  onAddPress,
  onBackPress,
}: IncomeScreenProps) {
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalIncome);

  const formattedGoal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(monthlyGoal);

  const goalProgress = (totalIncome / monthlyGoal) * 100;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 py-3 flex-row items-center justify-between border-b border-slate-100 dark:border-white/5">
        <Pressable onPress={onBackPress}>
          <Ionicons name="chevron-back" size={24} color="#94a3b8" />
        </Pressable>
        <Text className="text-sm font-bold tracking-tight uppercase text-slate-500 dark:text-slate-400">
          Visão de Receitas
        </Text>
        <Pressable className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 items-center justify-center">
          <Ionicons name="eye" size={20} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Toggle */}
        <View className="px-6 pt-6">
          <View className="flex-row p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10">
            <Pressable className="flex-1 py-2 px-4 bg-white dark:bg-white/10 rounded-lg shadow-sm items-center">
              <Text className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Receitas
              </Text>
            </Pressable>
            <Pressable className="flex-1 py-2 px-4 items-center">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Despesas
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Total Revenue */}
        <View className="px-6 pt-8 pb-8 items-center">
          <View className="px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/10 mb-6">
            <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Receita Total • {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </Text>
          </View>
          <Text className="text-6xl font-extrabold tracking-tighter text-emerald-500">
            {formattedTotal.split(",")[0]}
            <Text className="text-3xl opacity-50">,{formattedTotal.split(",")[1]}</Text>
          </Text>
          <View className="flex-row items-center gap-2 mt-4">
            <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Ionicons name="trending-up" size={14} color="#10b981" />
              <Text className="text-emerald-500 text-xs font-bold">
                +{percentageChange}%
              </Text>
            </View>
            <Text className="text-slate-400 text-xs font-medium">
              em relação ao mês anterior
            </Text>
          </View>
        </View>

        {/* Monthly Goal */}
        <View className="px-6 py-4">
          <GlassCard className="p-5">
            <View className="flex-row justify-between items-end mb-4">
              <View>
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest mb-1">
                  Meta Mensal
                </Text>
                <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formattedTotal}{" "}
                  <Text className="text-slate-400 font-normal">/ {formattedGoal}</Text>
                </Text>
              </View>
              <Text className="text-emerald-500 font-bold text-sm">
                {goalProgress.toFixed(0)}%
              </Text>
            </View>
            <ProgressBar progress={goalProgress} color="bg-emerald-500" />
          </GlassCard>
        </View>

        {/* Income Sources */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-sm font-bold tracking-tight uppercase text-slate-400">
              Fontes de Receita
            </Text>
            <Text className="text-emerald-500 text-xs font-bold">Detalhes</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          >
            {incomeSources.map((source) => {
              const formattedAmount = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(source.amount);

              return (
                <GlassCard key={source.id} className="min-w-[130px] p-4 gap-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${source.color}20` }}
                  >
                    <Ionicons name={source.icon} size={20} color={source.color} />
                  </View>
                  <View>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">
                      {source.name}
                    </Text>
                    <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {formattedAmount}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-0.5 rounded-md self-start"
                    style={{ backgroundColor: `${source.color}20` }}
                  >
                    <Text
                      className="text-[9px] font-bold uppercase"
                      style={{ color: source.color }}
                    >
                      {source.type === "monthly" ? "Mensal" : source.type === "active" ? "Ativo" : "Rendimento"}
                    </Text>
                  </View>
                </GlassCard>
              );
            })}
          </ScrollView>
        </View>

        {/* Recent Inflows */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-sm font-bold tracking-tight uppercase text-slate-400">
              Entradas Recentes
            </Text>
            <View className="flex-row items-center gap-1 text-slate-300">
              <Ionicons name="cloud-done" size={14} color="#d1d5db" />
              <Text className="text-[10px] font-bold uppercase text-slate-300">
                Ao Vivo
              </Text>
            </View>
          </View>
          <View className="gap-2">
            {recentInflows.map((inflow) => {
              const formattedAmount = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(inflow.amount);

              return (
                <GlassCard key={inflow.id} className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5">
                      <Ionicons name="cash" size={20} color="#10b981" />
                    </View>
                    <View>
                      <Text className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {inflow.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                        {inflow.subtitle}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-emerald-500 font-bold text-sm">
                      +{formattedAmount}
                    </Text>
                    {inflow.isNew && (
                      <Text className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Novo
                      </Text>
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Add Button */}
      <Pressable
        onPress={onAddPress}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}
