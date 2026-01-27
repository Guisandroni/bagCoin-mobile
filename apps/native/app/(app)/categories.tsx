import { router } from "expo-router";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { GlassCard } from "@/components/ui";

interface Category {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  type: "expense" | "income" | "both";
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();

  // Mock data
  const expenseCategories: Category[] = [
    { id: 1, name: "Alimentação", icon: "restaurant", color: "#ef4444", type: "expense" },
    { id: 2, name: "Transporte", icon: "car", color: "#f59e0b", type: "expense" },
    { id: 3, name: "Moradia", icon: "home", color: "#3b82f6", type: "expense" },
    { id: 4, name: "Saúde", icon: "medical", color: "#10b981", type: "expense" },
    { id: 5, name: "Lazer", icon: "game-controller", color: "#8b5cf6", type: "expense" },
    { id: 6, name: "Compras", icon: "cart", color: "#ec4899", type: "expense" },
  ];

  const incomeCategories: Category[] = [
    { id: 7, name: "Salário", icon: "cash", color: "#10b981", type: "income" },
    { id: 8, name: "Freelance", icon: "briefcase", color: "#3b82f6", type: "income" },
    { id: 9, name: "Investimentos", icon: "trending-up", color: "#f59e0b", type: "income" },
    { id: 10, name: "Outros", icon: "ellipsis-horizontal", color: "#6b7280", type: "income" },
  ];

  const handleCategoryPress = (id: number) => {
    router.push(`/(app)/category/${id}`);
  };

  const handleAddCategory = () => {
    // TODO: Open add category modal
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderCategoryItem = (category: Category) => (
    <Pressable
      key={category.id}
      onPress={() => handleCategoryPress(category.id)}
      className="flex-row items-center justify-between py-4"
    >
      <View className="flex-row items-center gap-4">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Ionicons name={category.icon} size={20} color={category.color} />
        </View>
        <Text className="text-base font-medium text-slate-900 dark:text-white">
          {category.name}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <Pressable onPress={handleBackPress} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
          Categorias
        </Text>
        <Pressable onPress={handleAddCategory} className="w-10 h-10 items-center justify-center">
          <Ionicons name="add" size={24} color="#374151" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Expense Categories */}
        <View className="py-6">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Despesas
          </Text>
          <GlassCard className="p-2">
            {expenseCategories.map((category, index) => (
              <View key={category.id}>
                {renderCategoryItem(category)}
                {index < expenseCategories.length - 1 && (
                  <View className="h-px bg-slate-100 dark:bg-slate-800 ml-14" />
                )}
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Income Categories */}
        <View className="py-6">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Receitas
          </Text>
          <GlassCard className="p-2">
            {incomeCategories.map((category, index) => (
              <View key={category.id}>
                {renderCategoryItem(category)}
                {index < incomeCategories.length - 1 && (
                  <View className="h-px bg-slate-100 dark:bg-slate-800 ml-14" />
                )}
              </View>
            ))}
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}
