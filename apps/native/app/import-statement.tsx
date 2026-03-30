import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PREVIEW_ROWS = [
  { date: "12/03/2026", desc: "PAGTO ELETRON", value: "-1.200,00" },
  { date: "13/03/2026", desc: "IFOOD *RESTAURANTE", value: "-42,50" },
  { date: "14/03/2026", desc: "UBER TRIP", value: "-22,90" },
];

const COLUMN_MAPPINGS = [
  { label: "DATA", column: "Coluna A" },
  { label: "DESCRIÇÃO", column: "Coluna B" },
  { label: "VALOR", column: "Coluna C" },
];

const SUGGESTIONS = [
  {
    extract: "PAGTO\nELETRON",
    icon: "home" as const,
    category: "Moradia",
    confidence: 98,
    showConfidence: true,
  },
  {
    extract: "IFOOD\n*REST",
    icon: "restaurant" as const,
    category: "Alimentação",
    confidence: 95,
    showConfidence: false,
  },
  {
    extract: "UBER TRIP",
    icon: "car" as const,
    category: "Transporte",
    confidence: 92,
    showConfidence: false,
  },
];

const StepBadge = ({ number }: { number: number }) => (
  <View
    style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(173,198,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text
      style={{
        color: "#ADC6FF",
        fontSize: 12,
        fontWeight: "700",
      }}
    >
      {number}
    </Text>
  </View>
);

const ImportStatementScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: "#0B1420" }}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <Pressable
          className="items-center justify-center rounded-full"
          onPress={() => router.back()}
          style={{ width: 40, height: 40 }}
        >
          <Ionicons color="#ADC6FF" name="arrow-back" size={24} />
        </Pressable>
        <Text
          style={{
            color: "#ADC6FF",
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Importar Extrato
        </Text>
        <Text
          style={{
            color: "#ADC6FF",
            fontSize: 22,
            fontWeight: "900",
            letterSpacing: -0.5,
          }}
        >
          Bag Coin
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Selecionar Conta */}
        <View style={{ marginBottom: 32 }}>
          <View
            className="flex-row items-center"
            style={{ gap: 8, marginBottom: 16 }}
          >
            <StepBadge number={1} />
            <Text
              style={{
                color: "rgba(241,245,249,0.8)",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              SELECIONAR CONTA
            </Text>
          </View>

          <Pressable
            className="flex-row items-center justify-between rounded-2xl p-4"
            style={{
              backgroundColor: "#222A37",
              borderWidth: 1,
              borderColor: "rgba(66,71,84,0.15)",
            }}
          >
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons color="#CC092F" name="business" size={24} />
              </View>
              <View>
                <Text
                  style={{
                    color: "#F1F5F9",
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  Bradesco - Conta Corrente
                </Text>
                <Text
                  style={{
                    color: "#C2C6D6",
                    fontSize: 12,
                    fontFamily: "monospace",
                    marginTop: 2,
                  }}
                >
                  Saldo: <Text style={{ color: "#ADC6FF" }}>R$ 3.200,00</Text>
                </Text>
              </View>
            </View>
            <Ionicons color="#8C909F" name="chevron-down" size={20} />
          </Pressable>
        </View>

        {/* STEP 2: Upload */}
        <View style={{ marginBottom: 32 }}>
          <View
            className="flex-row items-center"
            style={{ gap: 8, marginBottom: 16 }}
          >
            <StepBadge number={2} />
            <Text
              style={{
                color: "rgba(241,245,249,0.8)",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              UPLOAD
            </Text>
          </View>

          <View
            className="flex-row items-center justify-between rounded-2xl"
            style={{
              backgroundColor: "rgba(173,198,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(173,198,255,0.2)",
              padding: 20,
            }}
          >
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: "rgba(173,198,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons color="#ADC6FF" name="document-text" size={20} />
              </View>
              <View>
                <Text
                  style={{
                    color: "#F1F5F9",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  extrato_bradesco_mar2026.csv
                </Text>
                <Text
                  style={{
                    color: "#C2C6D6",
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  24 KB • 48 TRANSAÇÕES
                </Text>
              </View>
            </View>
            <Ionicons color="#ADC6FF" name="checkmark-circle" size={24} />
          </View>
        </View>

        {/* STEP 3: Preview e Mapeamento */}
        <View style={{ marginBottom: 32 }}>
          <View
            className="flex-row items-center"
            style={{ gap: 8, marginBottom: 16 }}
          >
            <StepBadge number={3} />
            <Text
              style={{
                color: "rgba(241,245,249,0.8)",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              PREVIEW E MAPEAMENTO
            </Text>
          </View>

          {/* Table */}
          <View
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: "#131C28",
              borderWidth: 1,
              borderColor: "rgba(66,71,84,0.1)",
              marginBottom: 12,
            }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Table Header */}
                <View
                  className="flex-row"
                  style={{
                    backgroundColor: "rgba(34,42,55,0.5)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      width: 100,
                      color: "#C2C6D6",
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    DATA
                  </Text>
                  <Text
                    style={{
                      width: 150,
                      color: "#C2C6D6",
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    DESCRIÇÃO
                  </Text>
                  <Text
                    style={{
                      width: 90,
                      color: "#C2C6D6",
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      textAlign: "right",
                    }}
                  >
                    VALOR
                  </Text>
                </View>

                {/* Table Rows */}
                {PREVIEW_ROWS.map((row) => (
                  <View
                    className="flex-row"
                    key={row.desc}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderTopWidth: 1,
                      borderTopColor: "rgba(66,71,84,0.1)",
                    }}
                  >
                    <Text
                      style={{
                        width: 100,
                        color: "rgba(241,245,249,0.7)",
                        fontSize: 12,
                        fontFamily: "monospace",
                      }}
                    >
                      {row.date}
                    </Text>
                    <Text
                      style={{
                        width: 150,
                        color: "#F1F5F9",
                        fontSize: 13,
                      }}
                    >
                      {row.desc}
                    </Text>
                    <Text
                      style={{
                        width: 90,
                        color: "#EF4444",
                        fontSize: 12,
                        fontFamily: "monospace",
                        textAlign: "right",
                      }}
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Column Mapping */}
          <View style={{ gap: 8 }}>
            {COLUMN_MAPPINGS.map((m) => (
              <View
                className="flex-row items-center justify-between rounded-xl p-3"
                key={m.label}
                style={{
                  backgroundColor: "#060F1A",
                  borderWidth: 1,
                  borderColor: "rgba(66,71,84,0.1)",
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "#C2C6D6",
                      fontSize: 10,
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    {m.label}
                  </Text>
                  <Text
                    style={{
                      color: "#ADC6FF",
                      fontSize: 13,
                      fontWeight: "500",
                    }}
                  >
                    {m.column}
                  </Text>
                </View>
                <Ionicons color="#ADC6FF" name="swap-vertical" size={18} />
              </View>
            ))}
          </View>
        </View>

        {/* STEP 4: Auto-Categorização */}
        <View style={{ marginBottom: 16 }}>
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: 16 }}
          >
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <StepBadge number={4} />
              <Text
                style={{
                  color: "rgba(241,245,249,0.8)",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                AUTO-CATEGORIZAÇÃO
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(173,198,255,0.1)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  color: "#ADC6FF",
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                IA Ativa
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <View
                className="flex-row items-center justify-between rounded-2xl p-4"
                key={s.category}
                style={{ backgroundColor: "#222A37" }}
              >
                <View
                  className="flex-row items-center"
                  style={{ gap: 12, flex: 1 }}
                >
                  {/* Extract text */}
                  <View>
                    <Text
                      style={{
                        color: "#C2C6D6",
                        fontSize: 10,
                        fontFamily: "monospace",
                        opacity: 0.5,
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      EXTRATO
                    </Text>
                    <Text
                      style={{
                        color: "#F1F5F9",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      {s.extract}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <Ionicons color="#8C909F" name="arrow-forward" size={16} />

                  {/* Category pill */}
                  <View
                    className="flex-row items-center rounded-full"
                    style={{
                      backgroundColor: "#2D3542",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: "rgba(66,71,84,0.2)",
                      gap: 6,
                    }}
                  >
                    <Ionicons color="#EEC05C" name={s.icon} size={18} />
                    <Text
                      style={{
                        color: "#F1F5F9",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      {s.category}
                    </Text>
                  </View>
                </View>

                {/* Right side */}
                <View className="items-end" style={{ gap: 4, marginLeft: 8 }}>
                  {s.showConfidence && (
                    <View
                      className="flex-row items-center rounded-full"
                      style={{
                        backgroundColor: "rgba(16,185,129,0.1)",
                        borderWidth: 1,
                        borderColor: "rgba(16,185,129,0.2)",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        color="#10B981"
                        name="checkmark-circle"
                        size={12}
                      />
                      <Text
                        style={{
                          color: "#10B981",
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        {s.confidence}%
                      </Text>
                    </View>
                  )}
                  <Pressable hitSlop={8}>
                    <Text
                      style={{
                        color: "#ADC6FF",
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      Alterar
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: "#0B1420",
        }}
      >
        <Pressable
          className="items-center justify-center rounded-2xl"
          onPress={() => router.back()}
          style={{
            height: 56,
            backgroundColor: "#ADC6FF",
          }}
        >
          <Text
            style={{
              color: "#002E6A",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            Importar 48 transações
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingBottom: insets.bottom }} />
    </View>
  );
};

export default ImportStatementScreen;
