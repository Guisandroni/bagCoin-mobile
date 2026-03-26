import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ExpenseCategory {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  amount: number;
  budget?: number;
  transactionCount?: number;
  isFixed?: boolean;
}

interface ExpensesScreenProps {
  totalExpenses: number;
  percentageChange: number;
  categories: ExpenseCategory[];
  selectedPeriod: "monthly" | "custom";
  onPeriodChange?: (period: "monthly" | "custom") => void;
  onCategoryPress?: (id: number) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
}

export function ExpensesScreen({
  totalExpenses,
  percentageChange,
  categories,
  selectedPeriod,
  onPeriodChange,
  onCategoryPress,
  onAddPress,
  onBackPress,
}: ExpensesScreenProps) {
  const insets = useSafeAreaInsets();

  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalExpenses);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.85)",
          paddingTop: insets.top,
          paddingHorizontal: 24,
          paddingBottom: 8,
          borderBottomWidth: 0,
        }}
      >
        {/* Nav row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => ({
              padding: 8,
              marginLeft: -8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              letterSpacing: -0.2,
              color: "#111827",
            }}
          >
            Análise de Agosto
          </Text>

          <Pressable
            style={({ pressed }) => ({
              padding: 8,
              marginRight: -8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
          </Pressable>
        </View>

        {/* Receitas / Despesas toggle */}
        <View
          style={{
            flexDirection: "row",
            padding: 4,
            backgroundColor: "#F3F4F6",
            borderRadius: 12,
            marginBottom: 8,
          }}
        >
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#6B7280",
              }}
            >
              Receitas
            </Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#F43F5E",
              }}
            >
              Despesas
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Spending */}
        <View style={{ marginTop: 32, marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            Gastos Atuais
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "800",
              letterSpacing: -1.5,
              color: "#E11D48",
              lineHeight: 56,
            }}
          >
            {formattedTotal}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
            }}
          >
            <Ionicons name="trending-up" size={14} color="#6B7280" />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#6B7280",
              }}
            >
              +{percentageChange}% vs mês anterior
            </Text>
          </View>
        </View>

        {/* Monthly / Custom toggle pill */}
        <View
          style={{
            flexDirection: "row",
            padding: 4,
            backgroundColor: "#F3F4F6",
            borderRadius: 9999,
            alignSelf: "flex-start",
            marginBottom: 40,
          }}
        >
          <Pressable
            onPress={() => onPeriodChange?.("monthly")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: 9999,
              backgroundColor:
                selectedPeriod === "monthly" ? "white" : "transparent",
              shadowColor:
                selectedPeriod === "monthly" ? "#000" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: selectedPeriod === "monthly" ? 0.06 : 0,
              shadowRadius: 3,
              elevation: selectedPeriod === "monthly" ? 1 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: selectedPeriod === "monthly" ? "700" : "600",
                color: selectedPeriod === "monthly" ? "#111827" : "#6B7280",
              }}
            >
              Mensal
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onPeriodChange?.("custom")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: 9999,
              backgroundColor:
                selectedPeriod === "custom" ? "white" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: selectedPeriod === "custom" ? "700" : "600",
                color: selectedPeriod === "custom" ? "#111827" : "#6B7280",
              }}
            >
              Personalizado
            </Text>
          </Pressable>
        </View>

        {/* Categories header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Categorias
          </Text>
          <View
            style={{
              backgroundColor: "#ECFDF5",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#059669",
              }}
            >
              Sincronizado
            </Text>
          </View>
        </View>

        {/* Category list */}
        <View style={{ gap: 32 }}>
          {categories.map((category) => {
            const progress = category.budget
              ? (category.amount / category.budget) * 100
              : 0;
            const isOverBudget = progress > 100;
            const clampedProgress = Math.min(progress, 100);

            const formattedAmount = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(category.amount);

            return (
              <Pressable
                key={category.id}
                onPress={() => onCategoryPress?.(category.id)}
                style={({ pressed }) => ({
                  opacity: category.amount === 0 ? 0.5 : pressed ? 0.85 : 1,
                  gap: 12,
                })}
              >
                {/* Row: icon + info + amount */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Left: icon + text */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        backgroundColor: "white",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={category.icon}
                        size={20}
                        color="#111827"
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          letterSpacing: -0.2,
                          color: category.amount === 0 ? "#6B7280" : "#111827",
                        }}
                      >
                        {category.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#6B7280",
                          marginTop: 1,
                        }}
                      >
                        {category.isFixed
                          ? "Despesa Fixa"
                          : `${category.transactionCount ?? 0} Transações`}
                      </Text>
                    </View>
                  </View>

                  {/* Right: amount + label */}
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: isOverBudget ? "#E11D48" : "#111827",
                      }}
                    >
                      {formattedAmount}
                    </Text>
                    {category.budget && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: isOverBudget
                            ? "rgba(225, 29, 72, 0.6)"
                            : "#6B7280",
                          marginTop: 1,
                        }}
                      >
                        {isOverBudget
                          ? "Acima do Limite"
                          : `Orçamento R$ ${(category.budget / 1000).toFixed(0)}k`}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Progress bar */}
                <View
                  style={{
                    width: "100%",
                    height: 4,
                    backgroundColor: "#F3F4F6",
                    borderRadius: 9999,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${clampedProgress}%`,
                      height: "100%",
                      borderRadius: 9999,
                      backgroundColor: isOverBudget ? "#E11D48" : "#111827",
                    }}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        onPress={onAddPress}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: 100,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#111827",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
