import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CategoryType = "expense" | "income";

const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
  "airplane",
  "cut",
  "people",
  "car",
  "chatbubble",
  "restaurant",
  "bag",
  "bus",
  "home",
  "add-circle",
  "cloud",
  "build",
];

const COLOR_OPTIONS = [
  "#ADC6FF",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#A78BFA",
  "#EC4899",
  "#06B6D4",
];

const NewCategoryScreen = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<CategoryType>("expense");
  const [selectedIcon, setSelectedIcon] =
    useState<keyof typeof Ionicons.glyphMap>("restaurant");
  const [selectedColor, setSelectedColor] = useState("#ADC6FF");

  const isExpense = selectedType === "expense";

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0B1420", paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-5 pt-4 pb-6">
          <Pressable
            className="h-9 w-9 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons color="#F1F5F9" name="arrow-back" size={24} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#F1F5F9" }}>
            Nova Categoria
          </Text>
          <Pressable
            className="active:opacity-60"
            onPress={() => router.back()}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#F1F5F9" }}>
              Salvar
            </Text>
          </Pressable>
        </View>

        <View className="px-5" style={{ marginBottom: 24 }}>
          <View
            className="items-center rounded-2xl"
            style={{ backgroundColor: "#222A37", padding: 32 }}
          >
            <View
              className="mb-4 items-center justify-center rounded-2xl"
              style={{ width: 64, height: 64, backgroundColor: "#131C28" }}
            >
              <Ionicons color={selectedColor} name={selectedIcon} size={32} />
            </View>
            <Text
              style={{
                fontSize: 10,
                color: "#C2C6D6",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              PRÉ-VISUALIZAÇÃO
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#F1F5F9" }}>
              {name || "Nome da Categoria"}
            </Text>
          </View>
        </View>

        <View className="px-5" style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#C2C6D6",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Nome da Categoria
          </Text>
          <TextInput
            onChangeText={setName}
            placeholder="Ex: Viagens, Academia, etc."
            placeholderTextColor="#475569"
            style={{
              backgroundColor: "#131C28",
              borderRadius: 12,
              height: 52,
              paddingHorizontal: 16,
              color: "#F1F5F9",
              fontSize: 15,
            }}
            value={name}
          />
        </View>

        <View className="px-5" style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#C2C6D6",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Tipo de Categoria
          </Text>
          <View
            className="flex-row rounded-xl"
            style={{ backgroundColor: "#131C28", padding: 4 }}
          >
            <Pressable
              className="flex-1 flex-row items-center justify-center rounded-lg"
              onPress={() => setSelectedType("expense")}
              style={{
                paddingVertical: 12,
                gap: 6,
                backgroundColor: isExpense ? "#222A37" : "transparent",
              }}
            >
              <Ionicons color="#EF4444" name="arrow-down" size={16} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isExpense ? "#F1F5F9" : "#C2C6D6",
                }}
              >
                Despesa
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 flex-row items-center justify-center rounded-lg"
              onPress={() => setSelectedType("income")}
              style={{
                paddingVertical: 12,
                gap: 6,
                backgroundColor: isExpense ? "transparent" : "#222A37",
              }}
            >
              <Ionicons color="#10B981" name="arrow-up" size={16} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isExpense ? "#C2C6D6" : "#F1F5F9",
                }}
              >
                Receita
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="px-5" style={{ marginBottom: 20 }}>
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: 8 }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#C2C6D6",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Ícone
            </Text>
            <Text style={{ fontSize: 12, color: "#ADC6FF" }}>
              {ICON_OPTIONS.length} opções
            </Text>
          </View>
          <View
            className="flex-row flex-wrap rounded-2xl"
            style={{ backgroundColor: "#131C28", padding: 16, gap: 10 }}
          >
            {ICON_OPTIONS.map((iconName) => {
              const isSelected = selectedIcon === iconName;
              return (
                <Pressable
                  className="items-center justify-center"
                  key={iconName}
                  onPress={() => setSelectedIcon(iconName)}
                  style={{
                    width: "14.66%",
                    aspectRatio: 1,
                    borderRadius: 100,
                    backgroundColor: isSelected ? "#ADC6FF" : "transparent",
                  }}
                >
                  <Ionicons
                    color={isSelected ? "#002E6A" : "#C2C6D6"}
                    name={iconName}
                    size={24}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="px-5" style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#C2C6D6",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Cor de Identificação
          </Text>
          <View className="flex-row" style={{ gap: 12 }}>
            {COLOR_OPTIONS.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: color,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? "#FFFFFF" : "transparent",
                    ...(isSelected && {
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                    }),
                  }}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default NewCategoryScreen;
