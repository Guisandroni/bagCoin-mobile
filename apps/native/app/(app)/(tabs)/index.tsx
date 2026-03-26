import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeHeader } from "@/components/home/home-header";
import { BalanceCard } from "@/components/home/balance-card";
import { SpendingChart } from "@/components/home/spending-chart";
import { QuickStatCard } from "@/components/home/quick-stat-card";
import { OpenFinanceCard } from "@/components/home/open-finance-card";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { Ionicons } from "@expo/vector-icons";

const RECENT_TRANSACTIONS = [
  {
    id: 1,
    title: "Café Expresso",
    subtitle: "HOJE • 08:45",
    amount: "-R$ 4,50",
    icon: "cafe-outline" as const,
    isIncome: false,
  },
  {
    id: 2,
    title: "Transporte",
    subtitle: "HOJE • 10:12",
    amount: "-R$ 12,80",
    icon: "car-outline" as const,
    isIncome: false,
  },
  {
    id: 3,
    title: "Depósito Salário",
    subtitle: "ONTEM • 17:00",
    amount: "+R$ 4.200,00",
    icon: "briefcase-outline" as const,
    isIncome: true,
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { data: session } = authClient.useSession();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      {/* Sticky Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          backgroundColor: "rgba(248, 249, 250, 0.85)",
          paddingTop: insets.top,
        }}
      >
        <HomeHeader
          userName={session?.user?.name ?? "Usuário"}
          userImage={session?.user?.image ?? undefined}
          onNotificationPress={() => router.push("/(app)/notifications")}
          onProfilePress={() => router.push("/(app)/(tabs)/profile")}
        />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingHorizontal: 24,
          paddingBottom: 120,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#94A3B8"
          />
        }
      >
        {/* ── Balance + Chart Section ── */}
        <View style={{ gap: 8 }}>
          <BalanceCard balance={12450} percentageChange={2.4} />
          <SpendingChart />
        </View>

        {/* ── Quick Stats ── */}
        <View style={{ flexDirection: "row", gap: 12 }}>
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

        {/* ── Open Finance ── */}
        <OpenFinanceCard
          integrationsCount={3}
          onPress={() => router.push("/(app)/linked-accounts")}
        />

        {/* ── Recent Activity ── */}
        <View style={{ gap: 10 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "800",
                color: "#0F172A",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Atividade Recente
            </Text>
            <Pressable>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Ver Tudo
              </Text>
            </Pressable>
          </View>

          {/* Transaction Items */}
          <View style={{ gap: 4 }}>
            {RECENT_TRANSACTIONS.map((tx) => (
              <Pressable
                key={tx.id}
                onPress={() => router.push(`/(app)/transaction/${tx.id}`)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                {/* Left */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: "white",
                      borderWidth: 1,
                      borderColor: "#F8FAFC",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                  >
                    <Ionicons name={tx.icon} size={18} color="#94A3B8" />
                  </View>

                  {/* Text */}
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#0F172A",
                      }}
                    >
                      {tx.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "500",
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginTop: 1,
                      }}
                    >
                      {tx.subtitle}
                    </Text>
                  </View>
                </View>

                {/* Amount */}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: tx.isIncome ? "#059669" : "#0F172A",
                    letterSpacing: -0.3,
                  }}
                >
                  {tx.amount}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(app)/new-transaction")}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: 100,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#0F172A",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 8,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Ionicons name="add" size={26} color="white" />
      </Pressable>
    </View>
  );
}
