import { router } from "expo-router";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { GlassCard } from "@/components/ui";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "info" | "warning" | "success";
  isRead: boolean;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  // Mock data
  const notifications: Notification[] = [
    {
      id: 1,
      title: "Transação detectada",
      message: "Uma nova transação de R$ 45,00 foi registrada em Alimentação.",
      time: "Agora",
      type: "info",
      isRead: false,
    },
    {
      id: 2,
      title: "Orçamento ultrapassado",
      message: "Você ultrapassou o orçamento de Moradia em R$ 200,00 este mês.",
      time: "2h atrás",
      type: "warning",
      isRead: false,
    },
    {
      id: 3,
      title: "Meta atingida!",
      message: "Parabéns! Você atingiu 83% da sua meta de receita mensal.",
      time: "1 dia atrás",
      type: "success",
      isRead: true,
    },
    {
      id: 4,
      title: "Conta sincronizada",
      message: "Sua conta Nubank foi sincronizada com sucesso.",
      time: "2 dias atrás",
      type: "info",
      isRead: true,
    },
  ];

  const getIconForType = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "warning":
        return "warning";
      case "success":
        return "checkmark-circle";
      default:
        return "information-circle";
    }
  };

  const getColorForType = (type: string): string => {
    switch (type) {
      case "warning":
        return "#f59e0b";
      case "success":
        return "#10b981";
      default:
        return "#3b82f6";
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <Pressable onPress={handleBackPress} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
          Notificações
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 py-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="gap-3">
          {notifications.map((notification) => (
            <GlassCard
              key={notification.id}
              className={`p-4 ${!notification.isRead ? "border-l-4" : ""}`}
              style={!notification.isRead ? { borderLeftColor: getColorForType(notification.type) } : {}}
            >
              <View className="flex-row gap-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${getColorForType(notification.type)}20` }}
                >
                  <Ionicons
                    name={getIconForType(notification.type)}
                    size={20}
                    color={getColorForType(notification.type)}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">
                      {notification.title}
                    </Text>
                    <Text className="text-xs text-slate-400">{notification.time}</Text>
                  </View>
                  <Text className="text-sm text-slate-500 dark:text-slate-400">
                    {notification.message}
                  </Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
