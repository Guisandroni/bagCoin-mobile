import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AuthRegisterScreenProps {
  onGooglePress?: () => void;
  onFacebookPress?: () => void;
  onEmailPress?: () => void;
  onLoginPress?: () => void;
  onBackPress?: () => void;
}

export function AuthRegisterScreen({
  onGooglePress,
  onFacebookPress,
  onEmailPress,
  onLoginPress,
  onBackPress,
}: AuthRegisterScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#f6f8f7]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center p-4 pb-2 justify-between">
        <Pressable onPress={onBackPress} className="w-12 h-12 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#111814" />
        </Pressable>
        {/* Logo */}
        <View className="w-8 h-8 bg-[#13ec6a] rounded-lg items-center justify-center">
          <Ionicons name="wallet" size={16} color="#102217" />
        </View>
        <View className="w-12" />
      </View>

      {/* Headline: text-[32px] font-extrabold tracking-tight */}
      <View className="px-4 pt-8 pb-2">
        <Text className="text-[#111814] tracking-tight text-[32px] font-extrabold leading-tight">
          Crie sua conta em segundos
        </Text>
        <Text className="text-[#618971] text-lg font-medium mt-2">
          Comece sua jornada financeira com praticidade e inteligência.
        </Text>
      </View>

      {/* Security Info Box */}
      <View className="p-4">
        <View className="rounded-xl border border-[#dbe6df] bg-white p-5 gap-3">
          <View className="flex-row items-center gap-3 mb-1">
            <View className="p-2 bg-[#13ec6a]/20 rounded-lg">
              <Ionicons name="shield-checkmark" size={24} color="#13ec6a" />
            </View>
            <Text className="text-[#111814] text-base font-bold">
              Segurança em primeiro lugar
            </Text>
          </View>
          <Text className="text-[#618971] text-sm leading-relaxed">
            Utilizamos o login social para garantir uma conexão segura e instantânea
            com seus dados via <Text className="font-bold">Open Finance</Text>. Seus dados
            são protegidos por criptografia de ponta a ponta.
          </Text>
          <Pressable className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-[#13ec6a]">
              Saiba como protegemos você
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#13ec6a" />
          </Pressable>
        </View>
      </View>

      {/* Social Buttons */}
      <View className="flex-1 justify-center px-4 py-3 gap-4">
        {/* Google: h-14 rounded-xl bg-white */}
        <Pressable
          onPress={onGooglePress}
          className="flex-row items-center justify-center gap-3 h-14 rounded-xl bg-white border border-gray-200 active:scale-[0.98]"
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text className="text-[#111814] text-base font-bold">
            Continuar com Google
          </Text>
        </Pressable>

        {/* Facebook: h-14 rounded-xl bg-[#1877F2] */}
        <Pressable
          onPress={onFacebookPress}
          className="flex-row items-center justify-center gap-3 h-14 rounded-xl bg-[#1877F2] active:scale-[0.98]"
        >
          <Ionicons name="logo-facebook" size={20} color="#ffffff" />
          <Text className="text-white text-base font-bold">
            Continuar com Facebook
          </Text>
        </Pressable>

        {/* Divider */}
        <View className="flex-row items-center py-5">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
            ou use seu e-mail
          </Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Email Button: h-14 rounded-xl bg-[#13ec6a]/10 */}
        <Pressable
          onPress={onEmailPress}
          className="items-center justify-center h-14 rounded-xl bg-[#13ec6a]/10"
        >
          <Text className="text-[#13ec6a] text-base font-bold">
            Criar com e-mail
          </Text>
        </Pressable>
      </View>

      {/* Login Redirect */}
      <View className="mt-auto p-8 items-center">
        <Text className="text-[#618971] text-sm">
          Já tem uma conta?{" "}
          <Text onPress={onLoginPress} className="text-[#13ec6a] font-bold">
            Entrar agora
          </Text>
        </Text>
      </View>

      {/* Legal Terms: text-[10px] uppercase tracking-tight */}
      <View className="px-6 pb-10 items-center">
        <Text className="text-[10px] text-gray-400 text-center uppercase tracking-tight">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
          Operamos sob as diretrizes do Banco Central do Brasil.
        </Text>
      </View>

      {/* Home Indicator */}
      <View className="items-center pb-2">
        <View className="w-32 h-1.5 bg-gray-200 rounded-full" />
      </View>
    </View>
  );
}
