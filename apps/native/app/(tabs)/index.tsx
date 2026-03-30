import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";

const ACCOUNTS = [
  { id: "all", name: "Todas as contas", balance: 3200 },
  {
    id: "bradesco",
    name: "Bradesco",
    balance: 3200,
    icon: "business-outline" as const,
    iconColor: "#94A3B8",
  },
  {
    id: "nubank",
    name: "Nubank",
    balance: 1500,
    icon: "ellipse" as const,
    iconColor: "#C084FC",
  },
  {
    id: "santander",
    name: "Santander",
    balance: 700,
    icon: "diamond-outline" as const,
    iconColor: "#EF4444",
  },
];

const CREDIT_CARDS = [
  {
    id: "1",
    name: "Nubank Master",
    lastDigits: "4821",
    usedPercent: 56,
    used: 2800,
    limit: 5000,
    brandColor: "#A855F7",
    brandBg: "rgba(147,51,234,0.15)",
  },
  {
    id: "2",
    name: "Bradesco Visa",
    lastDigits: "9902",
    usedPercent: 91,
    used: 4100,
    limit: 4500,
    brandColor: "#F87171",
    brandBg: "rgba(239,68,68,0.15)",
  },
];

const TRANSACTIONS = [
  {
    id: "1",
    title: "iFood",
    category: "Alimentação",
    time: "18:42",
    amount: -42.9,
    icon: "restaurant" as const,
    iconColor: "#EF4444",
    iconBg: "rgba(239,68,68,0.12)",
  },
  {
    id: "2",
    title: "Uber",
    category: "Transporte",
    time: "15:10",
    amount: -18.5,
    icon: "car" as const,
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,0.15)",
  },
  {
    id: "3",
    title: "Salário Bag Coin",
    category: "Renda",
    time: "05 Mar",
    amount: 4500,
    icon: "wallet" as const,
    iconColor: "#EEC05C",
    iconBg: "rgba(238,192,92,0.15)",
  },
  {
    id: "4",
    title: "Netflix",
    category: "Assinaturas",
    time: "02 Mar",
    amount: -55.9,
    icon: "tv" as const,
    iconColor: "#EF4444",
    iconBg: "rgba(239,68,68,0.12)",
  },
  {
    id: "5",
    title: "Freelance UI",
    category: "Renda Extra",
    time: "01 Mar",
    amount: 700,
    icon: "briefcase" as const,
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,0.15)",
  },
];

const MONTH_INCOME = 5200;
const MONTH_EXPENSE = 3750;
const MONTH_TOTAL = MONTH_INCOME + MONTH_EXPENSE;
const INCOME_PERCENT = (MONTH_INCOME / MONTH_TOTAL) * 100;

const formatMoney = (value: number): string =>
  `R$ ${Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

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
      <Text style={{ color: "#475569", fontSize: 12 }}>Março 2026</Text>
    </View>

    <Pressable style={{ padding: 8, borderRadius: 20 }}>
      <Ionicons color="#ADC6FF" name="notifications-outline" size={24} />
      <View
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          backgroundColor: "#EF4444",
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>
          3
        </Text>
      </View>
    </Pressable>
  </View>
);

const AccountSelector = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) => (
  <ScrollView
    contentContainerStyle={{ gap: 10, paddingHorizontal: 24 }}
    horizontal
    showsHorizontalScrollIndicator={false}
    style={{ marginTop: 16 }}
  >
    {ACCOUNTS.map((account) => {
      const isActive = selected === account.id;
      const hasIcon = "icon" in account;

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
          {hasIcon && "iconColor" in account ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 4,
              }}
            >
              <Ionicons
                color={isActive ? "#FFFFFF" : (account.iconColor as string)}
                name={account.icon as keyof typeof Ionicons.glyphMap}
                size={14}
              />
              <Text
                style={{
                  color: isActive ? "#FFFFFF" : "#94A3B8",
                  fontSize: 12,
                  fontWeight: "500",
                }}
              >
                {account.name}
              </Text>
            </View>
          ) : (
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
          )}
          <Text
            style={{
              color: isActive ? "#FFFFFF" : "#94A3B8",
              fontSize: 10,
              fontFamily: "monospace",
            }}
          >
            R$ {account.balance.toLocaleString("pt-BR")}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const HeroBalanceCard = () => {
  const [visible, setVisible] = useState(true);

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
          {visible ? "R$ 8.450,00" : "••••••"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons color="#10B981" name="trending-up" size={16} />
          <Text style={{ color: "#10B981", fontSize: 12 }}>
            12% vs mês anterior
          </Text>
        </View>
      </View>
    </View>
  );
};

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

const MonthSummary = () => (
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
          R$ 5.200
        </Text>
        <Text
          style={{ color: "#EF4444", fontSize: 13, fontFamily: "monospace" }}
        >
          R$ 3.750
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
            width: `${INCOME_PERCENT}%`,
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

const CreditCardsSection = () => (
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
      {CREDIT_CARDS.map(
        ({
          id,
          name,
          lastDigits,
          usedPercent,
          used,
          limit,
          brandColor,
          brandBg,
        }) => {
          const isHigh = usedPercent > 80;
          const barColor = isHigh ? "#EF4444" : "#ADC6FF";
          const percentColor = isHigh ? "#EF4444" : "#94A3B8";

          return (
            <View
              key={id}
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
                    {name}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                >
                  •• {lastDigits}
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
                    Limite usado: {usedPercent}%
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    R$ {used.toLocaleString("pt-BR")}
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
                      width: `${usedPercent}%`,
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
                  Total R$ {limit.toLocaleString("pt-BR")}
                </Text>
              </View>
            </View>
          );
        }
      )}
    </ScrollView>
  </View>
);

const TransactionItem = ({
  title,
  category,
  time,
  amount,
  icon,
  iconColor,
  iconBg,
}: {
  title: string;
  category: string;
  time: string;
  amount: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}) => {
  const isIncome = amount > 0;

  return (
    <View
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
        <Ionicons color={iconColor} name={icon} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#F1F5F9", fontSize: 14, fontWeight: "500" }}>
          {title}
        </Text>
        <Text style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
          {time} • {category}
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
        {formatMoney(amount)}
      </Text>
    </View>
  );
};

const TransactionsSection = () => (
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

    <View style={{ gap: 12 }}>
      {TRANSACTIONS.map((tx) => (
        <TransactionItem
          amount={tx.amount}
          category={tx.category}
          icon={tx.icon}
          iconBg={tx.iconBg}
          iconColor={tx.iconColor}
          key={tx.id}
          time={tx.time}
          title={tx.title}
        />
      ))}
    </View>
  </View>
);

export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const [selectedAccount, setSelectedAccount] = useState("all");

  const userName = session?.user?.name ?? "Guilherme";

  return (
    <Container>
      <Header userName={userName} />
      <AccountSelector
        onSelect={setSelectedAccount}
        selected={selectedAccount}
      />
      <HeroBalanceCard />
      <QuickActions />
      <MonthSummary />
      <CreditCardsSection />
      <TransactionsSection />
      <View style={{ height: 32 }} />
    </Container>
  );
}
