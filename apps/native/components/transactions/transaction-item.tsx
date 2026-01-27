import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TransactionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  amount: number;
  type: "expense" | "income";
  onPress?: () => void;
}

export function TransactionItem({
  icon,
  title,
  subtitle,
  amount,
  type,
  onPress,
}: TransactionItemProps) {
  const isIncome = type === "income";
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(amount));

  return (
    // Container: p-2 rounded-xl bg-white/30 border border-white/20
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between p-2 rounded-xl bg-white/30 border border-white/20"
    >
      <View className="flex-row items-center gap-3">
        {/* Icon container: size-9 rounded-lg bg-white border border-slate-50 */}
        <View className="w-9 h-9 items-center justify-center rounded-lg bg-white border border-slate-50 shadow-sm">
          <Ionicons name={icon} size={18} color="#9ca3af" />
        </View>
        <View>
          {/* Title: text-xs font-bold */}
          <Text className="text-xs font-bold text-slate-900">{title}</Text>
          {/* Subtitle: text-[9px] font-medium uppercase tracking-tighter */}
          <Text className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
            {subtitle}
          </Text>
        </View>
      </View>
      {/* Amount: text-xs font-extrabold */}
      <Text
        className={`text-xs font-extrabold ${
          isIncome ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {isIncome ? "+" : "-"}{formattedAmount}
      </Text>
    </Pressable>
  );
}
