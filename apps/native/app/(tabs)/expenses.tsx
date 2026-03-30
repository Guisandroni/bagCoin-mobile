import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";

type CategoryKey =
  | "alimentacao"
  | "transporte"
  | "moradia"
  | "lazer"
  | "assinaturas";

const CATEGORIES: {
  id: CategoryKey;
  emoji: string;
  label: string;
  amount: string;
}[] = [
  { id: "alimentacao", emoji: "🍔", label: "Alimentação", amount: "R$ 890" },
  { id: "transporte", emoji: "🚗", label: "Transporte", amount: "R$ 520" },
  { id: "moradia", emoji: "🏠", label: "Moradia", amount: "R$ 1.200" },
  { id: "lazer", emoji: "🎬", label: "Lazer", amount: "R$ 340" },
  { id: "assinaturas", emoji: "📱", label: "Assinaturas", amount: "R$ 280" },
];

interface Transaction {
  account: string;
  amount: string;
  category: string;
  csv?: boolean;
  emoji: string;
  id: string;
  title: string;
}

interface TransactionGroup {
  headerOpacity: number;
  label: string;
  total: string;
  transactions: Transaction[];
}

const TRANSACTION_GROUPS: TransactionGroup[] = [
  {
    label: "Hoje — 27 Mar",
    total: "R$ 247,40",
    headerOpacity: 0.9,
    transactions: [
      {
        id: "e1",
        emoji: "🍔",
        title: "iFood",
        category: "Alimentação",
        account: "Nubank",
        amount: "-R$ 42,90",
      },
      {
        id: "e2",
        emoji: "⛽",
        title: "Posto Shell",
        category: "Combustível",
        account: "Bradesco",
        amount: "-R$ 180,00",
      },
      {
        id: "e3",
        emoji: "🚗",
        title: "Uber",
        category: "Transporte",
        account: "Nubank",
        amount: "-R$ 24,50",
      },
    ],
  },
  {
    label: "Ontem — 26 Mar",
    total: "R$ 436,10",
    headerOpacity: 0.6,
    transactions: [
      {
        id: "e4",
        emoji: "🛒",
        title: "Supermercado Extra",
        category: "Alimentação",
        account: "Santander",
        amount: "-R$ 312,40",
        csv: true,
      },
      {
        id: "e5",
        emoji: "📺",
        title: "Netflix",
        category: "Assinaturas",
        account: "Nubank",
        amount: "-R$ 55,90",
      },
      {
        id: "e6",
        emoji: "💊",
        title: "Farmácia",
        category: "Saúde",
        account: "Bradesco",
        amount: "-R$ 67,80",
      },
    ],
  },
];

const ExpenseTransactionItem = ({ tx }: { tx: Transaction }) => (
  <View
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
      <Text style={{ fontSize: 20 }}>{tx.emoji}</Text>
    </View>

    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: "#F1F5F9" }}>
          {tx.title}
        </Text>
        {tx.csv && (
          <View
            style={{
              backgroundColor: "rgba(173,198,255,0.2)",
              borderRadius: 9999,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "700", color: "#ADC6FF" }}>
              CSV
            </Text>
          </View>
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 2,
        }}
      >
        <Text style={{ fontSize: 12, color: "#C2C6D6" }}>{tx.category}</Text>
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#424754",
          }}
        />
        <Text style={{ fontSize: 12, color: "#C2C6D6" }}>{tx.account}</Text>
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
      {tx.amount}
    </Text>
  </View>
);

export default function ExpensesScreen() {
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey>("alimentacao");

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
        <Pressable>
          <Ionicons color="#94A3B8" name="chevron-back" size={20} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#F1F5F9" }}>
          Março 2026
        </Text>
        <Pressable>
          <Ionicons color="#94A3B8" name="chevron-forward" size={20} />
        </Pressable>
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
          R$ 3.750,00
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: "rgba(239,68,68,0.15)",
            borderRadius: 9999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            gap: 4,
            marginTop: 12,
          }}
        >
          <Ionicons color="#EF4444" name="trending-up" size={14} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#EF4444" }}>
            8% vs fev
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: isActive ? "#222A37" : "#131C28",
                borderRadius: 9999,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: isActive ? 2 : 0,
                borderBottomColor: "#EF4444",
              }}
            >
              <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: isActive ? "#F1F5F9" : "#C2C6D6",
                }}
              >
                {cat.label}
              </Text>
              <Text
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: isActive ? "rgba(241,245,249,0.6)" : "#C2C6D6",
                }}
              >
                {cat.amount}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {TRANSACTION_GROUPS.map((group) => (
        <View
          key={group.label}
          style={{ marginBottom: 16, paddingHorizontal: 24 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              opacity: group.headerOpacity,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#F1F5F9" }}>
              {group.label}
            </Text>
            <Text
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "#C2C6D6",
              }}
            >
              {group.total}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {group.transactions.map((tx) => (
              <ExpenseTransactionItem key={tx.id} tx={tx} />
            ))}
          </View>
        </View>
      ))}

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
