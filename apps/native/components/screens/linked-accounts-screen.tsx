import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  isSynced?: boolean;
}

interface CreditCard {
  id: number;
  name: string;
  lastFourDigits?: string;
  cardType?: string;
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
  const insets = useSafeAreaInsets();

  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(totalBalance);

  const isPositive = percentageChange >= 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: "rgba(249,250,251,0.85)",
          paddingTop: insets.top,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingVertical: 16,
          }}
        >
          {/* Back */}
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "transparent",
            })}
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </Pressable>

          {/* Title */}
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              letterSpacing: -0.3,
              color: "#111827",
            }}
          >
            Contas Vinculadas
          </Text>

          {/* More */}
          <Pressable
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "transparent",
            })}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Total Balance ── */}
        <View
          style={{
            paddingTop: 32,
            paddingBottom: 32,
            alignItems: "center",
          }}
        >
          {/* Label */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            Saldo Total
          </Text>

          {/* Amount */}
          <Text
            style={{
              fontSize: 40,
              fontWeight: "800",
              letterSpacing: -1,
              color: "#111827",
              lineHeight: 48,
            }}
          >
            {formattedBalance}
          </Text>

          {/* Change badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: isPositive
                ? "rgba(16, 185, 129, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              marginTop: 12,
            }}
          >
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={14}
              color={isPositive ? "#10B981" : "#EF4444"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: isPositive ? "#10B981" : "#EF4444",
              }}
            >
              {isPositive ? "+" : ""}
              {percentageChange}% este mês
            </Text>
          </View>
        </View>

        {/* ── Bank Accounts ── */}
        <View style={{ marginBottom: 40 }}>
          {/* Section header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#111827",
                letterSpacing: -0.3,
              }}
            >
              Contas Bancárias
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#94A3B8",
              }}
            >
              {bankAccounts.length} Conectada
              {bankAccounts.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Account cards */}
          <View style={{ gap: 20 }}>
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

        {/* ── Credit Cards ── */}
        <View style={{ marginBottom: 40 }}>
          {/* Section header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#111827",
                letterSpacing: -0.3,
              }}
            >
              Cartões de Crédito
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#94A3B8",
              }}
            >
              {creditCards.length} Conectado
              {creditCards.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Card items */}
          <View style={{ gap: 20 }}>
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

        {/* ── Add New Connection ── */}
        <View style={{ gap: 16 }}>
          <Pressable
            onPress={onAddConnection}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              paddingVertical: 20,
              borderRadius: 16,
              backgroundColor: pressed ? "#F9FAFB" : "white",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 1,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Ionicons name="link" size={24} color="#374151" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Adicionar Nova Conexão
            </Text>
          </Pressable>

          {/* Security note */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: 0.4,
            }}
          >
            <Ionicons name="lock-closed" size={12} color="#64748B" />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Protocolo Open Finance Seguro
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
