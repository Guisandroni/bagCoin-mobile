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

const MIN_PASSWORD_LENGTH = 8;

function getAuthErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "Erro ao criar conta";
  }
  const o = err as { message?: string; code?: string };
  if (o.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "Este e-mail já está cadastrado. Faça login ou use outro e-mail.";
  }
  if (o.code === "PASSWORD_TOO_SHORT") {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  if (o.code === "INVALID_EMAIL") {
    return "E-mail inválido";
  }
  if (typeof o.message === "string" && o.message.length > 0) {
    return o.message;
  }
  return "Erro ao criar conta";
}

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
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
        errorCallbackURL: "/sign-up",
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

  const handleSignUp = async () => {
    if (!(name && email && password && confirmPassword)) {
      setError("Preencha todos os campos");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    if (!acceptTerms) {
      setError("Aceite os termos de uso");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(getAuthErrorMessage(result.error));
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Erro de conexão. Verifique se o servidor está acessível (mesma rede ou URL em EXPO_PUBLIC_SERVER_URL)."
      );
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
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "#ADC6FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons color="#002E6A" name="globe" size={18} />
              </View>
              <Text
                style={{
                  color: "#ADC6FF",
                  fontSize: 20,
                  fontWeight: "900",
                }}
              >
                Bag Coin
              </Text>
            </View>
          </View>

          {/* Header */}
          <View style={{ marginTop: 32, marginBottom: 28 }}>
            <Text
              style={{
                color: "#F1F5F9",
                fontSize: 24,
                fontWeight: "600",
              }}
            >
              Crie sua conta
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 14,
                lineHeight: 20,
                marginTop: 8,
              }}
            >
              Comece a controlar sua vida financeira hoje.
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 20 }}>
            {/* Nome Completo */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 12,
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                NOME COMPLETO
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
                  <Ionicons color="#8C909F" name="person" size={18} />
                </View>
                <TextInput
                  autoComplete="name"
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor="rgba(140,144,159,0.5)"
                  style={{
                    backgroundColor: "#060F1A",
                    borderRadius: 12,
                    height: 56,
                    paddingLeft: 48,
                    color: "#F1F5F9",
                    fontSize: 15,
                  }}
                  textContentType="name"
                  value={name}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 12,
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: 2,
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
                  <Ionicons color="#8C909F" name="mail-outline" size={18} />
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
                    paddingLeft: 48,
                    color: "#F1F5F9",
                    fontSize: 15,
                  }}
                  textContentType="emailAddress"
                  value={email}
                />
              </View>
            </View>

            {/* Senha */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 12,
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                SENHA
              </Text>
              <Text
                style={{
                  color: "rgba(148,163,184,0.85)",
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                Mínimo de {MIN_PASSWORD_LENGTH} caracteres
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
                  autoComplete="new-password"
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(140,144,159,0.5)"
                  secureTextEntry
                  style={{
                    backgroundColor: "#060F1A",
                    borderRadius: 12,
                    height: 56,
                    paddingLeft: 48,
                    color: "#F1F5F9",
                    fontSize: 15,
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  }}
                  textContentType="newPassword"
                  value={password}
                />
              </View>
            </View>

            {/* Confirmar Senha */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 12,
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                CONFIRMAR SENHA
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
                  <Ionicons color="#8C909F" name="shield-checkmark" size={18} />
                </View>
                <TextInput
                  autoComplete="new-password"
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(140,144,159,0.5)"
                  secureTextEntry
                  style={{
                    backgroundColor: "#060F1A",
                    borderRadius: 12,
                    height: 56,
                    paddingLeft: 48,
                    color: "#F1F5F9",
                    fontSize: 15,
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  }}
                  textContentType="newPassword"
                  value={confirmPassword}
                />
              </View>
            </View>

            {/* Terms Checkbox */}
            <Pressable
              onPress={() => setAcceptTerms((prev) => !prev)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: acceptTerms ? "#ADC6FF" : "#424754",
                  backgroundColor: acceptTerms ? "#ADC6FF" : "#060F1A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {acceptTerms && (
                  <Ionicons color="#002E6A" name="checkmark" size={14} />
                )}
              </View>
              <Text
                style={{
                  color: "#8C909F",
                  fontSize: 13,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Aceito os{" "}
                <Text style={{ color: "#ADC6FF" }}>Termos de Uso</Text> e{" "}
                <Text style={{ color: "#ADC6FF" }}>
                  Política de Privacidade
                </Text>
                .
              </Text>
            </Pressable>

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
              onPress={handleSignUp}
              style={({ pressed }) => ({
                backgroundColor: "#ADC6FF",
                borderRadius: 12,
                height: 56,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed || loading ? 0.7 : 1,
                marginTop: 4,
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
                    Criar Conta
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
            <Text
              style={{
                color: "#8C909F",
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              OU REGISTRE-SE COM
            </Text>
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
                backgroundColor: "#131C28",
                borderWidth: 1,
                borderColor: "rgba(66,71,84,0.1)",
                borderRadius: 12,
                height: 56,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons color="#F1F5F9" name="logo-google" size={20} />
              <Text
                style={{
                  color: "#F1F5F9",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Google
              </Text>
            </Pressable>
            <Pressable
              disabled={loading}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: "#131C28",
                borderWidth: 1,
                borderColor: "rgba(66,71,84,0.1)",
                borderRadius: 12,
                height: 56,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#1877F2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons color="#FFFFFF" name="logo-facebook" size={14} />
              </View>
              <Text
                style={{
                  color: "#F1F5F9",
                  fontSize: 14,
                  fontWeight: "600",
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
              Já tem uma conta?{" "}
            </Text>
            <Pressable onPress={() => router.push("/sign-in")}>
              <Text
                style={{
                  color: "#ADC6FF",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Entre
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
