import { View, Text, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "heroui-native";
import { useState } from "react";

type TransactionType = "expense" | "income";

interface CategoryOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const expenseCategories: CategoryOption[] = [
  { id: "shopping", name: "Compras", icon: "cart" },
  { id: "food", name: "Alimentação", icon: "restaurant" },
  { id: "transport", name: "Transporte", icon: "car" },
  { id: "other", name: "Outros", icon: "ellipsis-horizontal" },
];

const incomeCategories: CategoryOption[] = [
  { id: "salary", name: "Salário", icon: "cash" },
  { id: "investment", name: "Investimento", icon: "trending-up" },
  { id: "gift", name: "Presente", icon: "gift" },
  { id: "other", name: "Outros", icon: "ellipsis-horizontal" },
];

interface TransactionFormProps {
  initialType?: TransactionType;
  onSubmit?: (data: {
    type: TransactionType;
    amount: number;
    description: string;
    categoryId: string;
    date: Date;
  }) => void;
  onClose?: () => void;
}

export function TransactionForm({
  initialType = "expense",
  onSubmit,
  onClose,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState("0,00");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [date] = useState(new Date());

  const isExpense = type === "expense";
  const categories = isExpense ? expenseCategories : incomeCategories;
  const primaryColor = isExpense ? "#ef4444" : "#10b981";

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) {
      return `Hoje, ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (numericAmount > 0 && selectedCategory) {
      onSubmit?.({
        type,
        amount: numericAmount,
        description,
        categoryId: selectedCategory,
        date,
      });
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4">
        <Pressable onPress={onClose} className="w-12 h-12 items-start justify-center">
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900 dark:text-white flex-1 text-center pr-12">
          Nova Transação
        </Text>
      </View>

      {/* Type Toggle */}
      <View className="px-4 py-3">
        <View className="flex-row h-12 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <Pressable
            onPress={() => setType("expense")}
            className={cn(
              "flex-1 items-center justify-center rounded-lg",
              type === "expense" && "bg-red-500/20"
            )}
          >
            <Text
              className={cn(
                "text-sm font-bold",
                type === "expense" ? "text-red-500" : "text-slate-400"
              )}
            >
              Despesa
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setType("income")}
            className={cn(
              "flex-1 items-center justify-center rounded-lg",
              type === "income" && "bg-emerald-500/20"
            )}
          >
            <Text
              className={cn(
                "text-sm font-bold",
                type === "income" ? "text-emerald-500" : "text-slate-400"
              )}
            >
              Receita
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Amount Input */}
      <View className="items-center justify-center py-12 px-4">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Valor da Transação
        </Text>
        <View className="flex-row items-center justify-center">
          <Text className="text-3xl font-bold mr-2" style={{ color: primaryColor }}>
            R$
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            className="text-6xl font-extrabold text-center"
            style={{ color: primaryColor }}
            placeholder="0,00"
            placeholderTextColor={primaryColor}
          />
        </View>
      </View>

      {/* Form Fields */}
      <View className="px-4 gap-4">
        {/* Description */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-900 dark:text-white px-1">
            Descrição
          </Text>
          <View className="flex-row items-center bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14">
            <Ionicons name="create-outline" size={20} color="#64748b" />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={isExpense ? "Ex: Mercado Central" : "Ex: Salário Mensal"}
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
            />
          </View>
        </View>

        {/* Categories */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-900 dark:text-white px-1">
            Categoria
          </Text>
          <View className="flex-row gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex-1 items-center gap-2 p-3 rounded-xl border-2",
                    isSelected
                      ? isExpense
                        ? "bg-red-500/10 border-red-500"
                        : "bg-emerald-500/10 border-emerald-500"
                      : "bg-slate-50 dark:bg-slate-800 border-transparent"
                  )}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={isSelected ? primaryColor : "#64748b"}
                  />
                  <Text
                    className={cn(
                      "text-[10px] font-bold",
                      isSelected ? (isExpense ? "text-red-500" : "text-emerald-500") : "text-slate-500"
                    )}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Date and Account */}
        <View className="flex-row gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-sm font-semibold text-slate-900 dark:text-white px-1">
              Data
            </Text>
            <View className="flex-row items-center bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14">
              <Ionicons name="calendar" size={20} color="#64748b" />
              <Text className="ml-3 text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(date)}
              </Text>
            </View>
          </View>
          <View className="flex-1 gap-2">
            <Text className="text-sm font-semibold text-slate-900 dark:text-white px-1">
              Conta
            </Text>
            <View className="flex-row items-center bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14">
              <Ionicons name="wallet" size={20} color="#64748b" />
              <Text className="ml-3 text-sm font-medium text-slate-900 dark:text-white">
                Carteira
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-slate-900">
        <Pressable
          onPress={handleSubmit}
          className="w-full py-4 rounded-xl items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <Text className="text-white font-bold text-base">
            Salvar {isExpense ? "Despesa" : "Receita"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
