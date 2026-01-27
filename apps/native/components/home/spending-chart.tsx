import { View, Text } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";

interface SpendingChartProps {
  data?: number[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    // glass-card: bg-white/70 backdrop-blur-xl border border-white/60
    <View className="relative h-16 w-full bg-white/70 border border-white/60 rounded-xl p-3 overflow-hidden">
      {/* Chart SVG */}
      <View className="absolute inset-0 items-center justify-center">
        <Svg width="100%" height={40} viewBox="0 0 400 100" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#E2E8F0" stopOpacity={0.1} />
              <Stop offset="50%" stopColor="#1A1A1A" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#E2E8F0" stopOpacity={0.1} />
            </LinearGradient>
          </Defs>
          <Path
            d="M0,70 Q50,70 80,40 T150,50 T220,30 T300,80 T350,20 T400,50"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={1.5}
          />
          <Circle cx={350} cy={20} r={2.5} fill="#000000" />
        </Svg>
      </View>

      {/* Time labels */}
      <View className="mt-auto flex-row justify-between px-1 relative z-10">
        <Text className="text-[8px] text-slate-300 font-bold uppercase">00:00</Text>
        <Text className="text-[8px] text-slate-300 font-bold uppercase">12:00</Text>
        <Text className="text-[8px] text-black font-extrabold uppercase tracking-widest">Agora</Text>
      </View>
    </View>
  );
}
