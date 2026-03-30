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
  useWindowDimensions,
  View,
} from "react-native";

import { Container } from "@/components/container";

const CATEGORIES = [
  { id: "salary", label: "Salário", icon: "wallet" as const },
  { id: "freelance", label: "Freelance", icon: "code-slash" as const },
  { id: "investments", label: "Invest.", icon: "trending-up" as const },
  { id: "sales", label: "Vendas", icon: "pricetag" as const },
  { id: "rent", label: "Aluguel", icon: "home" as const },
];

const ACCENT = "#10B981";

const AddReceiptScreen = () => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("salary");
  const { toast } = useToast();
  const { width: screenWidth } = useWindowDimensions();

  const categorySize = (screenWidth - 48 - 48) / 5;

  const handleSave = () => {
    if (!(amount && selectedCategory)) {
      toast.show({
        variant: "danger",
        label: "Preencha o valor e selecione uma categoria",
      });
      return;
    }
    toast.show({
      variant: "success",
      label: "Receita adicionada com sucesso",
    });
    router.back();
  };

  return (
    <Container isScrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: 8, paddingBottom: 16 }}
        >
          <Pressable
            className="h-10 w-10 items-center justify-center active:opacity-60"
            onPress={() => router.back()}
          >
            <Ionicons
              color="rgba(241,245,249,0.6)"
              name="arrow-back"
              size={22}
            />
          </Pressable>
          <Text
            style={{
              color: "#ADC6FF",
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            Adicionar Receita
          </Text>
          <Pressable className="active:opacity-60" onPress={handleSave}>
            <Text
              style={{
                color: ACCENT,
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              SALVAR
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Value Section */}
          <View className="items-center" style={{ marginBottom: 28 }}>
            <Text
              style={{
                color: "#C2C6D6",
                fontSize: 12,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              VALOR DA RECEITA
            </Text>
            <View className="flex-row items-baseline justify-center">
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 20,
                  fontFamily: "monospace",
                }}
              >
                R$
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setAmount}
                placeholder="0,00"
                placeholderTextColor="rgba(241,245,249,0.25)"
                style={{
                  fontSize: 48,
                  fontWeight: "700",
                  fontFamily: "monospace",
                  color: "#F1F5F9",
                  minWidth: 120,
                  textAlign: "center",
                  marginLeft: 4,
                }}
                value={amount}
              />
            </View>
            <View
              style={{
                height: 2,
                width: 200,
                backgroundColor: ACCENT,
                marginTop: 4,
                borderRadius: 1,
              }}
            />
          </View>

          {/* Card 1 — Details */}
          <View
            className="rounded-2xl"
            style={{
              backgroundColor: "#222A37",
              padding: 20,
              marginBottom: 16,
              gap: 20,
              borderWidth: 1,
              borderColor: "rgba(66,71,84,0.1)",
            }}
          >
            {/* Descrição */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  color: "#8C909F",
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                DESCRIÇÃO
              </Text>
              <View
                className="flex-row items-center rounded-xl"
                style={{
                  backgroundColor: "#060F1A",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "#060F1A",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons color={ACCENT} name="create" size={20} />
                </View>
                <TextInput
                  onChangeText={setDescription}
                  placeholder="Ex: Salário Mensal"
                  placeholderTextColor="#475569"
                  style={{ flex: 1, color: "#F1F5F9", fontSize: 15 }}
                  value={description}
                />
              </View>
            </View>

            {/* Conta de Origem */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                CONTA
              </Text>
              <Pressable
                className="flex-row items-center justify-between rounded-xl"
                style={{
                  backgroundColor: "#060F1A",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <Ionicons color="#ADC6FF" name="wallet" size={20} />
                  <Text style={{ color: "#F1F5F9", fontSize: 15 }}>Nubank</Text>
                </View>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Text
                    style={{
                      color: "#C2C6D6",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  >
                    Saldo: R$ 4.250,00
                  </Text>
                  <Ionicons color="#475569" name="chevron-forward" size={16} />
                </View>
              </Pressable>
            </View>

            {/* Data */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                DATA
              </Text>
              <Pressable
                className="flex-row items-center rounded-xl"
                style={{
                  backgroundColor: "#060F1A",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                }}
              >
                <Ionicons color="#C2C6D6" name="calendar" size={20} />
                <Text style={{ color: "#F1F5F9", fontSize: 15 }}>
                  Hoje, 24 de Outubro
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Card 2 — Categories */}
          <View
            className="rounded-2xl"
            style={{
              backgroundColor: "#222A37",
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "rgba(66,71,84,0.1)",
            }}
          >
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: 16 }}
            >
              <Text
                style={{
                  color: "#C2C6D6",
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                CATEGORIA
              </Text>
              <Pressable className="active:opacity-60">
                <Text
                  style={{
                    color: ACCENT,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Ver todas
                </Text>
              </Pressable>
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <Pressable
                    className="items-center"
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{ width: categorySize }}
                  >
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: isActive ? ACCENT : "#060F1A",
                      }}
                    >
                      <Ionicons
                        color={isActive ? "#FFFFFF" : "#8C909F"}
                        name={cat.icon}
                        size={22}
                      />
                    </View>
                    <Text
                      style={{
                        color: isActive ? ACCENT : "#C2C6D6",
                        fontSize: 10,
                        fontWeight: "500",
                        marginTop: 6,
                        textAlign: "center",
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
              backgroundColor: "#222A37",
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "rgba(66,71,84,0.1)",
            }}
          >
            <Text
              style={{
                color: "#C2C6D6",
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 12,
              }}
            >
              OBSERVAÇÕES
            </Text>
            <View
              className="rounded-xl"
              style={{
                backgroundColor: "#060F1A",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <TextInput
                multiline
                numberOfLines={3}
                onChangeText={setNotes}
                placeholder="Adicione uma nota importante..."
                placeholderTextColor="#475569"
                style={{
                  color: "#F1F5F9",
                  fontSize: 14,
                  minHeight: 72,
                  textAlignVertical: "top",
                }}
                value={notes}
              />
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer */}
        <View
          className="px-6"
          style={{
            paddingBottom: 20,
            paddingTop: 12,
            backgroundColor: "#0B1420",
            borderTopWidth: 1,
            borderTopColor: "rgba(51,65,85,0.3)",
            gap: 10,
          }}
        >
          <Pressable
            className="flex-row items-center justify-center rounded-xl active:opacity-80"
            onPress={handleSave}
            style={{ backgroundColor: ACCENT, height: 52, gap: 8 }}
          >
            <Ionicons color="#FFFFFF" name="checkmark-circle" size={20} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
              Confirmar Receita
            </Text>
          </Pressable>
          <Pressable
            className="items-center justify-center rounded-xl active:opacity-80"
            onPress={() => router.back()}
            style={{ height: 48, borderWidth: 1, borderColor: "#334155" }}
          >
            <Text style={{ color: "#C2C6D6", fontSize: 15, fontWeight: "500" }}>
              Cancelar
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default AddReceiptScreen;
