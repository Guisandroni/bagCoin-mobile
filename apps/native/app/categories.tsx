import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabType = "expenses" | "income";

interface Category {
  color: string;
  iconName: keyof typeof Ionicons.glyphMap;
  id: string;
  name: string;
}

const EXPENSE_CATEGORIES: Category[] = [
  { id: "1", name: "Alimentação", color: "#D4A847", iconName: "restaurant" },
  { id: "2", name: "Transporte", color: "#A78BFA", iconName: "car" },
  { id: "3", name: "Moradia", color: "#3B82F6", iconName: "home" },
  { id: "4", name: "Saúde", color: "#EF4444", iconName: "medkit" },
  { id: "5", name: "Lazer", color: "#F97316", iconName: "sparkles" },
  { id: "6", name: "Supermercado", color: "#8B4513", iconName: "cart" },
  { id: "7", name: "Assinaturas", color: "#EC4899", iconName: "document" },
];

const INCOME_CATEGORIES: Category[] = [
  { id: "8", name: "Salário", color: "#10B981", iconName: "wallet" },
  { id: "9", name: "Freelance", color: "#D4A847", iconName: "briefcase" },
  {
    id: "10",
    name: "Investimentos",
    color: "#3B82F6",
    iconName: "trending-up",
  },
  { id: "11", name: "Vendas", color: "#EC4899", iconName: "pricetag" },
];

const CategoryRow = ({ category }: { category: Category }) => (
  <View
    className="flex-row items-center rounded-xl"
    style={{ backgroundColor: "#222A37", padding: 16 }}
  >
    <Ionicons
      color="#475569"
      name="reorder-three"
      size={22}
      style={{ marginRight: 12 }}
    />
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: 44,
        height: 44,
        backgroundColor: category.color,
        marginRight: 12,
      }}
    >
      <Ionicons color="#FFFFFF" name={category.iconName} size={20} />
    </View>
    <Text
      className="flex-1"
      style={{ fontSize: 16, fontWeight: "500", color: "#F1F5F9" }}
    >
      {category.name}
    </Text>
    <Ionicons color="#94A3B8" name="chevron-forward" size={20} />
  </View>
);

const CategoriesScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("expenses");

  const categories =
    activeTab === "expenses" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0B1420", paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-5 pt-4 pb-6">
          <Pressable
            className="h-9 w-9 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons color="#F1F5F9" name="arrow-back" size={24} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#F1F5F9" }}>
            Categorias
          </Text>
          <Pressable hitSlop={8}>
            <Ionicons color="#F1F5F9" name="search" size={22} />
          </Pressable>
        </View>

        <View className="px-5" style={{ marginBottom: 24 }}>
          <View
            className="flex-row rounded-xl"
            style={{ backgroundColor: "#131C28", padding: 4 }}
          >
            <Pressable
              className="flex-1 items-center rounded-xl"
              onPress={() => setActiveTab("expenses")}
              style={{ paddingVertical: 12 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: activeTab === "expenses" ? "#ADC6FF" : "#C2C6D6",
                }}
              >
                Despesas
              </Text>
              {activeTab === "expenses" ? (
                <View
                  className="mt-1.5 rounded-full"
                  style={{ height: 2, width: 40, backgroundColor: "#ADC6FF" }}
                />
              ) : null}
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl"
              onPress={() => setActiveTab("income")}
              style={{ paddingVertical: 12 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: activeTab === "income" ? "#ADC6FF" : "#C2C6D6",
                }}
              >
                Receitas
              </Text>
              {activeTab === "income" ? (
                <View
                  className="mt-1.5 rounded-full"
                  style={{ height: 2, width: 40, backgroundColor: "#ADC6FF" }}
                />
              ) : null}
            </Pressable>
          </View>
        </View>

        <View className="px-5" style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#F1F5F9",
              marginBottom: 4,
            }}
          >
            Minhas Listas
          </Text>
          <Text style={{ fontSize: 14, color: "#94A3B8" }}>
            Organize seus fluxos financeiros com precisão editorial.
          </Text>
        </View>

        <View className="px-5" style={{ gap: 10 }}>
          {categories.map((cat) => (
            <CategoryRow category={cat} key={cat.id} />
          ))}
        </View>

        <Text
          className="mt-6 text-center"
          style={{
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "rgba(148,163,184,0.6)",
          }}
        >
          Pressione e arraste para reordenar
        </Text>
      </ScrollView>

      <Pressable
        className="absolute items-center justify-center rounded-full active:opacity-80"
        onPress={() => router.push("/new-category")}
        style={{
          width: 56,
          height: 56,
          bottom: Math.max(insets.bottom, 16) + 16,
          right: 24,
          backgroundColor: "#3B82F6",
        }}
      >
        <Ionicons color="#FFFFFF" name="add" size={28} />
      </Pressable>
    </View>
  );
};

export default CategoriesScreen;
