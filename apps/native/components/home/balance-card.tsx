import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BalanceCardProps {
  balance: number;
  percentageChange?: number;
  currency?: string;
}

export function BalanceCard({
  balance,
  percentageChange = 0,
  currency = "BRL",
}: BalanceCardProps) {
  const isPositive = percentageChange >= 0;

  // Format the integer part
  const integerPart = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.floor(balance));

  // Get decimal part
  const decimalPart = (balance % 1).toFixed(2).slice(2);

  return (
    <View>
      {/* Label */}
      <Text
        style={{
          fontSize: 9,
          fontWeight: "700",
          color: "#94A3B8",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 2,
        }}
      >
        Financial Pulse
      </Text>

      {/* Balance row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 4,
          flexWrap: "wrap",
        }}
      >
        {/* Main amount */}
        <Text
          style={{
            color: "#0F172A",
            fontSize: 32,
            fontWeight: "800",
            letterSpacing: -1,
            lineHeight: 38,
          }}
        >
          R${integerPart}
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 20,
              fontWeight: "600",
              letterSpacing: -0.5,
            }}
          >
            ,{decimalPart}
          </Text>
        </Text>

        {/* Percentage badge */}
        {percentageChange !== 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isPositive ? "#ECFDF5" : "#FEF2F2",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              marginLeft: 4,
            }}
          >
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={isPositive ? "#059669" : "#DC2626"}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: isPositive ? "#059669" : "#DC2626",
                marginLeft: 2,
              }}
            >
              {isPositive ? "+" : ""}
              {percentageChange.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
