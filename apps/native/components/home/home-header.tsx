import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "heroui-native";

interface HomeHeaderProps {
  userName: string;
  userImage?: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export function HomeHeader({
  userName,
  userImage,
  onNotificationPress,
  onProfilePress,
}: HomeHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-6 py-3">
      <Pressable onPress={onProfilePress} className="flex-row items-center gap-3">
        {/* Avatar - size-9 = 36px */}
        <View className="w-9 h-9 rounded-full overflow-hidden border border-white shadow-sm">
          {userImage ? (
            <Image source={{ uri: userImage }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-slate-200 items-center justify-center">
              <Ionicons name="person" size={16} color="#94a3b8" />
            </View>
          )}
        </View>
        <View>
          {/* Label: text-[9px] font-extrabold uppercase tracking-widest */}
          <Text className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
            Bem-vindo
          </Text>
          {/* Name: text-sm font-bold */}
          <Text className="text-slate-900 text-sm font-bold leading-tight">
            {userName}
          </Text>
        </View>
      </Pressable>

      {/* Notification Button */}
      <Pressable
        onPress={onNotificationPress}
        className="relative w-9 h-9 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 active:scale-95"
      >
        <Ionicons name="notifications-outline" size={18} color="#475569" />
        {/* Notification dot */}
        <View className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-black rounded-full" />
      </Pressable>
    </View>
  );
}
