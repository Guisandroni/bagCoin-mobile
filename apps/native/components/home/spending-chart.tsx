import { View, Text } from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

export function SpendingChart() {
  return (
    <View className="relative w-full h-16 bg-white/70 rounded-xl border border-white/60 overflow-hidden px-3 pb-1 pt-0">
      {/* SVG Line */}
      <View className="absolute inset-0 items-center" style={{ top: 4 }}>
        <Svg
          width="100%"
          height="40"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.1" />
              <Stop offset="30%" stopColor="#94A3B8" stopOpacity="0.5" />
              <Stop offset="60%" stopColor="#1A1A1A" stopOpacity="0.9" />
              <Stop offset="85%" stopColor="#1A1A1A" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          <Path
            d="M0,70 Q50,70 80,40 T150,50 T220,30 T300,80 T350,20 T400,50"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="350" cy="20" r="2.5" fill="#1A1A1A" />
          {/* Vertical line at NOW point */}
          <Path
            d="M350,0 L350,100"
            stroke="#1A1A1A"
            strokeWidth="0.5"
            strokeOpacity="0.15"
            strokeDasharray="2 2"
          />
        </Svg>
      </View>

      {/* Time labels */}
      <View className="absolute bottom-1.5 left-0 right-0 flex-row justify-between px-4">
        <Text
          style={{
            fontSize: 8,
            fontWeight: "700",
            color: "#CBD5E1",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          00:00
        </Text>
        <Text
          style={{
            fontSize: 8,
            fontWeight: "700",
            color: "#CBD5E1",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          12:00
        </Text>
        <Text
          style={{
            fontSize: 8,
            fontWeight: "800",
            color: "#1A1A1A",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Now
        </Text>
      </View>
    </View>
  );
}
