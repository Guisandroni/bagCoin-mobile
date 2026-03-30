import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";

type CategoryKey =
  | "salario"
  | "freelance"
  | "investimentos"
  | "vendas"
  | "aluguel";

const CATEGORY_TABS: { id: CategoryKey; label: string }[] = [
  { id: "salario", label: "Salário" },
  { id: "freelance", label: "Freelance" },
  { id: "investimentos", label: "Investimentos" },
  { id: "vendas", label: "Vendas" },
  { id: "aluguel", label: "Aluguel" },
];

interface Transaction {
  account: string;
  amount: string;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  title: string;
  type: string;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "i1",
    title: "Salário",
    icon: "wallet",
    account: "Santander",
    type: "Fixa",
    amount: "+R$ 4.500,00",
    date: "05 MAR",
  },
  {
    id: "i2",
    title: "Freelance UI",
    icon: "color-palette",
    account: "Bradesco",
    type: "Variável",
    amount: "+R$ 700,00",
    date: "12 MAR",
  },
  {
    id: "i3",
    title: "Dividendos FII",
    icon: "trending-up",
    account: "NuInvest",
    type: "Invest.",
    amount: "+R$ 125,40",
    date: "15 MAR",
  },
];

const IncomeTransactionItem = ({ tx }: { tx: Transaction }) => (
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
        borderRadius: 24,
        backgroundColor: "#2D3542",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      <Ionicons color="#10B981" name={tx.icon} size={22} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: "600", color: "#F1F5F9" }}>
        {tx.title}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 2,
        }}
      >
        <Text style={{ fontSize: 12, color: "rgba(194,198,214,0.6)" }}>
          {tx.account}
        </Text>
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#424754",
          }}
        />
        <Text style={{ fontSize: 12, color: "rgba(194,198,214,0.6)" }}>
          {tx.type}
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
        {tx.amount}
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
        {tx.date}
      </Text>
    </View>
  </View>
);

export default function IncomeScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("salario");

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
          R$ 5.200,00
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: "rgba(16,185,129,0.2)",
            borderRadius: 9999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            gap: 4,
            marginTop: 12,
          }}
        >
          <Ionicons color="#10B981" name="trending-up" size={14} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#10B981" }}>
            12% vs fev
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ gap: 20, paddingHorizontal: 24 }}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 24 }}
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveCategory(tab.id)}
              style={{
                paddingBottom: 8,
                borderBottomWidth: 2,
                borderBottomColor: isActive ? "#10B981" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: isActive ? "#F1F5F9" : "rgba(194,198,214,0.6)",
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
          {TRANSACTIONS.map((tx) => (
            <IncomeTransactionItem key={tx.id} tx={tx} />
          ))}
        </View>
      </View>

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
