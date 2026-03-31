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

function getCategoryIcon(name?: string): keyof typeof Ionicons.glyphMap {
  if (!name) {
    return "cash";
  }
  const lower = name.toLowerCase();
  if (lower.includes("salário") || lower.includes("salario")) {
    return "wallet";
  }
  if (lower.includes("freelance")) {
    return "color-palette";
  }
  if (lower.includes("invest") || lower.includes("divid")) {
    return "trending-up";
  }
  if (lower.includes("venda")) {
    return "pricetag";
  }
  if (lower.includes("aluguel")) {
    return "home";
  }
  return "cash";
}

export default function IncomeScreen() {
  const { data: txResult, isLoading } = useTransactions({
    type: "income",
    limit: 50,
  });
  const { data: categories } = useCategories("income");

  const transactions = txResult?.data ?? [];
  const totalIncome = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <Container>
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "600", color: "#F1F5F9" }}>
          Receitas
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: 24,
          marginBottom: 20,
          backgroundColor: "#222A37",
          borderRadius: 16,
          padding: 32,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(16,185,129,0.12)",
          }}
        />

        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "rgba(194,198,214,0.8)",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            marginBottom: 8,
          }}
        >
          Total de receitas
        </Text>
        <Text
          style={{
            fontFamily: "monospace",
            fontSize: 32,
            fontWeight: "700",
            color: "#F1F5F9",
          }}
        >
          {formatMoney(totalIncome)}
        </Text>
      </View>

      {categories && categories.length > 0 ? (
        <ScrollView
          contentContainerStyle={{ gap: 20, paddingHorizontal: 24 }}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 24 }}
        >
          {categories.map((cat) => (
            <View key={cat.id} style={{ paddingBottom: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#F1F5F9",
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
          <Ionicons color="#475569" name="wallet-outline" size={48} />
          <Text style={{ color: "#94A3B8", fontSize: 15, marginTop: 12 }}>
            Nenhuma receita registrada
          </Text>
        </View>
      ) : null}

      {!isLoading && transactions.length > 0 ? (
        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "rgba(194,198,214,0.4)",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            Este mês
          </Text>

          <View style={{ gap: 10 }}>
            {transactions.map((tx) => {
              const iconName = getCategoryIcon(
                tx.category?.name ?? tx.description
              );
              return (
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
                      borderRadius: 24,
                      backgroundColor: "#2D3542",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons color="#10B981" name={iconName} size={22} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
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
                      <Text
                        style={{ fontSize: 12, color: "rgba(194,198,214,0.6)" }}
                      >
                        {tx.bankAccount?.name ?? "Conta"}
                      </Text>
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "#424754",
                        }}
                      />
                      <Text
                        style={{ fontSize: 12, color: "rgba(194,198,214,0.6)" }}
                      >
                        {tx.category?.name ?? "Receita"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontFamily: "monospace",
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#10B981",
                      }}
                    >
                      +{formatMoney(tx.amount)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: "rgba(194,198,214,0.4)",
                        textTransform: "uppercase",
                        marginTop: 2,
                      }}
                    >
                      {new Date(tx.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ height: 96 }} />

      <Pressable
        onPress={() => router.push("/add-receipt")}
        style={{
          position: "absolute",
          bottom: 100,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#10B981",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#10B981",
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
