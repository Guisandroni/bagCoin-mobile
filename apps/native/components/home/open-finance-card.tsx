import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OpenFinanceCardProps {
  integrationsCount: number;
  onPress?: () => void;
}

export function OpenFinanceCard({
  integrationsCount,
  onPress,
}: OpenFinanceCardProps) {
  return (
    // glass-card: bg-white/70 backdrop-blur-xl border border-white/60
    <View className="bg-white/70 border border-white/80 rounded-xl p-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        {/* Icon: size-9 bg-slate-900 rounded-lg */}
        <View className="w-9 h-9 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
          <Ionicons name="git-network-outline" size={18} color="#ffffff" />
        </View>
        <View>
          {/* Title: text-xs font-bold */}
          <Text className="text-xs font-bold text-slate-900 leading-none mb-0.5">
            Open Finance
          </Text>
          {/* Subtitle: text-[10px] font-medium */}
          <Text className="text-[10px] text-slate-500 font-medium">
            {integrationsCount} integrações ativas
          </Text>
        </View>
      </View>

      {/* Arrow button: size-7 rounded-lg */}
      <Pressable
        onPress={onPress}
        className="w-7 h-7 items-center justify-center rounded-lg border border-slate-100 bg-white"
      >
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </Pressable>
    </View>
  );
}
