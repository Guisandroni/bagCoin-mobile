import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IncomeSource {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  amount: number;
  type: "monthly" | "active" | "yield";
  color: string;
  typeLabel: string;
}

interface RecentInflow {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
  isNew?: boolean;
  status?: string;
}

interface IncomeScreenProps {
  totalIncome: number;
  percentageChange: number;
  monthlyGoal: number;
  incomeSources: IncomeSource[];
  recentInflows: RecentInflow[];
  onAddPress?: () => void;
  onBackPress?: () => void;
}

const PRIMARY = "#10b981";

export function IncomeScreen({
  totalIncome,
  percentageChange,
  monthlyGoal,
  incomeSources,
  recentInflows,
  onAddPress,
  onBackPress,
}: IncomeScreenProps) {
  const goalProgress = Math.min((totalIncome / monthlyGoal) * 100, 100);

  const fmt = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(val);

  // Split formatted value into integer and decimal for big display
  const fmtBig = (val: number) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
    const parts = formatted.split(",");
    return { integer: parts[0], decimal: parts[1] ?? "00" };
  };

  const { integer, decimal } = fmtBig(totalIncome);
  const goalFmt = fmtBig(totalIncome);
  const goalMaxFmt = fmtBig(monthlyGoal);

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.75)",
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(241,245,249,0.8)",
        }}
      >
        <Pressable
          onPress={onBackPress}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#94A3B8" />
        </Pressable>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          Income Overview
        </Text>

        <Pressable
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="eye" size={20} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Toggle Receitas / Despesas ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              backgroundColor: "#F1F5F9",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(226,232,240,0.5)",
            }}
          >
            {/* Receitas (active) */}
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: "white",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: PRIMARY,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Receitas
              </Text>
            </Pressable>

            {/* Despesas (inactive) */}
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Despesas
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Total Revenue ── */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 32,
            alignItems: "center",
          }}
        >
          {/* Caption pill */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "rgba(226,232,240,0.5)",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Receita Total •{" "}
              {new Date().toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          {/* Big number */}
          <Text
            style={{
              color: PRIMARY,
              fontWeight: "800",
              letterSpacing: -2,
              lineHeight: 72,
            }}
          >
            <Text style={{ fontSize: 64 }}>R${integer}</Text>
            <Text style={{ fontSize: 32, opacity: 0.5 }}>,{decimal}</Text>
          </Text>

          {/* Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(16,185,129,0.1)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 9999,
              }}
            >
              <Ionicons name="trending-up" size={14} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontSize: 12, fontWeight: "700" }}>
                +{percentageChange}%
              </Text>
            </View>
            <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "500" }}>
              em relação ao mês anterior
            </Text>
          </View>
        </View>

        {/* ── Monthly Goal ── */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(226,232,240,0.5)",
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 16,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    marginBottom: 4,
                  }}
                >
                  Meta Mensal
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#1E293B",
                  }}
                >
                  {fmt(totalIncome)}{" "}
                  <Text style={{ fontWeight: "400", color: "#94A3B8" }}>
                    / {fmt(monthlyGoal)}
                  </Text>
                </Text>
              </View>
              <Text
                style={{
                  color: PRIMARY,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {goalProgress.toFixed(0)}%
              </Text>
            </View>

            {/* Progress bar */}
            <View
              style={{
                height: 6,
                backgroundColor: "#F1F5F9",
                borderRadius: 9999,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${goalProgress}%`,
                  height: "100%",
                  backgroundColor: PRIMARY,
                  borderRadius: 9999,
                }}
              />
            </View>
          </View>
        </View>

        {/* ── Income Sources ── */}
        <View style={{ marginTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Fontes de Receita
            </Text>
            <Text
              style={{
                color: PRIMARY,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Detalhes
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              gap: 12,
              paddingBottom: 8,
            }}
          >
            {incomeSources.map((src) => (
              <View
                key={src.id}
                style={{
                  minWidth: 130,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(226,232,240,0.5)",
                  padding: 16,
                  gap: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: `${src.color}18`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={src.icon} size={20} color={src.color} />
                </View>

                {/* Name + Amount */}
                <View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 2,
                    }}
                  >
                    {src.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#1E293B",
                    }}
                  >
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                    }).format(src.amount)}
                  </Text>
                </View>

                {/* Type badge */}
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: `${src.color}18`,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: src.color,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {src.typeLabel}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Recent Inflows ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Entradas Recentes
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="cloud-done" size={14} color="#CBD5E1" />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#CBD5E1",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Ao Vivo
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {recentInflows.map((inflow) => (
              <View
                key={inflow.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(226,232,240,0.5)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                {/* Left */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#F8FAFC",
                      borderWidth: 1,
                      borderColor: "#F1F5F9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="cash-outline" size={20} color={PRIMARY} />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 14,
                        color: "#1E293B",
                      }}
                    >
                      {inflow.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#94A3B8",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginTop: 2,
                      }}
                    >
                      {inflow.subtitle}
                    </Text>
                  </View>
                </View>

                {/* Right */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: PRIMARY,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    +{fmt(inflow.amount)}
                  </Text>
                  {inflow.isNew ? (
                    <View
                      style={{
                        marginTop: 3,
                        backgroundColor: "rgba(16,185,129,0.1)",
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "800",
                          color: PRIMARY,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Novo
                      </Text>
                    </View>
                  ) : inflow.status ? (
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginTop: 3,
                      }}
                    >
                      {inflow.status}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        onPress={onAddPress}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: 100,
          alignSelf: "center",
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: "#0F172A",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 8,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Ionicons name="add" size={26} color="white" />
      </Pressable>
    </View>
  );
}
