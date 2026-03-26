import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

type TransactionType = "expense" | "income";

interface CategoryOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const EXPENSE_CATEGORIES: CategoryOption[] = [
  { id: "shopping", name: "Compras", icon: "cart" },
  { id: "food", name: "Alimentação", icon: "restaurant" },
  { id: "transport", name: "Transporte", icon: "car" },
  { id: "other", name: "Outros", icon: "ellipsis-horizontal" },
];

const INCOME_CATEGORIES: CategoryOption[] = [
  { id: "salary", name: "Salário", icon: "cash" },
  { id: "investment", name: "Investimento", icon: "trending-up" },
  { id: "gift", name: "Presente", icon: "gift" },
  { id: "other", name: "Outros", icon: "ellipsis-horizontal" },
];

interface TransactionFormProps {
  initialType?: TransactionType;
  onSubmit?: (data: {
    type: TransactionType;
    amount: number;
    description: string;
    categoryId: string;
    date: Date;
  }) => void;
  onClose?: () => void;
}

export function TransactionForm({
  initialType = "expense",
  onSubmit,
  onClose,
}: TransactionFormProps) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState("0,00");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [date] = useState(new Date());

  const isExpense = type === "expense";
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Colors
  const primaryColor = isExpense ? "#ef4444" : "#2ecc71";
  const primaryColorDark = isExpense ? "#dc2626" : "#27ae60";
  const primaryBg = isExpense ? "rgba(239,68,68,0.1)" : "rgba(46,204,113,0.1)";
  const titleText = isExpense ? "Nova Transação" : "Nova Receita";
  const saveBtnText = isExpense ? "Salvar Despesa" : "Salvar Transação";

  const formatDate = (d: Date) => {
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const dayMonth = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    return isToday ? `Hoje, ${dayMonth}` : dayMonth;
  };

  const handleSubmit = () => {
    const numeric = parseFloat(amount.replace(",", ".")) || 0;
    if (numeric > 0 && selectedCategory) {
      onSubmit?.({
        type,
        amount: numeric,
        description,
        categoryId: selectedCategory,
        date,
      });
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        paddingTop: insets.top,
      }}
    >
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: "white",
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            alignItems: "flex-start",
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="close" size={24} color="#181311" />
        </Pressable>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
            color: "#181311",
            letterSpacing: -0.3,
            marginRight: 48,
          }}
        >
          {titleText}
        </Text>
      </View>

      {/* ── Despesa / Receita Toggle ── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View
          style={{
            flexDirection: "row",
            height: 48,
            backgroundColor: "#F3F4F6",
            borderRadius: 12,
            padding: 4,
          }}
        >
          {/* Despesa */}
          <Pressable
            onPress={() => {
              setType("expense");
              setSelectedCategory(null);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: isExpense
                ? "rgba(255,107,107,0.2)"
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: isExpense ? "#ef4444" : "#896c61",
              }}
            >
              Despesa
            </Text>
          </Pressable>

          {/* Receita */}
          <Pressable
            onPress={() => {
              setType("income");
              setSelectedCategory(null);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: !isExpense
                ? "rgba(46,204,113,0.2)"
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: !isExpense ? "#2ecc71" : "#896c61",
              }}
            >
              Receita
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Amount Section ── */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 40,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#896c61",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            Valor da Transação
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: primaryColor,
                marginRight: 8,
                marginTop: 6,
              }}
            >
              R$
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={{
                fontSize: 64,
                fontWeight: "800",
                color: primaryColor,
                letterSpacing: -2,
                textAlign: "center",
                flex: 1,
                padding: 0,
              }}
              placeholder="0,00"
              placeholderTextColor={primaryColor}
              selectionColor={primaryColor}
            />
          </View>
        </View>

        {/* ── Form Fields ── */}
        <View style={{ paddingHorizontal: 16, gap: 20 }}>
          {/* Description */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#181311",
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              Descrição
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.7)",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 16,
                height: 56,
              }}
            >
              <Ionicons name="create-outline" size={20} color="#896c61" />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={
                  isExpense ? "Ex: Mercado Central" : "Ex: Salário Mensal"
                }
                placeholderTextColor="#896c61"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#181311",
                  padding: 0,
                }}
              />
            </View>
          </View>

          {/* Category */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#181311",
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              Categoria
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
              }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={({ pressed }) => ({
                      flex: 1,
                      alignItems: "center",
                      gap: 8,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? primaryColor : "transparent",
                      backgroundColor: isSelected ? primaryBg : "#F9FAFB",
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={22}
                      color={isSelected ? primaryColor : "#896c61"}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: isSelected ? primaryColor : "#896c61",
                        textAlign: "center",
                      }}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date + Account */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Date */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#181311",
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                Data
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 56,
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#896c61" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#181311",
                  }}
                >
                  {formatDate(date)}
                </Text>
              </View>
            </View>

            {/* Account */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#181311",
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                {isExpense ? "Conta" : "Conta de Destino"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 56,
                }}
              >
                <Ionicons name="wallet-outline" size={20} color="#896c61" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#181311",
                  }}
                >
                  Carteira
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom: Save Button + Mini Nav ── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        }}
      >
        {/* Gradient overlay */}
        <View
          style={{
            position: "absolute",
            top: -32,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            opacity: 0.95,
          }}
        />

        {/* Save Button */}
        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => ({
            width: "100%",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: primaryColor,
            shadowColor: primaryColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            marginBottom: 12,
            zIndex: 1,
          })}
        >
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "700",
              letterSpacing: -0.2,
            }}
          >
            {saveBtnText}
          </Text>
        </Pressable>

        {/* Mini Bottom Nav */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: "rgba(255,255,255,0.7)",
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
            zIndex: 1,
          }}
        >
          {/* Home */}
          <Pressable
            onPress={() => router.push("/(app)/(tabs)")}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="home-outline" size={24} color="#896c61" />
          </Pressable>

          {/* Analytics */}
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/reports")}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="bar-chart-outline" size={24} color="#896c61" />
          </Pressable>

          {/* Center FAB (+ button elevated) */}
          <View
            style={{
              marginTop: -28,
            }}
          >
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => ({
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: primaryColor,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: primaryColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 6,
                borderWidth: 4,
                borderColor: "white",
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Ionicons name="add" size={28} color="white" />
            </Pressable>
          </View>

          {/* Card */}
          <Pressable
            onPress={() => router.push("/(app)/linked-accounts")}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="card-outline" size={24} color="#896c61" />
          </Pressable>

          {/* Profile */}
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/profile")}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="person-outline" size={24} color="#896c61" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
