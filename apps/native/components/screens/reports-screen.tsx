import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

interface ChartCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface InsightCard {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface BreakdownItem {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  amount: number;
  transactionCount: number;
  percentageChange: number;
}

interface ReportsScreenProps {
  totalSpend: number;
  percentageDecrease: number;
  selectedPeriod: "daily" | "weekly" | "monthly";
  categories: ChartCategory[];
  insights: InsightCard[];
  breakdown: BreakdownItem[];
  onPeriodChange?: (period: "daily" | "weekly" | "monthly") => void;
  onBackPress?: () => void;
  onAddPress?: () => void;
}

const RADIUS = 85;
const STROKE_WIDTH = 14;
const CENTER = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function DonutChart({ categories }: { categories: ChartCategory[] }) {
  let cumulativePct = 0;
  const segments = categories.map((cat) => {
    const strokeLength = CIRCUMFERENCE * (cat.percentage / 100);
    const gapLength = CIRCUMFERENCE - strokeLength;
    const rotation = -90 + (cumulativePct / 100) * 360;
    cumulativePct += cat.percentage;
    return { ...cat, strokeLength, gapLength, rotation };
  });

  const topCategory = categories[0];

  return (
    <View style={{ alignItems: "center" }}>
      <Svg
        width={CENTER * 2}
        height={CENTER * 2}
        viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
      >
        {/* Background ring */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#F0F0F0"
          strokeWidth={STROKE_WIDTH}
        />
        {/* Segments */}
        {segments.map((seg, i) => (
          <Circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${seg.strokeLength} ${seg.gapLength}`}
            strokeLinecap="butt"
            rotation={seg.rotation}
            origin={`${CENTER}, ${CENTER}`}
          />
        ))}
      </Svg>

      {/* Center label (absolutely positioned) */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            marginBottom: 2,
          }}
        >
          {topCategory?.name ?? ""}
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "300",
            color: "#111827",
            letterSpacing: -0.5,
          }}
        >
          {topCategory?.percentage ?? 0}%
        </Text>
      </View>
    </View>
  );
}

interface PerformanceBar {
  label: string;
  heightPct: number;
  isActive: boolean;
  isFuture: boolean;
}

function PerformanceHistory({ bars }: { bars: PerformanceBar[] }) {
  const MAX_HEIGHT = 120;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        height: MAX_HEIGHT + 32,
        gap: 32,
        paddingHorizontal: 16,
      }}
    >
      {bars.map((bar) => (
        <View
          key={bar.label}
          style={{ flex: 1, alignItems: "center", gap: 16 }}
        >
          <View
            style={{
              width: "100%",
              height: MAX_HEIGHT * (bar.heightPct / 100),
              borderRadius: 3,
              backgroundColor: bar.isFuture
                ? "transparent"
                : bar.isActive
                  ? "#1A1A1A"
                  : "#F1F5F9",
              borderWidth: bar.isFuture ? 1 : 0,
              borderColor: bar.isFuture ? "#E2E8F0" : "transparent",
              borderStyle: bar.isFuture ? "dashed" : "solid",
            }}
          />
          <Text
            style={{
              fontSize: 10,
              fontWeight: bar.isActive ? "700" : "600",
              color: bar.isActive
                ? "#1A1A1A"
                : bar.isFuture
                  ? "#CBD5E1"
                  : "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {bar.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ReportsScreen({
  totalSpend,
  percentageDecrease,
  selectedPeriod,
  categories,
  insights,
  breakdown,
  onPeriodChange,
  onBackPress,
  onAddPress,
}: ReportsScreenProps) {
  const insets = useSafeAreaInsets();

  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(totalSpend);

  const performanceBars: PerformanceBar[] = [
    { label: "Set", heightPct: 100, isActive: false, isFuture: false },
    { label: "Out", heightPct: 84, isActive: true, isFuture: false },
    { label: "Nov", heightPct: 60, isActive: false, isFuture: true },
  ];

  const PERIOD_LABELS: Record<string, string> = {
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal",
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.85)",
          paddingTop: insets.top,
          paddingHorizontal: 24,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 16,
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
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </Pressable>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              letterSpacing: -0.2,
              color: "#111827",
            }}
          >
            Insights Financeiros
          </Text>

          <Pressable
            style={({ pressed }) => ({
              padding: 8,
              marginRight: -8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="calendar-outline" size={20} color="#374151" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Period Tabs ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 32,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            {(["daily", "weekly", "monthly"] as const).map((period) => {
              const isActive = selectedPeriod === period;
              return (
                <Pressable
                  key={period}
                  onPress={() => onPeriodChange?.(period)}
                  style={{
                    paddingBottom: 12,
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: isActive ? "#1A1A1A" : "transparent",
                    marginBottom: -1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? "600" : "500",
                      color: isActive ? "#1A1A1A" : "#94A3B8",
                    }}
                  >
                    {PERIOD_LABELS[period]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Total Monthly Spend ── */}
        <View
          style={{
            marginTop: 48,
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            Gasto Mensal Total
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "300",
              letterSpacing: -1.5,
              color: "#1A1A1A",
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
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#64748B",
              }}
            >
              Reduziu em
            </Text>
            <View
              style={{
                backgroundColor: "#F1F5F9",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 9999,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#1A1A1A",
                }}
              >
                {percentageDecrease}%
              </Text>
            </View>
          </View>
        </View>

        {/* ── Donut Chart ── */}
        <View
          style={{
            marginTop: 48,
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <DonutChart categories={categories} />

          {/* Legend */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 0,
              marginTop: 32,
              width: "100%",
            }}
          >
            {categories.map((cat, i) => {
              const formattedAmt = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(cat.amount);

              return (
                <View
                  key={i}
                  style={{
                    width: "50%",
                    paddingHorizontal: 8,
                    marginBottom: 24,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: cat.color,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {cat.name}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {formattedAmt}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Performance History ── */}
        <View style={{ marginTop: 64, paddingHorizontal: 24 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 32,
            }}
          >
            Histórico de Performance
          </Text>
          <PerformanceHistory bars={performanceBars} />
        </View>

        {/* ── Key Insights ── */}
        <View style={{ marginTop: 64 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Principais Insights
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              gap: 16,
              paddingBottom: 8,
            }}
          >
            {insights.map((insight) => (
              <View
                key={insight.id}
                style={{
                  minWidth: 260,
                  backgroundColor: insight.bgColor,
                  borderRadius: 24,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.4)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                {/* Icon box */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: `${insight.color}28`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name={insight.icon}
                    size={20}
                    color={insight.color}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: insight.color,
                    marginBottom: 8,
                  }}
                >
                  {insight.title}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 18,
                    color: `${insight.color}99`,
                  }}
                >
                  {insight.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Detailed Breakdown ── */}
        <View
          style={{
            marginTop: 64,
            paddingHorizontal: 24,
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 32,
            }}
          >
            Detalhamento
          </Text>

          <View style={{ gap: 32 }}>
            {breakdown.map((item) => {
              const formattedAmt = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.amount);

              return (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Left */}
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
                        backgroundColor: "#F9F9F9",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={item.icon} size={18} color="#94A3B8" />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#94A3B8",
                          marginTop: 1,
                        }}
                      >
                        {item.transactionCount} Transações
                      </Text>
                    </View>
                  </View>

                  {/* Right */}
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {formattedAmt}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color:
                          item.percentageChange > 0 ? "#EF4444" : "#10B981",
                        marginTop: 1,
                      }}
                    >
                      {item.percentageChange > 0 ? "+" : ""}
                      {item.percentageChange}%
                    </Text>
                  </View>
                </View>
              );
            })}
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
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#1A1A1A",
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
