import { View, Text, Pressable, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function FacebookLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="white"
      />
    </Svg>
  );
}

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
    <View
      style={{
        flex: 1,
        backgroundColor: "#f6f8f7",
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Navigation */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            paddingBottom: 8,
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 24,
              backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "transparent",
            })}
          >
            <Ionicons name="chevron-back" size={24} color="#111814" />
          </Pressable>

          {/* Center logo */}
          <View
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#13ec6a",
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="wallet" size={16} color="#102217" />
          </View>

          {/* Spacer */}
          <View style={{ width: 48 }} />
        </View>

        {/* Headline */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 8 }}
        >
          <Text
            style={{
              color: "#111814",
              fontSize: 32,
              fontWeight: "800",
              letterSpacing: -0.5,
              lineHeight: 40,
            }}
          >
            Crie sua conta em segundos
          </Text>
          <Text
            style={{
              color: "#618971",
              fontSize: 18,
              fontWeight: "500",
              marginTop: 8,
              lineHeight: 26,
            }}
          >
            Comece sua jornada financeira com praticidade e inteligência.
          </Text>
        </View>

        {/* Open Finance Context Box */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#dbe6df",
              backgroundColor: "white",
              padding: 20,
              gap: 12,
            }}
          >
            {/* Header row */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  padding: 8,
                  backgroundColor: "rgba(19, 236, 106, 0.15)",
                  borderRadius: 8,
                }}
              >
                <Ionicons name="shield-checkmark" size={24} color="#13ec6a" />
              </View>
              <Text
                style={{
                  color: "#111814",
                  fontSize: 15,
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                Segurança em primeiro lugar
              </Text>
            </View>

            {/* Description */}
            <Text
              style={{
                color: "#618971",
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              Utilizamos o login social para garantir uma conexão segura e
              instantânea com seus dados via{" "}
              <Text style={{ fontWeight: "700", color: "#111814" }}>
                Open Finance
              </Text>
              . Seus dados são protegidos por criptografia de ponta a ponta.
            </Text>

            {/* Learn more */}
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text
                style={{
                  color: "#13ec6a",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Saiba como protegemos você
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#13ec6a" />
            </Pressable>
          </View>
        </View>

        {/* Social Buttons */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            gap: 12,
          }}
        >
          {/* Google Button */}
          <Pressable
            onPress={onGooglePress}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              height: 56,
              borderRadius: 12,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <GoogleLogo />
            <Text
              style={{
                color: "#111814",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.1,
              }}
            >
              Continuar com Google
            </Text>
          </Pressable>

          {/* Facebook Button */}
          <Pressable
            onPress={onFacebookPress}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#1877F2",
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <FacebookLogo />
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.1,
              }}
            >
              Continuar com Facebook
            </Text>
          </Pressable>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            <Text
              style={{
                marginHorizontal: 16,
                color: "#9CA3AF",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              ou use seu e-mail
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          </View>

          {/* Email Button */}
          <Pressable
            onPress={onEmailPress}
            style={({ pressed }) => ({
              alignItems: "center",
              justifyContent: "center",
              height: 56,
              borderRadius: 12,
              backgroundColor: "rgba(19, 236, 106, 0.12)",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: "#13ec6a",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Criar com e-mail
            </Text>
          </Pressable>
        </View>

        {/* Login redirect */}
        <View
          style={{
            marginTop: "auto",
            padding: 24,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#618971", fontSize: 14 }}>
            Já tem uma conta?{" "}
            <Text
              onPress={onLoginPress}
              style={{
                color: "#13ec6a",
                fontWeight: "700",
              }}
            >
              Entrar agora
            </Text>
          </Text>
        </View>

        {/* Legal Terms */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: "#9CA3AF",
              textAlign: "center",
              lineHeight: 16,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            Ao continuar, você concorda com nossos{" "}
            <Text style={{ textDecorationLine: "underline" }}>
              Termos de Uso
            </Text>{" "}
            e{" "}
            <Text style={{ textDecorationLine: "underline" }}>
              Política de Privacidade
            </Text>
            . Operamos sob as diretrizes do Banco Central do Brasil.
          </Text>
        </View>

        {/* Home indicator */}
        <View style={{ alignItems: "center", paddingBottom: 8 }}>
          <View
            style={{
              width: 128,
              height: 5,
              backgroundColor: "#E5E7EB",
              borderRadius: 9999,
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
