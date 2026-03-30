import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useToast } from "heroui-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Container } from "@/components/container";

const BG = "#0B1420";
const SURFACE = "#1E2D3D";
const TEXT_PRIMARY = "#F1F5F9";
const TEXT_SECONDARY = "#C2C6D6";
const TEXT_MUTED = "#94A3B8";
const TEXT_DIM = "#475569";
const LABEL_COLOR = "#ADC6FF";
const SUCCESS = "#10B981";
const ERROR = "#EF4444";
const SEPARATOR = "rgba(241,245,249,0.1)";
const BORDER_MUTED = "#334155";

type CategoryId = "salary" | "invest" | "gift" | "other";

const CATEGORIES: {
  id: CategoryId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "salary", label: "Salário", icon: "wallet" },
  { id: "invest", label: "Invest.", icon: "trending-up" },
  { id: "gift", label: "Presente", icon: "gift" },
  { id: "other", label: "Outros", icon: "ellipsis-horizontal" },
];

const EditReceiptScreen = () => {
  const [description, setDescription] = useState("Salário Mensal");
  const [amount, setAmount] = useState("4.500,00");
  const [notes, setNotes] = useState("Pagamento referente ao mês de Março");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryId>("salary");
  const { toast } = useToast();

  const handleSave = () => {
    toast.show({
      variant: "success",
      label: "Receita atualizada",
    });
    router.back();
  };

  const handleDelete = () => {
    toast.show({
      variant: "success",
      label: "Transação excluída",
    });
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <Container className="bg-transparent" isScrollable={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-6"
            style={{ paddingBottom: 16, paddingTop: 8 }}
          >
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
              onPress={() => router.back()}
              style={{ backgroundColor: "rgba(51,65,85,0.3)" }}
            >
              <Ionicons
                color="rgba(241,245,249,0.6)"
                name="arrow-back"
                size={22}
              />
            </Pressable>
            <Text
              style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: "700" }}
            >
              Editar Receita
            </Text>
            <Pressable className="active:opacity-60" onPress={handleSave}>
              <Text
                style={{
                  color: SUCCESS,
                  fontSize: 15,
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Salvar
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Value */}
            <View className="items-center" style={{ marginBottom: 24 }}>
              <View className="flex-row items-baseline justify-center">
                <Text
                  style={{
                    color: TEXT_MUTED,
                    fontFamily: "monospace",
                    fontSize: 24,
                    fontWeight: "600",
                    marginRight: 4,
                  }}
                >
                  R$
                </Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                  style={{
                    color: TEXT_PRIMARY,
                    flexShrink: 1,
                    fontFamily: "monospace",
                    fontSize: 48,
                    fontWeight: "700",
                    minWidth: 120,
                    textAlign: "center",
                  }}
                  value={amount}
                />
              </View>
              <View
                style={{
                  backgroundColor: SUCCESS,
                  borderRadius: 1,
                  height: 2,
                  marginTop: 8,
                  width: 200,
                }}
              />
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontSize: 12,
                  letterSpacing: 2,
                  marginTop: 12,
                  textTransform: "uppercase",
                }}
              >
                Valor da receita
              </Text>
            </View>

            {/* Card 1 */}
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: SURFACE,
                marginBottom: 16,
                padding: 24,
              }}
            >
              <Text
                style={{
                  color: LABEL_COLOR,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  marginBottom: 8,
                  opacity: 0.7,
                  textTransform: "uppercase",
                }}
              >
                Descrição
              </Text>
              <TextInput
                onChangeText={setDescription}
                placeholderTextColor={TEXT_DIM}
                style={{ color: TEXT_PRIMARY, fontSize: 15, marginBottom: 4 }}
                value={description}
              />
              <View
                style={{
                  backgroundColor: SEPARATOR,
                  height: 1,
                  marginVertical: 16,
                }}
              />

              <Text
                style={{
                  color: LABEL_COLOR,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  marginBottom: 10,
                  opacity: 0.7,
                  textTransform: "uppercase",
                }}
              >
                Conta
              </Text>
              <Pressable
                className="flex-row items-center justify-between active:opacity-80"
                onPress={() => undefined}
              >
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: "#DE011D",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons color="#FFFFFF" name="business" size={16} />
                  </View>
                  <Text
                    style={{
                      color: TEXT_PRIMARY,
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    Santander - Conta Corrente
                  </Text>
                </View>
                <Ionicons
                  color={TEXT_SECONDARY}
                  name="chevron-forward"
                  size={18}
                />
              </Pressable>

              <View
                style={{
                  backgroundColor: SEPARATOR,
                  height: 1,
                  marginVertical: 16,
                }}
              />

              <Text
                style={{
                  color: LABEL_COLOR,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  marginBottom: 10,
                  opacity: 0.7,
                  textTransform: "uppercase",
                }}
              >
                Data
              </Text>
              <Pressable
                className="flex-row items-center justify-between active:opacity-80"
                onPress={() => undefined}
              >
                <Text style={{ color: TEXT_PRIMARY, fontSize: 15 }}>
                  05/03/2026
                </Text>
                <Ionicons
                  color={TEXT_SECONDARY}
                  name="calendar-outline"
                  size={20}
                />
              </Pressable>
            </View>

            {/* Card 2 — Categories */}
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: SURFACE,
                marginBottom: 16,
                padding: 24,
              }}
            >
              <Text
                style={{
                  color: LABEL_COLOR,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  marginBottom: 16,
                  opacity: 0.7,
                  textTransform: "uppercase",
                }}
              >
                Categoria selecionada
              </Text>
              <View className="flex-row" style={{ gap: 16 }}>
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <Pressable
                      className="items-center"
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        opacity: isActive ? 1 : 0.3,
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: isActive
                            ? "rgba(16,185,129,0.2)"
                            : "#222A37",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: isActive ? 2 : 0,
                          borderColor: SUCCESS,
                        }}
                      >
                        <Ionicons
                          color={isActive ? SUCCESS : TEXT_SECONDARY}
                          name={cat.icon}
                          size={24}
                        />
                      </View>
                      <Text
                        style={{
                          color: isActive ? SUCCESS : TEXT_PRIMARY,
                          fontSize: 11,
                          fontWeight: isActive ? "600" : "400",
                          marginTop: 8,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Card 3 — Notes */}
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: SURFACE,
                marginBottom: 16,
                padding: 24,
              }}
            >
              <Text
                style={{
                  color: LABEL_COLOR,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  marginBottom: 10,
                  opacity: 0.7,
                  textTransform: "uppercase",
                }}
              >
                Observações
              </Text>
              <TextInput
                multiline
                numberOfLines={3}
                onChangeText={setNotes}
                placeholderTextColor={TEXT_DIM}
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 14,
                  minHeight: 72,
                  textAlignVertical: "top",
                }}
                value={notes}
              />
            </View>
          </ScrollView>

          {/* Fixed footer */}
          <View
            className="px-6"
            style={{
              backgroundColor: BG,
              borderTopColor: SEPARATOR,
              borderTopWidth: 1,
              gap: 10,
              paddingBottom: 20,
              paddingTop: 12,
            }}
          >
            <Pressable
              className="items-center justify-center rounded-xl active:opacity-80"
              onPress={handleSave}
              style={{ backgroundColor: SUCCESS, height: 52 }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}
              >
                Salvar Alterações
              </Text>
            </Pressable>
            <Pressable
              className="items-center justify-center rounded-xl active:opacity-80"
              onPress={() => router.back()}
              style={{
                borderColor: BORDER_MUTED,
                borderWidth: 1,
                height: 48,
              }}
            >
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontSize: 15,
                  fontWeight: "500",
                }}
              >
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              className="flex-row items-center justify-center active:opacity-80"
              onPress={handleDelete}
              style={{ marginTop: 12 }}
            >
              <Ionicons
                color={ERROR}
                name="trash"
                size={18}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: ERROR, fontSize: 14, fontWeight: "700" }}>
                Excluir transação
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Container>
    </View>
  );
};

export default EditReceiptScreen;
