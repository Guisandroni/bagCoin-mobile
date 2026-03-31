import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Container } from "@/components/container";
import { useCategories, useTransactions } from "@/hooks/use-api";

const formatMoney = (value: number): string =>
  `R$ ${(value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getCategoryEmoji(name?: string): string {
  if (!name) {
    return "💰";
  }
  const lower = name.toLowerCase();
  if (lower.includes("aliment") || lower.includes("comida")) {
    return "🍔";
  }
  if (lower.includes("transport")) {
    return "🚗";
  }
  if (lower.includes("moradia") || lower.includes("aluguel")) {
    return "🏠";
  }
  if (lower.includes("lazer")) {
    return "🎬";
  }
  if (lower.includes("assinatur")) {
    return "📱";
  }
  if (lower.includes("saúde") || lower.includes("saude")) {
    return "💊";
  }
  if (lower.includes("combust") || lower.includes("gasolina")) {
    return "⛽";
  }
  if (lower.includes("supermerc")) {
    return "🛒";
  }
  if (lower.includes("educação") || lower.includes("educacao")) {
    return "📚";
  }
  return "💸";
}

export default function ExpensesScreen() {
  const { data: txResult, isLoading } = useTransactions({
    type: "expense",
    limit: 50,
  });
  const { data: categories } = useCategories("expense");

  const transactions = txResult?.data ?? [];

  const totalExpenses = transactions.reduce((s, t) => s + t.amount, 0);

  const grouped = transactions.reduce<Record<string, typeof transactions>>(
    (acc, tx) => {
      const dateKey = new Date(tx.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(tx);
      return acc;
    },
    {}
  );

  const now = new Date();
  const monthLabel = now.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Container>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "600", color: "#F1F5F9" }}>
          Despesas
        </Text>
        <Pressable
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(241,245,249,0.06)",
          }}
        >
          <Ionicons color="#94A3B8" name="options-outline" size={20} />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#F1F5F9",
            textTransform: "capitalize",
          }}
        >
          {monthLabel}
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: 24,
          marginBottom: 16,
          backgroundColor: "#1E2D3D",
          borderRadius: 16,
          padding: 24,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            opacity: 0.1,
          }}
        >
          <Ionicons color="#F1F5F9" name="wallet" size={60} />
        </View>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "#C2C6D6",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          Total de despesas
        </Text>
        <Text
          style={{
            fontFamily: "monospace",
            fontSize: 30,
            fontWeight: "600",
            color: "#F1F5F9",
          }}
        >
          {formatMoney(totalExpenses)}
        </Text>
      </View>

      {categories && categories.length > 0 ? (
        <ScrollView
          contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {categories.map((cat) => (
            <View
              key={cat.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#131C28",
                borderRadius: 9999,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 14 }}>{getCategoryEmoji(cat.name)}</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#C2C6D6",
                }}
              >
                {cat.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color="#ADC6FF" size="large" />
        </View>
      ) : null}

      {!isLoading && transactions.length === 0 ? (
        <View
          style={{
            paddingHorizontal: 24,
            alignItems: "center",
            paddingTop: 40,
          }}
        >
          <Ionicons color="#475569" name="receipt-outline" size={48} />
          <Text style={{ color: "#94A3B8", fontSize: 15, marginTop: 12 }}>
            Nenhuma despesa registrada
          </Text>
        </View>
      ) : null}

      {!isLoading && transactions.length > 0
        ? Object.entries(grouped).map(([date, txs]) => {
            const dayTotal = txs.reduce((s, t) => s + t.amount, 0);
            return (
              <View
                key={date}
                style={{ marginBottom: 16, paddingHorizontal: 24 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#F1F5F9",
                    }}
                  >
                    {date}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#C2C6D6",
                    }}
                  >
                    {formatMoney(dayTotal)}
                  </Text>
                </View>

                <View style={{ gap: 10 }}>
                  {txs.map((tx) => (
                    <View
                      key={tx.id}
                      style={{
                        backgroundColor: "#131C28",
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          backgroundColor: "#2D3542",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>
                          {getCategoryEmoji(tx.category?.name)}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "500",
                            color: "#F1F5F9",
                          }}
                        >
                          {tx.description}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: "#C2C6D6" }}>
                            {tx.category?.name ?? "Despesa"}
                          </Text>
                          {tx.bankAccount ? (
                            <>
                              <View
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: "#424754",
                                }}
                              />
                              <Text style={{ fontSize: 12, color: "#C2C6D6" }}>
                                {tx.bankAccount.name}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>

                      <Text
                        style={{
                          fontFamily: "monospace",
                          fontSize: 15,
                          fontWeight: "500",
                          color: "#F1F5F9",
                        }}
                      >
                        -{formatMoney(tx.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        : null}

      <View style={{ height: 96 }} />

      <Pressable
        onPress={() => router.push("/add-expense")}
        style={{
          position: "absolute",
          bottom: 100,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: "#EF4444",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#EF4444",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons color="#FFFFFF" name="add" size={28} />
      </Pressable>
    </Container>
  );
}
