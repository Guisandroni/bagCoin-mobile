import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/lib/auth-client";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const { error: socialError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/(tabs)",
        newUserCallbackURL: "/(tabs)",
        errorCallbackURL: "/sign-in",
      });
      if (socialError) {
        setError(socialError.message ?? "Erro ao entrar com Google");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar com Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!(email && password)) {
      setError("Preencha todos os campos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Erro ao entrar");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1420" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: "center", paddingTop: 32 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons color="#D4A847" name="wallet" size={30} />
              <Text
                style={{
                  color: "#D4A847",
                  fontSize: 24,
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                Bag Coin
              </Text>
            </View>
          </View>

          {/* Header */}
          <View style={{ marginTop: 40, marginBottom: 32 }}>
            <Text
              style={{
                color: "#F1F5F9",
                fontSize: 24,
                fontWeight: "600",
              }}
            >
              Bem-vindo de volta
            </Text>
            <Text
              style={{
                color: "rgba(194,198,214,0.7)",
                fontSize: 14,
                lineHeight: 20,
                marginTop: 8,
              }}
            >
              Acesse sua conta para gerenciar seu patrimônio com controle
              silencioso.
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Email */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 12,
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                EMAIL
              </Text>
              <View style={{ position: "relative" }}>
                <View
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                    zIndex: 1,
                  }}
                >
                  <Ionicons color="#8C909F" name="mail" size={18} />
                </View>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor="rgba(140,144,159,0.5)"
                  style={{
                    backgroundColor: "#060F1A",
                    borderRadius: 12,
                    height: 56,
                    paddingLeft: 44,
                    color: "#F1F5F9",
                    fontSize: 15,
                  }}
                  textContentType="emailAddress"
                  value={email}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 12,
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                SENHA
              </Text>
              <View style={{ position: "relative" }}>
                <View
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                    zIndex: 1,
                  }}
                >
                  <Ionicons color="#8C909F" name="lock-closed" size={18} />
                </View>
                <TextInput
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(140,144,159,0.5)"
                  secureTextEntry={!showPassword}
                  style={{
                    backgroundColor: "#060F1A",
                    borderRadius: 12,
                    height: 56,
                    paddingLeft: 44,
                    paddingRight: 44,
                    color: "#F1F5F9",
                    fontSize: 15,
                  }}
                  textContentType="password"
                  value={password}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    color="#8C909F"
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                  />
                </Pressable>
              </View>
              <Pressable style={{ alignSelf: "flex-end", marginTop: 2 }}>
                <Text
                  style={{
                    color: "#ADC6FF",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  Esqueci minha senha
                </Text>
              </Pressable>
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    color: "#EF4444",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {/* CTA Button */}
            <Pressable
              disabled={loading}
              onPress={handleSignIn}
              style={({ pressed }) => ({
                backgroundColor: "#ADC6FF",
                borderRadius: 12,
                height: 56,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed || loading ? 0.7 : 1,
                shadowColor: "#ADC6FF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
                marginTop: 8,
              })}
            >
              {loading ? (
                <ActivityIndicator color="#002E6A" />
              ) : (
                <>
                  <Text
                    style={{
                      color: "#002E6A",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Entrar
                  </Text>
                  <Ionicons color="#002E6A" name="arrow-forward" size={18} />
                </>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 28,
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(66,71,84,0.3)",
              }}
            />
            <Text style={{ color: "#8C909F", fontSize: 13 }}>ou entre com</Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(66,71,84,0.3)",
              }}
            />
          </View>

          {/* Social Buttons */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              disabled={loading}
              onPress={handleGoogle}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: "#F1F5F9",
                borderRadius: 12,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons color="#1E293B" name="logo-google" size={20} />
              <Text
                style={{
                  color: "#1E293B",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Google
              </Text>
            </Pressable>
            <Pressable
              disabled={loading}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: "#1877F2",
                borderRadius: 12,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons color="#FFFFFF" name="logo-facebook" size={20} />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Facebook
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 32,
            }}
          >
            <Text style={{ color: "#8C909F", fontSize: 14 }}>
              Não tem uma conta?{" "}
            </Text>
            <Pressable onPress={() => router.push("/sign-up")}>
              <Text
                style={{
                  color: "#ADC6FF",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Cadastre-se
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
