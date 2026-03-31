import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Container } from "@/components/container";
import { useReportByCategory, useReportSummary } from "@/hooks/use-api";

const formatMoney = (value: number): string =>
  `R$ ${(value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type Period = "month" | "quarter" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Mês",
  quarter: "Trimestre",
  year: "Ano",
};

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>("month");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: summary, isLoading } = useReportSummary(month, year);
  const { data: categoryReport } = useReportByCategory(month, year);

  const income = summary?.income ?? 0;
  const expenses = summary?.expenses ?? 0;
  const balance = income - expenses;

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

        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator color="#ADC6FF" size="large" />
          </View>
        ) : (
          <>
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
                  {formatMoney(income)}
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
                  {formatMoney(expenses)}
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
                  {formatMoney(balance)}
                </Text>
              </View>
            </ScrollView>

            {categoryReport && categoryReport.length > 0 ? (
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
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#F1F5F9",
                    }}
                  >
                    Despesas por Categoria
                  </Text>
                  <Ionicons color="#ADC6FF" name="grid-outline" size={20} />
                </View>
                <View style={{ gap: 16 }}>
                  {categoryReport.map((cat) => (
                    <View key={cat.categoryId} style={{ gap: 6 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#C2C6D6", fontSize: 14 }}>
                          {cat.categoryName}
                        </Text>
                        <Text
                          style={{
                            color: "#F1F5F9",
                            fontSize: 14,
                            fontFamily: "monospace",
                          }}
                        >
                          {cat.percentage}%
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
                            width: `${cat.percentage}%`,
                            borderRadius: 999,
                            backgroundColor: cat.color || "#EF4444",
                            opacity: 0.8,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#17202D",
                  padding: 32,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons color="#475569" name="pie-chart-outline" size={40} />
                <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 12 }}>
                  Sem dados suficientes para relatórios
                </Text>
              </View>
            )}

            <View
              style={{
                backgroundColor: "#17202D",
                padding: 24,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#F1F5F9",
                  marginBottom: 16,
                }}
              >
                Resumo
              </Text>
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                    Transações
                  </Text>
                  <Text
                    style={{
                      color: "#F1F5F9",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  >
                    {summary?.transactionCount ?? 0}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                    Receitas
                  </Text>
                  <Text
                    style={{
                      color: "#10B981",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  >
                    {formatMoney(income)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                    Despesas
                  </Text>
                  <Text
                    style={{
                      color: "#EF4444",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  >
                    {formatMoney(expenses)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "rgba(66,71,84,0.2)",
                    marginVertical: 4,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: "#F1F5F9",
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Saldo
                  </Text>
                  <Text
                    style={{
                      color: balance >= 0 ? "#10B981" : "#EF4444",
                      fontSize: 15,
                      fontWeight: "700",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatMoney(balance)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </Container>
  );
}
