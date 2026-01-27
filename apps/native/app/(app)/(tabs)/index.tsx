import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeHeader, BalanceCard, QuickStatCard, OpenFinanceCard } from "@/components/home";
import { TransactionList } from "@/components/transactions";
import { GlassCard } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { trpc, queryClient } from "@/utils/trpc";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { data: session } = authClient.useSession();

  // Mock data for demonstration
  const mockTransactions = [
    {
      id: 1,
      description: "Café Expresso",
      amount: 4.5,
      type: "expense" as const,
      date: new Date(),
      categoryIcon: "cafe" as const,
    },
    {
      id: 2,
      description: "Uber",
      amount: 12.8,
      type: "expense" as const,
      date: new Date(),
      categoryIcon: "car" as const,
    },
    {
      id: 3,
      description: "Salário",
      amount: 4200,
      type: "income" as const,
      date: new Date(Date.now() - 86400000),
      categoryIcon: "briefcase" as const,
    },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, []);

  const handleNotificationPress = () => {
    // TODO: Navigate to notifications
  };

  const handleProfilePress = () => {
    router.push("/(app)/(tabs)/profile");
  };

  const handleOpenFinancePress = () => {
    router.push("/(app)/linked-accounts");
  };

  const handleTransactionPress = (id: number) => {
    router.push(`/(app)/transaction/${id}`);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <HomeHeader
          userName={session?.user?.name ?? "Usuário"}
          userImage={session?.user?.image ?? undefined}
          onNotificationPress={handleNotificationPress}
          onProfilePress={handleProfilePress}
        />

        {/* Main Content */}
        <View className="px-6 py-2 gap-4">
          {/* Balance Section */}
          <View className="gap-2">
            <BalanceCard balance={12450} percentageChange={2.4} />

            {/* Chart Card */}
            <GlassCard className="h-16 relative overflow-hidden">
              <View className="absolute inset-0 items-center justify-center">
                {/* Simplified chart representation */}
                <View className="w-full h-10 flex-row items-end justify-between px-4">
                  {[40, 60, 30, 80, 50, 70, 45].map((height, index) => (
                    <View
                      key={index}
                      className="w-1 bg-slate-300 dark:bg-slate-600 rounded-full"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Quick Stats */}
          <View className="flex-row gap-3">
            <QuickStatCard
              title="Gasto Hoje"
              label="Diário"
              value="R$ 45,00"
              progress={75}
              icon="calendar-outline"
            />
            <QuickStatCard
              title="Utilizado"
              label="Orçamento"
              value="70%"
              progress={70}
              icon="pie-chart-outline"
            />
          </View>

          {/* Open Finance Card */}
          <OpenFinanceCard
            integrationsCount={3}
            onPress={handleOpenFinancePress}
          />

          {/* Recent Activity */}
          <TransactionList
            transactions={mockTransactions}
            onTransactionPress={handleTransactionPress}
            headerTitle="Atividade Recente"
          />
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(app)/new-transaction")}
        className="absolute bottom-24 right-6 w-14 h-14 bg-slate-900 dark:bg-white rounded-full items-center justify-center shadow-2xl"
        style={{ elevation: 8 }}
      >
        <View className="w-6 h-0.5 bg-white dark:bg-slate-900 absolute" />
        <View className="w-0.5 h-6 bg-white dark:bg-slate-900 absolute" />
      </Pressable>
    </View>
  );
}
