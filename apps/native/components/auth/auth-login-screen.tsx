import { View, Text, Pressable } from "react-native";
import Svg, { Path, G, ClipPath, Defs, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function GoogleLogo() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.5c-1.49 0-1.96.93-1.96 1.87v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"
        fill="white"
      />
    </Svg>
  );
}

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
    <View
      className="flex-1"
      style={{ backgroundColor: "#f6f8f7", paddingTop: insets.top }}
    >
      {/* iOS Status bar spacer */}
      <View style={{ height: 12 }} />

      {/* Logo Section */}
      <View className="items-center justify-center pt-12 pb-8">
        <View style={{ position: "relative" }}>
          {/* Glow effect */}
          <View
            style={{
              position: "absolute",
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: 9999,
              backgroundColor: "rgba(19, 236, 106, 0.15)",
            }}
          />
          {/* Logo container */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.4)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Ionicons name="wallet" size={36} color="#13ec6a" />
          </View>
        </View>
      </View>

      {/* Headline & Branding */}
      <View className="px-8 items-center">
        <Text
          style={{
            color: "#111814",
            fontSize: 32,
            fontWeight: "800",
            letterSpacing: -0.5,
            lineHeight: 38,
            textAlign: "center",
            paddingBottom: 8,
            paddingTop: 16,
          }}
        >
          GreenFinance
        </Text>
        <Text
          style={{
            color: "#4F5E55",
            fontSize: 18,
            fontWeight: "500",
            lineHeight: 26,
            textAlign: "center",
            paddingHorizontal: 16,
          }}
        >
          Sua vida financeira simplificada com Open Finance.
        </Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Social Login Buttons */}
      <View style={{ gap: 16, paddingHorizontal: 24, paddingBottom: 48 }}>
        {/* Google Button */}
        <Pressable
          onPress={onGooglePress}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            width: "100%",
            height: 60,
            borderRadius: 9999,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 1,
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
              letterSpacing: -0.2,
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
            width: "100%",
            height: 60,
            borderRadius: 9999,
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
              letterSpacing: -0.2,
            }}
          >
            Continuar com Facebook
          </Text>
        </Pressable>
      </View>

      {/* Footer / Legal */}
      <View
        style={{
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 24,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#8B9B92",
            fontSize: 12,
            fontWeight: "500",
            lineHeight: 18,
            textAlign: "center",
          }}
        >
          Ao continuar, você concorda com nossos{"\n"}
          <Text style={{ color: "#13ec6a", textDecorationLine: "underline" }}>
            Termos de Uso
          </Text>
          <Text style={{ color: "#8B9B92" }}> e </Text>
          <Text style={{ color: "#13ec6a", textDecorationLine: "underline" }}>
            Política de Privacidade
          </Text>
          <Text style={{ color: "#8B9B92" }}>.</Text>
        </Text>
      </View>
    </View>
  );
}
