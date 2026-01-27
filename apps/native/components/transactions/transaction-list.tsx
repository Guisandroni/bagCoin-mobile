import { View, Text, Pressable } from "react-native";
import { TransactionItem } from "./transaction-item";
import { Ionicons } from "@expo/vector-icons";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "expense" | "income";
  date: Date;
  categoryIcon?: keyof typeof Ionicons.glyphMap;
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (id: number) => void;
  onViewAllPress?: () => void;
  showHeader?: boolean;
  headerTitle?: string;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hoje • ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Ontem • ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  } else {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }
};

export function TransactionList({
  transactions,
  onTransactionPress,
  onViewAllPress,
  showHeader = true,
  headerTitle = "Atividade Recente",
}: TransactionListProps) {
  return (
    <View className="gap-2.5">
      {/* Header */}
      {showHeader && (
        <View className="flex-row items-center justify-between">
          {/* Title: text-[9px] font-extrabold uppercase tracking-widest */}
          <Text className="text-slate-900 text-[9px] font-extrabold uppercase tracking-widest">
            {headerTitle}
          </Text>
          {/* Button: text-[9px] font-bold uppercase */}
          <Pressable onPress={onViewAllPress}>
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Ver Tudo
            </Text>
          </Pressable>
        </View>
      )}

      {/* Transaction list: space-y-1 */}
      <View className="gap-1">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            icon={transaction.categoryIcon ?? "cash-outline"}
            title={transaction.description}
            subtitle={formatDate(transaction.date)}
            amount={transaction.amount}
            type={transaction.type}
            onPress={() => onTransactionPress?.(transaction.id)}
          />
        ))}
      </View>
    </View>
  );
}
