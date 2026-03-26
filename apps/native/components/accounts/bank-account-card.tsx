import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BankAccountCardProps {
  id: number;
  name: string;
  bankName: string;
  lastFourDigits?: string;
  balance: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  lastSync?: string;
  isSynced?: boolean;
  onPress?: () => void;
  onRefresh?: () => void;
}

export function BankAccountCard({
  name,
  bankName,
  lastFourDigits,
  balance,
  color,
  icon,
  lastSync,
  isSynced = true,
  onPress,
  onRefresh,
}: BankAccountCardProps) {
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(balance);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.4)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 2,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Top row: icon + name + bank */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {/* Colored icon */}
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
            <Ionicons name={icon} size={24} color="white" />
          </View>

          <View>
            <Text
              style={{
                fontWeight: "700",
                fontSize: 16,
                color: "#0F172A",
                letterSpacing: -0.2,
              }}
            >
              {name}
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 12,
                fontWeight: "500",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {bankName}
              {lastFourDigits ? ` •••• ${lastFourDigits}` : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom row: balance + sync */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View>
          {/* Balance */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              letterSpacing: -0.5,
              color: "#0F172A",
            }}
          >
            {formattedBalance}
          </Text>

          {/* Sync status */}
          {lastSync && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isSynced ? "#10B981" : "#94A3B8",
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: "#94A3B8",
                }}
              >
                Atualizado {lastSync}
              </Text>
            </View>
          )}
        </View>

        {/* Refresh button */}
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="refresh" size={18} color="#64748B" />
        </Pressable>
      </View>
    </Pressable>
  );
}
