import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OpenFinanceCardProps {
  integrationsCount?: number;
  onPress?: () => void;
}

export function OpenFinanceCard({
  integrationsCount = 3,
  onPress,
}: OpenFinanceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.8)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Left: icon + text */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Dark icon container */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: "#0F172A",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="git-network" size={18} color="white" />
        </View>

        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#0F172A",
              lineHeight: 16,
              marginBottom: 1,
            }}
          >
            Open Finance
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              color: "#64748B",
            }}
          >
            {integrationsCount} integrações ativas
          </Text>
        </View>
      </View>

      {/* Right: chevron button */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: "#F1F5F9",
          backgroundColor: "white",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
      </View>
    </Pressable>
  );
}
