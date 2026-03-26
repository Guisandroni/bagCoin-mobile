import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QuickStatCardProps {
  title: string;
  label: string;
  value: string;
  progress: number;
  icon: keyof typeof Ionicons.glyphMap;
}

export function QuickStatCard({
  title,
  label,
  value,
  progress,
  icon,
}: QuickStatCardProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.6)",
        padding: 16,
        aspectRatio: 1.1,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {/* Top row: icon + label */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Icon box */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.5)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={18} color="#64748B" />
        </View>

        {/* Label badge */}
        <Text
          style={{
            fontSize: 8,
            fontWeight: "700",
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {label}
        </Text>
      </View>

      {/* Middle: title + value */}
      <View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: "600",
            color: "#64748B",
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#0F172A",
            letterSpacing: -0.3,
          }}
        >
          {value}
        </Text>
      </View>

      {/* Bottom: progress bar */}
      <View
        style={{
          width: "100%",
          height: 4,
          backgroundColor: "rgba(241,245,249,0.5)",
          borderRadius: 9999,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${clampedProgress}%`,
            height: "100%",
            backgroundColor: "#0F172A",
            borderRadius: 9999,
          }}
        />
      </View>
    </View>
  );
}
