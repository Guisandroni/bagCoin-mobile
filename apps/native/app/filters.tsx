import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Period = "today" | "yesterday" | "7days" | "month";
type TransactionFilter = "all" | "expenses" | "income";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "7days", label: "Últimos 7 dias" },
  { id: "month", label: "Este mês" },
];

const CATEGORIES: {
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  label: string;
}[] = [
  { id: "food", label: "Alimentação", icon: "restaurant" },
  { id: "transport", label: "Transporte", icon: "car" },
  { id: "housing", label: "Moradia", icon: "home" },
  { id: "leisure", label: "Lazer", icon: "sparkles" },
  { id: "health", label: "Saúde", icon: "medkit" },
  { id: "shopping", label: "Compras", icon: "cart" },
  { id: "education", label: "Educação", icon: "school" },
  { id: "other", label: "Outros", icon: "ellipsis-horizontal" },
];

const TRANSACTION_TYPES: { id: TransactionFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "expenses", label: "Despesas" },
  { id: "income", label: "Receitas" },
];

const FiltersScreen = () => {
  const insets = useSafeAreaInsets();
  const [activePeriod, setActivePeriod] = useState<Period>("today");
  const [activeCategory, setActiveCategory] = useState<string | null>("food");
  const [transactionType, setTransactionType] =
    useState<TransactionFilter>("all");

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0B1420", paddingTop: insets.top }}
    >
      <View className="items-center" style={{ marginTop: 32 }}>
        <View
          className="rounded-full"
          style={{ width: 40, height: 4, backgroundColor: "#424754" }}
        />
      </View>

      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: 20, paddingBottom: 20 }}
      >
        <Text style={{ color: "#F1F5F9", fontSize: 24, fontWeight: "700" }}>
          Filtros
        </Text>
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
          onPress={() => router.back()}
          style={{ backgroundColor: "#17202D" }}
        >
          <Ionicons color="#C2C6D6" name="close" size={22} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              color: "#F1F5F9",
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Período
          </Text>
          <ScrollView
            contentContainerStyle={{ gap: 10 }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {PERIODS.map((period) => {
              const isActive = activePeriod === period.id;
              return (
                <Pressable
                  className="rounded-full active:opacity-80"
                  key={period.id}
                  onPress={() => setActivePeriod(period.id)}
                  style={{
                    backgroundColor: isActive ? "#ADC6FF" : "#222A37",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#002E6A" : "#C2C6D6",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {period.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              color: "#F1F5F9",
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Categorias
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  className="items-center active:opacity-80"
                  key={cat.id}
                  onPress={() =>
                    setActiveCategory(activeCategory === cat.id ? null : cat.id)
                  }
                  style={{ width: "22%", gap: 6 }}
                >
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: isActive ? "transparent" : "#222A37",
                      borderWidth: isActive ? 2 : 0,
                      borderColor: isActive ? "#ADC6FF" : "transparent",
                    }}
                  >
                    <Ionicons
                      color={isActive ? "#ADC6FF" : "#C2C6D6"}
                      name={cat.icon}
                      size={24}
                    />
                  </View>
                  <Text
                    style={{
                      color: isActive ? "#ADC6FF" : "#C2C6D6",
                      fontSize: 12,
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              color: "#F1F5F9",
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Tipo de Transação
          </Text>
          <View
            className="flex-row rounded-xl"
            style={{ backgroundColor: "#131C28", padding: 4 }}
          >
            {TRANSACTION_TYPES.map((tt) => {
              const isActive = transactionType === tt.id;
              return (
                <Pressable
                  className="flex-1 items-center rounded-lg active:opacity-80"
                  key={tt.id}
                  onPress={() => setTransactionType(tt.id)}
                  style={{
                    backgroundColor: isActive ? "#222A37" : "transparent",
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#F1F5F9" : "#C2C6D6",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {tt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        className="px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 16), paddingTop: 12 }}
      >
        <Pressable
          className="flex-row items-center justify-center rounded-xl active:opacity-80"
          onPress={() => router.back()}
          style={{
            height: 56,
            backgroundColor: "#ADC6FF",
            gap: 10,
          }}
        >
          <Ionicons color="#002E6A" name="filter" size={20} />
          <Text style={{ color: "#002E6A", fontSize: 17, fontWeight: "700" }}>
            Aplicar Filtros
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default FiltersScreen;
