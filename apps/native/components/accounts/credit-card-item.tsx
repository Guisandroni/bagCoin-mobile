import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "../ui";

interface CreditCardItemProps {
  id: number;
  name: string;
  lastFourDigits?: string;
  currentBalance: number;
  creditLimit?: number;
  dueDay?: number;
  color: string;
  onPayPress?: () => void;
  onPress?: () => void;
}

export function CreditCardItem({
  name,
  lastFourDigits,
  currentBalance,
  creditLimit,
  dueDay,
  color,
  onPayPress,
  onPress,
}: CreditCardItemProps) {
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(currentBalance);

  const daysUntilDue = dueDay ? calculateDaysUntilDue(dueDay) : null;

  return (
    <Pressable onPress={onPress}>
      <GlassCard
        className="p-6 gap-4"
        style={{ borderLeftWidth: 4, borderLeftColor: color }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center gap-4">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <Ionicons name="card" size={24} color="#ffffff" />
            </View>
            <View>
              <Text className="font-bold text-base text-slate-900 dark:text-white">
                {name}
              </Text>
              <Text className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                {lastFourDigits && `•••• ${lastFourDigits}`}
              </Text>
            </View>
          </View>
          <View className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">
            <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              OPEN FINANCE
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between items-end">
          <View>
            <Text className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {formattedBalance}
            </Text>
            {daysUntilDue !== null && (
              <Text className="text-[11px] font-medium text-slate-400 mt-1">
                Vence em {daysUntilDue} dias
              </Text>
            )}
          </View>
          {onPayPress && (
            <Pressable
              onPress={onPayPress}
              className="px-4 py-2 bg-slate-900 dark:bg-white rounded-lg"
            >
              <Text className="text-xs font-bold text-white dark:text-slate-900">
                Pagar
              </Text>
            </Pressable>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}

function calculateDaysUntilDue(dueDay: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let dueDate: Date;
  if (currentDay <= dueDay) {
    dueDate = new Date(currentYear, currentMonth, dueDay);
  } else {
    dueDate = new Date(currentYear, currentMonth + 1, dueDay);
  }

  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
