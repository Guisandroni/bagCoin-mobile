import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Transaction {
  account: string;
  amount: string;
  category: string;
  iconBg: string;
  iconColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  id: string;
  isIncome: boolean;
  title: string;
}

interface TransactionGroup {
  date: string;
  transactions: Transaction[];
}

const TRANSACTION_GROUPS: TransactionGroup[] = [
  {
    date: "27 de Março",
    transactions: [
      {
        id: "1",
        title: "iFood",
        category: "Alimentação",
        account: "Nubank",
        iconName: "restaurant",
        iconBg: "rgba(239,68,68,0.15)",
        iconColor: "#EF4444",
        amount: "R$ 42,90",
        isIncome: false,
      },
      {
        id: "2",
        title: "Uber",
        category: "Transporte",
        account: "Nubank",
        iconName: "car",
        iconBg: "rgba(173,198,255,0.15)",
        iconColor: "#ADC6FF",
        amount: "R$ 24,50",
        isIncome: false,
      },
    ],
  },
  {
    date: "25 de Março",
    transactions: [
      {
        id: "3",
        title: "Salário",
        category: "Salário",
        account: "Santander",
        iconName: "wallet",
        iconBg: "rgba(212,168,71,0.15)",
        iconColor: "#D4A847",
        amount: "R$ 4.500,00",
        isIncome: true,
      },
      {
        id: "4",
        title: "Netflix",
        category: "Assinaturas",
        account: "Nubank",
        iconName: "tv",
        iconBg: "rgba(167,139,250,0.15)",
        iconColor: "#A78BFA",
        amount: "R$ 55,90",
        isIncome: false,
      },
    ],
  },
  {
    date: "20 de Março",
    transactions: [
      {
        id: "5",
        title: "Freelance",
        category: "Freelance",
        account: "Bradesco",
        iconName: "briefcase",
        iconBg: "rgba(212,168,71,0.15)",
        iconColor: "#D4A847",
        amount: "R$ 700,00",
        isIncome: true,
      },
    ],
  },
];

const TransactionItem = ({ item }: { item: Transaction }) => (
  <View
    style={{
      backgroundColor: "#17202D",
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: item.iconBg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      <Ionicons color={item.iconColor} name={item.iconName} size={22} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#F1F5F9", fontWeight: "600", fontSize: 15 }}>
        {item.title}
      </Text>
      <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>
        {item.category} • {item.account}
      </Text>
    </View>
    <Text
      style={{
        fontFamily: "monospace",
        fontSize: 15,
        fontWeight: "700",
        color: item.isIncome ? "#10B981" : "#EF4444",
      }}
    >
      {item.isIncome ? "+" : "-"} {item.amount}
    </Text>
  </View>
);

const StatementScreen = () => {
  const [period] = useState("Março 2026");

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1420" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 24,
            }}
          >
            <Pressable
              hitSlop={8}
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons color="#F1F5F9" name="arrow-back" size={24} />
            </Pressable>
            <Text
              style={{
                color: "#F1F5F9",
                fontWeight: "700",
                fontSize: 20,
                fontStyle: "italic",
              }}
            >
              Extrato Completo
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <Pressable hitSlop={8}>
                <Ionicons color="#F1F5F9" name="search" size={22} />
              </Pressable>
              <Pressable hitSlop={8}>
                <Ionicons color="#F1F5F9" name="filter" size={22} />
              </Pressable>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View
              style={{
                backgroundColor: "#222A37",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Pressable hitSlop={8}>
                <Ionicons color="#F1F5F9" name="chevron-back" size={22} />
              </Pressable>
              <Text
                style={{ color: "#F1F5F9", fontWeight: "600", fontSize: 16 }}
              >
                {period}
              </Text>
              <Pressable hitSlop={8}>
                <Ionicons color="#F1F5F9" name="chevron-forward" size={22} />
              </Pressable>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: "#222A37",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 12,
                  fontWeight: "500",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                SALDO DO MÊS
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: "monospace",
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#94A3B8",
                  }}
                >
                  R${" "}
                </Text>
                <Text
                  style={{
                    fontFamily: "monospace",
                    fontSize: 32,
                    fontWeight: "700",
                    color: "#F1F5F9",
                  }}
                >
                  5.101,20
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "monospace",
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#10B981",
                  }}
                >
                  + R$ 5.200,00
                </Text>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: "#EF4444",
                  }}
                />
                <Text
                  style={{
                    fontFamily: "monospace",
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#EF4444",
                  }}
                >
                  - R$ 98,80
                </Text>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 24 }}>
            {TRANSACTION_GROUPS.map((group) => (
              <View key={group.date}>
                <Text
                  style={{
                    color: "#F1F5F9",
                    fontWeight: "600",
                    fontSize: 16,
                    marginBottom: 12,
                  }}
                >
                  {group.date}
                </Text>
                <View style={{ gap: 8 }}>
                  {group.transactions.map((tx) => (
                    <TransactionItem item={tx} key={tx.id} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default StatementScreen;
