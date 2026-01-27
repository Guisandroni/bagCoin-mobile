import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "../ui";

interface BankAccountCardProps {
  id: number;
  name: string;
  bankName: string;
  lastFourDigits?: string;
  balance: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  lastSync?: string;
  onRefresh?: () => void;
  onPress?: () => void;
}

export function BankAccountCard({
  name,
  bankName,
  lastFourDigits,
  balance,
  color,
  icon,
  lastSync,
  onRefresh,
  onPress,
}: BankAccountCardProps) {
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(balance);

  return (
    <Pressable onPress={onPress}>
      <GlassCard className="p-6 gap-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center gap-4">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <Ionicons name={icon} size={24} color="#ffffff" />
            </View>
            <View>
              <Text className="font-bold text-base text-slate-900 dark:text-white">
                {name}
              </Text>
              <Text className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                {bankName} {lastFourDigits && `•••• ${lastFourDigits}`}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row justify-between items-end">
          <View>
            <Text className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {formattedBalance}
            </Text>
            {lastSync && (
              <View className="flex-row items-center gap-1.5 mt-1">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[11px] font-medium text-slate-400">
                  Atualizado {lastSync}
                </Text>
              </View>
            )}
          </View>
          {onRefresh && (
            <Pressable
              onPress={onRefresh}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 items-center justify-center"
            >
              <Ionicons name="refresh" size={18} color="#64748b" />
            </Pressable>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}
