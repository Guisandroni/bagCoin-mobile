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
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(balance);

  // Split into integer and decimal parts
  const parts = formattedBalance.replace("R$", "").trim().split(",");
  const integerPart = `R$ ${parts[0]}`;
  const decimalPart = parts[1] || "00";
  const isPositive = percentageChange >= 0;

  return (
    <View className="gap-2">
      {/* Label: text-[9px] font-bold uppercase tracking-widest */}
      <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-0.5">
        Saldo Financeiro
      </Text>

      {/* Balance row */}
      <View className="flex-row items-baseline gap-1">
        {/* Main balance: text-3xl font-extrabold tracking-tight */}
        <Text className="text-slate-900 tracking-tight text-3xl font-extrabold">
          {integerPart}
          {/* Decimal: text-xl font-semibold text-slate-400 */}
          <Text className="text-slate-400 text-xl font-semibold">,{decimalPart}</Text>
        </Text>

        {/* Percentage badge */}
        {percentageChange !== 0 && (
          <View className="flex-row items-center bg-emerald-50 px-1.5 py-0.5 rounded-md ml-1">
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={isPositive ? "#059669" : "#dc2626"}
            />
            <Text
              className={`text-[10px] font-bold ml-0.5 ${
                isPositive ? "text-emerald-600" : "text-red-600"
              }`}
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
