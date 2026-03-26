import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CreditCardItemProps {
  id: number;
  name: string;
  lastFourDigits?: string;
  cardType?: string;
  currentBalance: number;
  creditLimit?: number;
  dueDay?: number;
  color: string;
  onPress?: () => void;
  onPayPress?: () => void;
}

export function CreditCardItem({
  name,
  lastFourDigits,
  cardType,
  currentBalance,
  dueDay,
  color,
  onPress,
  onPayPress,
}: CreditCardItemProps) {
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(currentBalance);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
        borderLeftWidth: 4,
        borderLeftColor: color,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* ── Top row: icon + info + badge ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        {/* Icon + card info */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: color,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Ionicons name="card" size={24} color="white" />
          </View>

          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#111827",
                marginBottom: 2,
              }}
            >
              {name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {cardType ? `${cardType} ` : ""}
              {lastFourDigits ? `•••• ${lastFourDigits}` : ""}
            </Text>
          </View>
        </View>

        {/* Open Finance badge */}
        <View
          style={{
            backgroundColor: "#F1F5F9",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "700",
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              lineHeight: 13,
            }}
          >
            OPEN{"\n"}FINANCE
          </Text>
        </View>
      </View>

      {/* ── Bottom row: balance + pay button ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              letterSpacing: -0.5,
              color: "#111827",
            }}
          >
            {formattedBalance}
          </Text>
          {dueDay && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: "#94A3B8",
                marginTop: 4,
              }}
            >
              Vence em {dueDay} dias
            </Text>
          )}
        </View>

        <Pressable
          onPress={onPayPress}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: color === "#1A1A1A" ? "#111827" : color,
            borderRadius: 8,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "white",
            }}
          >
            Pagar Agora
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
