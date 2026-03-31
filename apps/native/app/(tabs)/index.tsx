import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Container } from "@/components/container";
import {
  useDashboardCreditCards,
  useDashboardRecent,
  useDashboardSummary,
  useMonthlySummary,
} from "@/hooks/use-api";
import { authClient } from "@/lib/auth-client";

const formatMoney = (value: number): string =>
  `R$ ${Math.abs(value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const QUICK_ACTIONS = [
  {
    label: "Despesa",
    icon: "remove-circle" as const,
    color: "#EF4444",
    route: "/add-expense",
  },
  {
    label: "Receita",
    icon: "add-circle" as const,
    color: "#10B981",
    route: "/add-receipt",
  },
  {
    label: "Importar",
    icon: "cloud-upload" as const,
    color: "#3B82F6",
    route: "/import-statement",
  },
  {
    label: "Transferir",
    icon: "swap-horizontal" as const,
    color: "#D4A847",
    route: undefined,
  },
] as const;

function getCategoryIcon(name?: string): keyof typeof Ionicons.glyphMap {
  if (!name) {
    return "cash";
  }
  const lower = name.toLowerCase();
  if (lower.includes("aliment") || lower.includes("comida")) {
    return "restaurant";
  }
  if (lower.includes("transport")) {
    return "car";
  }
  if (lower.includes("moradia") || lower.includes("aluguel")) {
    return "home";
  }
  if (lower.includes("salário") || lower.includes("salario")) {
    return "wallet";
  }
  if (lower.includes("invest")) {
    return "trending-up";
  }
  if (lower.includes("freelance")) {
    return "briefcase";
  }
  if (lower.includes("supermerc")) {
    return "cart";
  }
  if (lower.includes("assinatur") || lower.includes("netflix")) {
    return "tv";
  }
  if (lower.includes("saúde") || lower.includes("saude")) {
    return "medkit";
  }
  return "cash";
}

const Header = ({ userName }: { userName: string }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
    }}
  >
    <Pressable
      onPress={() => router.push("/(tabs)/profile")}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#D4A847",
        backgroundColor: "#1E2D3D",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#D4A847", fontSize: 16, fontWeight: "700" }}>
        {userName.charAt(0).toUpperCase()}
      </Text>
    </Pressable>

    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "500" }}>
        Olá, {userName}
      </Text>
      <Text style={{ color: "#475569", fontSize: 12 }}>
        {new Date().toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })}
      </Text>
    </View>

    <Pressable style={{ padding: 8, borderRadius: 20 }}>
      <Ionicons color="#ADC6FF" name="notifications-outline" size={24} />
    </Pressable>
  </View>
);

const AccountSelector = ({
  accounts,
  selected,
  onSelect,
}: {
  accounts: Array<{ id: string; name: string; balance: number; type: string }>;
  selected: string;
  onSelect: (id: string) => void;
}) => {
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const allAccounts = [
    { id: "all", name: "Todas as contas", balance: totalBalance, type: "all" },
    ...accounts,
  ];

  return (
    <ScrollView
      contentContainerStyle={{ gap: 10, paddingHorizontal: 24 }}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 16 }}
    >
      {allAccounts.map((account) => {
        const isActive = selected === account.id;
        return (
          <Pressable
            key={account.id}
            onPress={() => onSelect(account.id)}
            style={{
              backgroundColor: isActive ? "#3B82F6" : "#1E2D3D",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              minWidth: 90,
            }}
          >
            <Text
              style={{
                color: isActive ? "#FFFFFF" : "#94A3B8",
                fontSize: 12,
                fontWeight: "500",
                marginBottom: 4,
              }}
            >
              {account.name}
            </Text>
            <Text
              style={{
                color: isActive ? "#FFFFFF" : "#94A3B8",
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              {formatMoney(account.balance)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const HeroBalanceCard = ({
  totalBalance,
  changePercent,
}: {
  totalBalance: number;
  changePercent: number;
}) => {
  const [visible, setVisible] = useState(true);
  const isPositive = changePercent >= 0;

  return (
    <View
      style={{
        marginHorizontal: 24,
        marginTop: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#334155",
        overflow: "hidden",
      }}
    >
      <View style={{ backgroundColor: "#1E2D3D", padding: 24 }}>
        <View
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(173,198,255,0.05)",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "500" }}>
            Saldo Total
          </Text>
          <Pressable onPress={() => setVisible((v) => !v)}>
            <Ionicons
              color="#94A3B8"
              name={visible ? "eye-outline" : "eye-off-outline"}
              size={20}
            />
          </Pressable>
        </View>

        <Text
          style={{
            color: "#F1F5F9",
            fontSize: 36,
            fontWeight: "700",
            fontFamily: "monospace",
            letterSpacing: -1.5,
            marginBottom: 8,
          }}
        >
          {visible ? formatMoney(totalBalance) : "••••••"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons
            color={isPositive ? "#10B981" : "#EF4444"}
            name={isPositive ? "trending-up" : "trending-down"}
            size={16}
          />
          <Text
            style={{ color: isPositive ? "#10B981" : "#EF4444", fontSize: 12 }}
          >
            {Math.abs(changePercent)}% vs mês anterior
          </Text>
        </View>
      </View>
    </View>
  );
};

const QuickActions = () => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      marginTop: 28,
      marginBottom: 4,
    }}
  >
    {QUICK_ACTIONS.map(({ label, icon, color, route }) => (
      <Pressable
        key={label}
        onPress={route ? () => router.push(route as never) : undefined}
        style={{ alignItems: "center" }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#1E2D3D",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons color={color} name={icon} size={24} />
        </View>
        <Text style={{ color: "#94A3B8", fontSize: 11 }}>{label}</Text>
      </Pressable>
    ))}
  </View>
);

const MonthSummary = ({
  income,
  expenses,
  incomePercent,
}: {
  income: number;
  expenses: number;
  incomePercent: number;
}) => (
  <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
    <Text
      style={{
        color: "#F1F5F9",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 16,
      }}
    >
      Resumo do mês
    </Text>

    <View
      style={{
        backgroundColor: "#131C28",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(66,71,84,0.1)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text
          style={{ color: "#10B981", fontSize: 13, fontFamily: "monospace" }}
        >
          {formatMoney(income)}
        </Text>
        <Text
          style={{ color: "#EF4444", fontSize: 13, fontFamily: "monospace" }}
        >
          {formatMoney(expenses)}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          height: 12,
          borderRadius: 999,
          backgroundColor: "#060F1A",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${incomePercent || 50}%`,
            backgroundColor: "#10B981",
            borderTopLeftRadius: 999,
            borderBottomLeftRadius: 999,
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: "#EF4444",
            borderTopRightRadius: 999,
            borderBottomRightRadius: 999,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Text style={{ color: "#94A3B8", fontSize: 11 }}>Entradas</Text>
        <Text style={{ color: "#94A3B8", fontSize: 11 }}>Saídas</Text>
      </View>
    </View>
  </View>
);

const CreditCardsSection = ({
  cards,
}: {
  cards: Array<{
    id: string;
    name: string;
    lastDigits: string;
    creditLimit: number;
    usedAmount: number;
    usagePercent: number;
    color: string | null;
  }>;
}) => {
  if (cards.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
      <Text
        style={{
          color: "#F1F5F9",
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 16,
        }}
      >
        Meus Cartões
      </Text>

      <ScrollView
        contentContainerStyle={{ gap: 12 }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {cards.map((card) => {
          const isHigh = card.usagePercent > 80;
          const barColor = isHigh ? "#EF4444" : "#ADC6FF";
          const percentColor = isHigh ? "#EF4444" : "#94A3B8";
          const brandColor = card.color ?? "#A855F7";
          const brandBg = `${brandColor}26`;

          return (
            <View
              key={card.id}
              style={{
                minWidth: 280,
                backgroundColor: "#17202D",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(66,71,84,0.1)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: brandBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons color={brandColor} name="card" size={16} />
                  </View>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    {card.name}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                >
                  •• {card.lastDigits}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: percentColor, fontSize: 12 }}>
                    Limite usado: {card.usagePercent}%
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    {formatMoney(card.usedAmount)}
                  </Text>
                </View>

                <View
                  style={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: "#060F1A",
                  }}
                >
                  <View
                    style={{
                      width: `${card.usagePercent}%`,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: barColor,
                    }}
                  />
                </View>

                <Text
                  style={{
                    color: "#475569",
                    fontSize: 10,
                    fontFamily: "monospace",
                    textAlign: "right",
                  }}
                >
                  Total {formatMoney(card.creditLimit)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const TransactionsSection = ({
  transactions,
}: {
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    category?: { name: string; icon: string; color: string } | null;
  }>;
}) => (
  <View style={{ paddingHorizontal: 24, marginTop: 28, marginBottom: 16 }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <Text style={{ color: "#F1F5F9", fontSize: 16, fontWeight: "600" }}>
        Últimas transações
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/expenses")}
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <Text style={{ color: "#3B82F6", fontSize: 12, fontWeight: "500" }}>
          Ver todas →
        </Text>
      </Pressable>
    </View>

    {transactions.length === 0 ? (
      <View
        style={{
          backgroundColor: "#17202D",
          borderRadius: 16,
          padding: 32,
          alignItems: "center",
        }}
      >
        <Ionicons color="#475569" name="receipt-outline" size={40} />
        <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 12 }}>
          Nenhuma transação ainda
        </Text>
      </View>
    ) : (
      <View style={{ gap: 12 }}>
        {transactions.map((tx) => {
          const isIncome = tx.type === "income";
          const iconName = getCategoryIcon(tx.category?.name ?? tx.description);
          const iconColor = isIncome ? "#10B981" : "#EF4444";
          const iconBg = isIncome
            ? "rgba(16,185,129,0.15)"
            : "rgba(239,68,68,0.12)";

          return (
            <View
              key={tx.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#17202D",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: iconBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons color={iconColor} name={iconName} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#F1F5F9", fontSize: 14, fontWeight: "500" }}
                >
                  {tx.description}
                </Text>
                <Text style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                  {new Date(tx.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}{" "}
                  • {tx.category?.name ?? (isIncome ? "Receita" : "Despesa")}
                </Text>
              </View>
              <Text
                style={{
                  color: isIncome ? "#10B981" : "#EF4444",
                  fontSize: 14,
                  fontFamily: "monospace",
                  fontWeight: "700",
                }}
              >
                {isIncome ? "+" : "-"}
                {formatMoney(tx.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    )}
  </View>
);

export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const [selectedAccount, setSelectedAccount] = useState("all");

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: recentTx } = useDashboardRecent();
  const { data: monthlySummary } = useMonthlySummary();
  const { data: creditCards } = useDashboardCreditCards();

  const userName = session?.user?.name ?? "Usuário";

  if (summaryLoading) {
    return (
      <Container>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color="#ADC6FF" size="large" />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <Header userName={userName} />
      <AccountSelector
        accounts={summary?.accounts ?? []}
        onSelect={setSelectedAccount}
        selected={selectedAccount}
      />
      <HeroBalanceCard
        changePercent={summary?.changePercent ?? 0}
        totalBalance={summary?.totalBalance ?? 0}
      />
      <QuickActions />
      <MonthSummary
        expenses={monthlySummary?.expenses ?? 0}
        income={monthlySummary?.income ?? 0}
        incomePercent={monthlySummary?.incomePercent ?? 50}
      />
      <CreditCardsSection cards={creditCards ?? []} />
      <TransactionsSection transactions={recentTx ?? []} />
      <View style={{ height: 32 }} />
    </Container>
  );
}
