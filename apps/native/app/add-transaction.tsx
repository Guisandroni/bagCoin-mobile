import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useToast } from "heroui-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { Container } from "@/components/container";

type TransactionType = "expense" | "income";

const EXPENSE_CATEGORIES = [
  {
    id: "food",
    label: "Alimentação",
    icon: "restaurant-outline" as const,
    color: "#EF4444",
  },
  {
    id: "transport",
    label: "Transporte",
    icon: "car-outline" as const,
    color: "#F59E0B",
  },
  {
    id: "housing",
    label: "Moradia",
    icon: "home-outline" as const,
    color: "#3B82F6",
  },
  {
    id: "leisure",
    label: "Lazer",
    icon: "game-controller-outline" as const,
    color: "#EC4899",
  },
  {
    id: "health",
    label: "Saúde",
    icon: "medkit-outline" as const,
    color: "#10B981",
  },
  {
    id: "education",
    label: "Educação",
    icon: "school-outline" as const,
    color: "#8B5CF6",
  },
  {
    id: "bills",
    label: "Contas",
    icon: "receipt-outline" as const,
    color: "#F97316",
  },
  {
    id: "other",
    label: "Outros",
    icon: "ellipsis-horizontal-outline" as const,
    color: "#6B7280",
  },
];

const INCOME_CATEGORIES = [
  {
    id: "salary",
    label: "Salário",
    icon: "briefcase-outline" as const,
    color: "#10B981",
  },
  {
    id: "freelance",
    label: "Freelance",
    icon: "code-outline" as const,
    color: "#3B82F6",
  },
  {
    id: "investments",
    label: "Investimentos",
    icon: "trending-up-outline" as const,
    color: "#D4A847",
  },
  {
    id: "sales",
    label: "Vendas",
    icon: "pricetag-outline" as const,
    color: "#EC4899",
  },
  {
    id: "rent",
    label: "Aluguel",
    icon: "key-outline" as const,
    color: "#8B5CF6",
  },
  {
    id: "other",
    label: "Outros",
    icon: "ellipsis-horizontal-outline" as const,
    color: "#6B7280",
  },
];

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

const AddTransactionScreen = () => {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();
  const { width: screenWidth } = useWindowDimensions();

  const isExpense = type === "expense";
  const accentColor = isExpense ? "#EF4444" : "#10B981";
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categoryItemWidth = (screenWidth - 48 - 32 - 24) / 4;

  const handleSave = () => {
    if (!(amount && selectedCategory)) {
      toast.show({
        variant: "danger",
        label: "Preencha valor e categoria",
      });
      return;
    }
    toast.show({
      variant: "success",
      label: isExpense ? "Despesa adicionada" : "Receita adicionada",
    });
    router.back();
  };

  return (
    <Container isScrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: 8, paddingBottom: 16 }}
        >
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
            onPress={() => router.back()}
            style={{ backgroundColor: "rgba(51,65,85,0.3)" }}
          >
            <Ionicons color="#F1F5F9" name="arrow-back" size={22} />
          </Pressable>
          <Text style={{ color: "#F1F5F9", fontSize: 17, fontWeight: "700" }}>
            {isExpense ? "Adicionar Despesa" : "Adicionar Receita"}
          </Text>
          <Pressable className="active:opacity-60" onPress={handleSave}>
            <Text
              style={{ color: accentColor, fontSize: 15, fontWeight: "600" }}
            >
              Salvar
            </Text>
          </Pressable>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type Toggle */}
          <View
            className="flex-row rounded-2xl p-1"
            style={{ backgroundColor: "#1E2D3D", marginBottom: 24 }}
          >
            <Pressable
              className="flex-1 items-center rounded-xl"
              onPress={() => {
                setType("expense");
                setSelectedCategory(null);
              }}
              style={{
                backgroundColor: isExpense
                  ? "rgba(239,68,68,0.12)"
                  : "transparent",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: isExpense ? "#EF4444" : "#475569",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Despesa
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl"
              onPress={() => {
                setType("income");
                setSelectedCategory(null);
              }}
              style={{
                backgroundColor: isExpense
                  ? "transparent"
                  : "rgba(16,185,129,0.12)",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: isExpense ? "#475569" : "#10B981",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Receita
              </Text>
            </Pressable>
          </View>

          {/* Value Hero Input */}
          <View className="items-center" style={{ marginBottom: 28 }}>
            <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 12 }}>
              {isExpense ? "Valor da Despesa" : "Valor da Receita"}
            </Text>
            <View className="flex-row items-baseline">
              <Text
                style={{
                  color: "#94A3B8",
                  fontSize: 24,
                  fontFamily: "monospace",
                }}
              >
                R$
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setAmount}
                placeholder="0,00"
                placeholderTextColor={`${accentColor}60`}
                style={{
                  fontSize: 42,
                  fontWeight: "700",
                  fontFamily: "monospace",
                  color: accentColor,
                  minWidth: 100,
                  textAlign: "center",
                  marginLeft: 4,
                }}
                value={amount}
              />
            </View>
            <View
              style={{
                height: 2,
                width: 200,
                backgroundColor: accentColor,
                marginTop: 8,
                borderRadius: 1,
              }}
            />
          </View>

          {/* Card 1 — Details */}
          <View
            className="rounded-2xl"
            style={{
              backgroundColor: "#131C28",
              padding: 16,
              marginBottom: 16,
            }}
          >
            {/* Description */}
            <View
              className="flex-row items-center"
              style={{ gap: 12, paddingVertical: 14 }}
            >
              <Ionicons color="#475569" name="create-outline" size={20} />
              <TextInput
                onChangeText={setDescription}
                placeholder="Ex: Supermercado..."
                placeholderTextColor="#475569"
                style={{ flex: 1, color: "#F1F5F9", fontSize: 15 }}
                value={description}
              />
            </View>

            <View style={{ height: 1, backgroundColor: "#1E2D3D" }} />

            {/* Account */}
            <Pressable
              className="flex-row items-center justify-between"
              style={{ paddingVertical: 14 }}
            >
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <Ionicons color="#475569" name="wallet-outline" size={20} />
                <View>
                  <Text style={{ color: "#F1F5F9", fontSize: 15 }}>Nubank</Text>
                  <Text
                    style={{
                      color: "#94A3B8",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    R$ 3.200,00
                  </Text>
                </View>
              </View>
              <Ionicons color="#475569" name="chevron-forward" size={18} />
            </Pressable>

            <View style={{ height: 1, backgroundColor: "#1E2D3D" }} />

            {/* Date */}
            <Pressable
              className="flex-row items-center"
              style={{ gap: 12, paddingVertical: 14 }}
            >
              <Ionicons color="#475569" name="calendar-outline" size={20} />
              <Text style={{ color: "#F1F5F9", fontSize: 15 }}>
                {formatDate(new Date())}
              </Text>
            </Pressable>
          </View>

          {/* Card 2 — Categories */}
          <View
            className="rounded-2xl"
            style={{
              backgroundColor: "#131C28",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 13,
                fontWeight: "500",
                marginBottom: 14,
              }}
            >
              Categoria
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    className="items-center rounded-xl"
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{
                      width: categoryItemWidth,
                      paddingVertical: 12,
                      backgroundColor: isSelected
                        ? `${cat.color}15`
                        : "rgba(30,45,61,0.6)",
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected
                        ? `${cat.color}50`
                        : "transparent",
                    }}
                  >
                    <Ionicons
                      color={isSelected ? cat.color : "#475569"}
                      name={cat.icon}
                      size={24}
                    />
                    <Text
                      style={{
                        color: isSelected ? cat.color : "#94A3B8",
                        fontSize: 11,
                        fontWeight: "500",
                        marginTop: 6,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Card 3 — Notes */}
          <View
            className="rounded-2xl"
            style={{
              backgroundColor: "#131C28",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View className="flex-row" style={{ gap: 12 }}>
              <Ionicons
                color="#475569"
                name="document-text-outline"
                size={20}
                style={{ marginTop: 2 }}
              />
              <TextInput
                multiline
                numberOfLines={3}
                onChangeText={setNotes}
                placeholder="Adicione detalhes..."
                placeholderTextColor="#475569"
                style={{
                  flex: 1,
                  color: "#F1F5F9",
                  fontSize: 14,
                  minHeight: 72,
                  textAlignVertical: "top",
                }}
                value={notes}
              />
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer */}
        <View
          className="px-6"
          style={{
            paddingBottom: 20,
            paddingTop: 12,
            backgroundColor: "#0B1420",
            borderTopWidth: 1,
            borderTopColor: "#1E2D3D",
            gap: 10,
          }}
        >
          <Pressable
            className="items-center justify-center rounded-xl active:opacity-80"
            onPress={handleSave}
            style={{ backgroundColor: accentColor, height: 52 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
              {isExpense ? "Salvar Despesa" : "Salvar Receita"}
            </Text>
          </Pressable>
          <Pressable
            className="items-center justify-center rounded-xl active:opacity-80"
            onPress={() => router.back()}
            style={{ height: 48, borderWidth: 1, borderColor: "#334155" }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 15, fontWeight: "500" }}>
              Cancelar
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default AddTransactionScreen;
