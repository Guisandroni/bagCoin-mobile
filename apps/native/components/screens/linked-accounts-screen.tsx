import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard, Badge } from "../ui";
import { BankAccountCard } from "../accounts/bank-account-card";
import { CreditCardItem } from "../accounts/credit-card-item";

interface BankAccount {
  id: number;
  name: string;
  bankName: string;
  lastFourDigits?: string;
  balance: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  lastSync?: string;
}

interface CreditCard {
  id: number;
  name: string;
  lastFourDigits?: string;
  currentBalance: number;
  creditLimit?: number;
  dueDay?: number;
  color: string;
}

interface LinkedAccountsScreenProps {
  totalBalance: number;
  percentageChange: number;
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  onAddConnection?: () => void;
  onAccountPress?: (id: number) => void;
  onCardPress?: (id: number) => void;
  onRefresh?: (id: number) => void;
  onPayCard?: (id: number) => void;
  onBackPress?: () => void;
}

export function LinkedAccountsScreen({
  totalBalance,
  percentageChange,
  bankAccounts,
  creditCards,
  onAddConnection,
  onAccountPress,
  onCardPress,
  onRefresh,
  onPayCard,
  onBackPress,
}: LinkedAccountsScreenProps) {
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalBalance);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <View className="flex-row items-center px-6 py-4 justify-between">
          <Pressable
            onPress={onBackPress}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </Pressable>
          <Text className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
            Contas Vinculadas
          </Text>
          <Pressable className="w-10 h-10 rounded-full items-center justify-center">
            <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Total Balance */}
        <View className="py-8 items-center">
          <Text className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Saldo Total
          </Text>
          <Text className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {formattedBalance}
          </Text>
          <View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full mt-3">
            <Ionicons name="trending-up" size={14} color="#10b981" />
            <Text className="text-emerald-500 text-xs font-bold">
              +{percentageChange}% este mês
            </Text>
          </View>
        </View>

        {/* Bank Accounts */}
        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Contas Bancárias
            </Text>
            <Text className="text-xs font-bold text-slate-400">
              {bankAccounts.length} Conectadas
            </Text>
          </View>
          <View className="gap-5">
            {bankAccounts.map((account) => (
              <BankAccountCard
                key={account.id}
                {...account}
                onPress={() => onAccountPress?.(account.id)}
                onRefresh={() => onRefresh?.(account.id)}
              />
            ))}
          </View>
        </View>

        {/* Credit Cards */}
        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Cartões de Crédito
            </Text>
            <Text className="text-xs font-bold text-slate-400">
              {creditCards.length} Conectado{creditCards.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View className="gap-5">
            {creditCards.map((card) => (
              <CreditCardItem
                key={card.id}
                {...card}
                onPress={() => onCardPress?.(card.id)}
                onPayPress={() => onPayCard?.(card.id)}
              />
            ))}
          </View>
        </View>

        {/* Add Connection */}
        <View className="gap-4">
          <Pressable
            onPress={onAddConnection}
            className="flex-row items-center justify-center gap-3 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Ionicons name="link" size={24} color="#374151" />
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              Adicionar Nova Conexão
            </Text>
          </Pressable>
          <View className="flex-row items-center justify-center gap-2 opacity-40">
            <Ionicons name="lock-closed" size={14} color="#64748b" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Protocolo Open Finance Seguro
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
