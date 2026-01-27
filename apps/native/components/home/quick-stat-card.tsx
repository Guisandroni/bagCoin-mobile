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
    // glass-card: bg-white/70 backdrop-blur-xl border border-white/60
    // proportional-square: aspect-ratio ~1.1
    <View
      className="flex-1 bg-white/70 border border-white/60 rounded-xl p-4 justify-between"
      style={{ aspectRatio: 1.1 }}
    >
      {/* Header row */}
      <View className="flex-row justify-between items-start">
        {/* Icon container: size-8 rounded-lg bg-white/50 */}
        <View className="w-8 h-8 rounded-lg bg-white/50 items-center justify-center border border-white/60">
          <Ionicons name={icon} size={18} color="#64748b" />
        </View>
        {/* Label: text-[8px] font-bold uppercase tracking-wider */}
        <Text className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </Text>
      </View>

      {/* Value section */}
      <View>
        {/* Title: text-[10px] font-semibold */}
        <Text className="text-[10px] text-slate-500 font-semibold mb-0.5">
          {title}
        </Text>
        {/* Value: text-lg font-extrabold */}
        <Text className="text-lg font-extrabold text-slate-900">
          {value}
        </Text>
      </View>

      {/* Progress bar: h-1 rounded-full */}
      <View className="w-full bg-slate-100/50 h-1 rounded-full overflow-hidden">
        <View
          className="bg-black h-full rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </View>
    </View>
  );
}
