import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";

type Period = "month" | "quarter" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Mês",
  quarter: "Trimestre",
  year: "Ano",
};

const CATEGORY_DATA = [
  { name: "Moradia", percent: 37 },
  { name: "Alimentação", percent: 24 },
  { name: "Transporte", percent: 14 },
  { name: "Lazer", percent: 9 },
];

const MONTHLY_TREND = [
  { month: "OUT", income: 4800, expenses: 3200 },
  { month: "NOV", income: 5100, expenses: 3600 },
  { month: "DEZ", income: 6200, expenses: 4100 },
  { month: "JAN", income: 5000, expenses: 3400 },
  { month: "FEV", income: 4900, expenses: 3300 },
  { month: "MAR", income: 5200, expenses: 3750 },
];

const ACCOUNTS_DATA = [
  { name: "Bradesco", expenseRatio: 0.6, incomeRatio: 0.85 },
  { name: "Nubank", expenseRatio: 0.4, incomeRatio: 0.55 },
  { name: "Santander", expenseRatio: 0.75, incomeRatio: 0.9 },
];

const BAR_MAX_HEIGHT = 100;

const ReportsScreen = () => {
  const [period, setPeriod] = useState<Period>("month");

  const maxTrend = Math.max(
    ...MONTHLY_TREND.flatMap((d) => [d.income, d.expenses])
  );

  return (
    <Container>
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          gap: 20,
          paddingBottom: 32,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "600", color: "#F1F5F9" }}>
          Relatórios
        </Text>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#060F1A",
            padding: 4,
            borderRadius: 12,
          }}
        >
          {(["month", "quarter", "year"] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1,
                alignItems: "center",
                backgroundColor: period === p ? "#3B82F6" : "transparent",
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: period === p ? "#FFFFFF" : "#C2C6D6",
                  fontWeight: period === p ? "600" : "400",
                }}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#131C28",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(66,71,84,0.15)",
          }}
        >
          <Text style={{ color: "#C2C6D6", fontSize: 14 }}>
            Todas as contas
          </Text>
          <Ionicons color="#C2C6D6" name="chevron-down" size={16} />
        </Pressable>

        <ScrollView
          contentContainerStyle={{ gap: 12 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View
            style={{
              minWidth: 160,
              backgroundColor: "#222A37",
              padding: 20,
              borderRadius: 16,
              borderLeftWidth: 4,
              borderLeftColor: "rgba(16,185,129,0.4)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                color: "#94A3B8",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              RECEITAS
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "monospace",
                fontWeight: "700",
                color: "#10B981",
              }}
            >
              R$ 5.200,00
            </Text>
          </View>

          <View
            style={{
              minWidth: 160,
              backgroundColor: "#222A37",
              padding: 20,
              borderRadius: 16,
              borderLeftWidth: 4,
              borderLeftColor: "rgba(239,68,68,0.4)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                color: "#94A3B8",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              DESPESAS
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "monospace",
                fontWeight: "700",
                color: "#EF4444",
              }}
            >
              R$ 3.750,00
            </Text>
          </View>

          <View
            style={{
              minWidth: 160,
              backgroundColor: "#222A37",
              padding: 20,
              borderRadius: 16,
              borderLeftWidth: 4,
              borderLeftColor: "rgba(59,130,246,0.4)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                color: "#94A3B8",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              SALDO LÍQUIDO
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "monospace",
                fontWeight: "700",
                color: "#3B82F6",
              }}
            >
              R$ 1.450,00
            </Text>
          </View>
        </ScrollView>

        <View
          style={{
            backgroundColor: "#17202D",
            padding: 24,
            borderRadius: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#F1F5F9" }}>
              Despesas por Categoria
            </Text>
            <Ionicons color="#ADC6FF" name="grid-outline" size={20} />
          </View>
          <View style={{ gap: 16 }}>
            {CATEGORY_DATA.map((cat) => (
              <View key={cat.name} style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#C2C6D6", fontSize: 14 }}>
                    {cat.name}
                  </Text>
                  <Text
                    style={{
                      color: "#F1F5F9",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  >
                    {cat.percent}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: "#060F1A",
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${cat.percent}%`,
                      borderRadius: 999,
                      backgroundColor: "#EF4444",
                      opacity: 0.8,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#17202D",
            padding: 24,
            borderRadius: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#F1F5F9" }}>
              Tendência Mensal
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#10B981",
                  }}
                />
                <Text style={{ color: "#94A3B8", fontSize: 10 }}>Receitas</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#EF4444",
                  }}
                />
                <Text style={{ color: "#94A3B8", fontSize: 10 }}>Despesas</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#3B82F6",
                  }}
                />
                <Text style={{ color: "#94A3B8", fontSize: 10 }}>Saldo</Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-around",
              height: BAR_MAX_HEIGHT + 28,
            }}
          >
            {MONTHLY_TREND.map((item) => {
              const balance = item.income - item.expenses;
              return (
                <View key={item.month} style={{ alignItems: "center", gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      gap: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 12,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        height: (item.income / maxTrend) * BAR_MAX_HEIGHT,
                        backgroundColor: "#10B981",
                      }}
                    />
                    <View
                      style={{
                        width: 12,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        height: (item.expenses / maxTrend) * BAR_MAX_HEIGHT,
                        backgroundColor: "#EF4444",
                      }}
                    />
                    <View
                      style={{
                        width: 12,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        height: (balance / maxTrend) * BAR_MAX_HEIGHT,
                        backgroundColor: "#3B82F6",
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: "#C2C6D6",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                  >
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#17202D",
            padding: 24,
            borderRadius: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#F1F5F9" }}>
              Despesas por Conta
            </Text>
            <Ionicons color="#ADC6FF" name="business-outline" size={20} />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "flex-end",
              height: 140,
            }}
          >
            {ACCOUNTS_DATA.map((account) => (
              <View key={account.name} style={{ alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 4,
                    height: 100,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: account.expenseRatio * 100,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                      backgroundColor: "#EF4444",
                    }}
                  />
                  <View
                    style={{
                      width: 24,
                      height: account.incomeRatio * 100,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                      backgroundColor: "#10B981",
                    }}
                  />
                </View>
                <Text style={{ color: "#C2C6D6", fontSize: 12 }}>
                  {account.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Container>
  );
};

export default ReportsScreen;
