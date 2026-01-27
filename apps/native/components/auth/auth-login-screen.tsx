import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AuthLoginScreenProps {
  onGooglePress?: () => void;
  onFacebookPress?: () => void;
}

export function AuthLoginScreen({
  onGooglePress,
  onFacebookPress,
}: AuthLoginScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#f6f8f7]" style={{ paddingTop: insets.top }}>
      {/* Status Bar Spacer */}
      <View className="h-12" />

      {/* Logo Section */}
      <View className="items-center justify-center pt-12 pb-8">
        <View className="relative">
          {/* Background Glow */}
          <View className="absolute -inset-1 bg-[#13ec6a]/20 rounded-full blur-xl opacity-75" />
          {/* Frosted Glass Logo Container: h-20 w-20 rounded-full */}
          <View className="relative w-20 h-20 items-center justify-center rounded-full bg-white/60 border border-white/30 shadow-sm">
            <Ionicons name="wallet" size={36} color="#13ec6a" />
          </View>
        </View>
      </View>

      {/* Headline */}
      <View className="px-8 items-center">
        {/* Title: text-[32px] font-extrabold tracking-tight */}
        <Text className="text-[#111814] tracking-tight text-[32px] font-extrabold leading-tight pb-2 pt-4 text-center">
          GreenFinance
        </Text>
        {/* Subtitle: text-lg font-medium */}
        <Text className="text-[#4F5E55] text-lg font-medium leading-relaxed px-4 text-center">
          Sua vida financeira simplificada com Open Finance.
        </Text>
      </View>

      <View className="flex-1" />

      {/* Social Login Buttons */}
      <View className="gap-4 px-6 pb-12">
        {/* Google Button: h-[60px] rounded-full bg-white */}
        <Pressable
          onPress={onGooglePress}
          className="flex-row items-center justify-center gap-3 w-full h-[60px] rounded-full bg-white border border-gray-200 shadow-sm active:scale-95"
        >
          <Ionicons name="logo-google" size={24} color="#4285F4" />
          <Text className="text-[#111814] text-base font-bold tracking-tight">
            Continuar com Google
          </Text>
        </Pressable>

        {/* Facebook Button: h-[60px] rounded-full bg-[#1877F2] */}
        <Pressable
          onPress={onFacebookPress}
          className="flex-row items-center justify-center gap-3 w-full h-[60px] rounded-full bg-[#1877F2] active:scale-95"
        >
          <Ionicons name="logo-facebook" size={24} color="#ffffff" />
          <Text className="text-white text-base font-bold tracking-tight">
            Continuar com Facebook
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View className="px-8 pb-10 items-center">
        <Text className="text-[#8B9B92] text-xs font-medium leading-relaxed text-center">
          Ao continuar, você concorda com nossos{"\n"}
          <Text className="text-[#13ec6a] underline">Termos de Uso</Text> e{" "}
          <Text className="text-[#13ec6a] underline">Política de Privacidade</Text>.
        </Text>
      </View>

      {/* iOS Home Indicator Space */}
      <View style={{ height: insets.bottom + 6 }} />
    </View>
  );
}
