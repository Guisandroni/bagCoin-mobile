import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBankAccounts, useCreditCards } from "@/hooks/use-api";

interface Account {
  balance: number;
  expensePercent: number;
  expenses: number;
  id: string;
  income: number;
  incomePercent: number;
  logoBg: string;
  logoText: string;
  name: string;
  type: string;
}

interface CreditCard {
  available: number;
  availableColor: string;
  barColor: string;
  brandType: "mastercard" | "visa";
  id: string;
  lastDigits: string;
  limit: number;
  logoBg: string;
  name: string;
  used: number;
  usedPercent: number;
}

const fmt = (v: number): string =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const SectionBadge = ({ count }: { count: string }) => (
  <View
    style={{
      backgroundColor: "#2D3542",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    }}
  >
    <Text
      style={{
        fontFamily: "monospace",
        fontSize: 13,
        fontWeight: "600",
        color: "#ADC6FF",
      }}
    >
      {count}
    </Text>
  </View>
);

const AccountCard = ({ account }: { account: Account }) => (
  <View
    style={{
      backgroundColor: "#1E2D3D",
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: account.logoBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
            {account.logoText}
          </Text>
        </View>
        <View>
          <Text style={{ color: "#F1F5F9", fontWeight: "700", fontSize: 16 }}>
            {account.name}
          </Text>
          <Text
            style={{
              color: "#C2C6D6",
              fontSize: 10,
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginTop: 2,
            }}
          >
            {account.type}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Pressable hitSlop={6} style={{ padding: 6 }}>
          <Ionicons color="#8C909F" name="eye-outline" size={18} />
        </Pressable>
        <Pressable hitSlop={6} style={{ padding: 6 }}>
          <Ionicons color="#8C909F" name="create-outline" size={18} />
        </Pressable>
        <Pressable hitSlop={6} style={{ padding: 6 }}>
          <Ionicons color="#8C909F" name="trash-outline" size={18} />
        </Pressable>
      </View>
    </View>

    <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 4 }}>
      Saldo disponível
    </Text>
    <Text
      style={{
        fontFamily: "monospace",
        fontSize: 24,
        fontWeight: "700",
        color: "#F1F5F9",
        marginBottom: 20,
      }}
    >
      R$ {fmt(account.balance)}
    </Text>

    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>DESPESAS</Text>
        <Text
          style={{ fontFamily: "monospace", fontSize: 12, color: "#EF4444" }}
        >
          R$ {fmt(account.expenses)} {account.expensePercent}%
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#EF4444",
            width: `${Math.min(account.expensePercent, 100)}%`,
          }}
        />
      </View>
    </View>

    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>RECEITAS</Text>
        <Text
          style={{ fontFamily: "monospace", fontSize: 12, color: "#10B981" }}
        >
          R$ {fmt(account.income)} {account.incomePercent}%
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#10B981",
            width: `${Math.min(account.incomePercent, 100)}%`,
          }}
        />
      </View>
    </View>
  </View>
);

const MastercardLogo = () => (
  <View
    style={{
      width: 40,
      height: 24,
      borderRadius: 4,
      backgroundColor: "#8A05BE",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#EB001B",
        opacity: 0.9,
      }}
    />
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#F79E1B",
        opacity: 0.9,
        marginLeft: -5,
      }}
    />
  </View>
);

const VisaLogo = () => (
  <View
    style={{
      width: 40,
      height: 24,
      borderRadius: 4,
      backgroundColor: "#1A1F71",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: 8,
        fontWeight: "700",
        fontStyle: "italic",
      }}
    >
      VISA
    </Text>
  </View>
);

const CreditCardItem = ({ card }: { card: CreditCard }) => {
  const isHighUsage = card.usedPercent > 80;

  return (
    <View
      style={{
        backgroundColor: "rgba(34,42,55,0.4)",
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {card.brandType === "mastercard" ? <MastercardLogo /> : <VisaLogo />}
          <View>
            <Text style={{ color: "#F1F5F9", fontWeight: "700", fontSize: 16 }}>
              {card.name}
            </Text>
            <Text
              style={{
                fontFamily: "monospace",
                color: "#94A3B8",
                fontSize: 13,
              }}
            >
              •••• {card.lastDigits}
            </Text>
          </View>
        </View>
        <Ionicons color="#475569" name="card-outline" size={24} />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          USO DO LIMITE
        </Text>
        <Text style={{ color: card.barColor, fontSize: 16, fontWeight: "700" }}>
          {card.usedPercent}%
        </Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.06)",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: card.barColor,
            width: `${Math.min(card.usedPercent, 100)}%`,
            shadowColor: card.barColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 4,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <View>
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 11,
              fontWeight: "500",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            USADO
          </Text>
          <Text
            style={{
              fontFamily: "monospace",
              color: "#F1F5F9",
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            R$ {fmt(card.used)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 11,
              fontWeight: "500",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            DISPONÍVEL
          </Text>
          <Text
            style={{
              fontFamily: "monospace",
              color: card.availableColor,
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            R$ {fmt(card.available)}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: isHighUsage ? undefined : "#060F1A",
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
          borderWidth: isHighUsage ? 1 : 0,
          borderColor: isHighUsage ? "rgba(239,68,68,0.1)" : "transparent",
        }}
      >
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 11,
            fontWeight: "500",
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          LIMITE TOTAL
        </Text>
        <Text
          style={{
            fontFamily: "monospace",
            color: "#F1F5F9",
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          R$ {fmt(card.limit)}
        </Text>
      </View>
    </View>
  );
};

const AccountsScreen = () => {
  const { data: bankAccounts, isLoading: loadingAccounts } = useBankAccounts();
  const { data: creditCards, isLoading: loadingCards } = useCreditCards();

  const accounts = (bankAccounts ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type.toUpperCase(),
    logoBg: a.color ?? "#3B82F6",
    logoText: a.name.charAt(0).toUpperCase(),
    balance: a.balance,
    expenses: 0,
    expensePercent: 0,
    income: 0,
    incomePercent: 0,
  }));

  const cards = (creditCards ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    brandType: "mastercard" as const,
    logoBg: c.color ?? "#8A05BE",
    lastDigits: c.lastDigits,
    limit: c.creditLimit,
    used: c.usedAmount,
    available: c.creditLimit - c.usedAmount,
    usedPercent:
      c.creditLimit > 0 ? Math.round((c.usedAmount / c.creditLimit) * 100) : 0,
    barColor:
      c.creditLimit > 0 && c.usedAmount / c.creditLimit > 0.8
        ? "#EF4444"
        : "#F59E0B",
    availableColor:
      c.creditLimit > 0 && c.usedAmount / c.creditLimit > 0.8
        ? "#EF4444"
        : "#10B981",
  }));

  const isLoading = loadingAccounts || loadingCards;

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1420" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 24,
            }}
          >
            <Pressable
              hitSlop={8}
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons color="#F1F5F9" name="arrow-back" size={24} />
            </Pressable>
            <Text style={{ color: "#ADC6FF", fontWeight: "700", fontSize: 20 }}>
              Contas e Cartões
            </Text>
            <Pressable
              hitSlop={4}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "rgba(173,198,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons color="#ADC6FF" name="add" size={24} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <ActivityIndicator color="#ADC6FF" size="large" />
            </View>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 20,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: "#F1F5F9", fontWeight: "600", fontSize: 18 }}
                >
                  Contas
                </Text>
                <SectionBadge count={String(accounts.length)} />
              </View>

              {accounts.length === 0 ? (
                <View
                  style={{
                    paddingHorizontal: 20,
                    alignItems: "center",
                    paddingVertical: 32,
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                    Nenhuma conta cadastrada
                  </Text>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 20, gap: 12 }}>
                  {accounts.map((account) => (
                    <AccountCard account={account} key={account.id} />
                  ))}
                </View>
              )}

              <View style={{ height: 32 }} />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 20,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: "#F1F5F9", fontWeight: "600", fontSize: 18 }}
                >
                  Cartões de Crédito
                </Text>
                <SectionBadge count={String(cards.length)} />
              </View>

              {cards.length === 0 ? (
                <View
                  style={{
                    paddingHorizontal: 20,
                    alignItems: "center",
                    paddingVertical: 32,
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                    Nenhum cartão cadastrado
                  </Text>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 20, gap: 12 }}>
                  {cards.map((card) => (
                    <CreditCardItem card={card} key={card.id} />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AccountsScreen;
