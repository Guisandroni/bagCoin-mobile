import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 12,
      }}
    >
      {/* Left: Avatar + Name */}
      <Pressable
        onPress={onProfilePress}
        style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
      >
        {/* Avatar: size-9 = 36px, rounded-full, border white, shadow */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          {userImage ? (
            <Image
              source={{ uri: userImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#E2E8F0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={16} color="#94a3b8" />
            </View>
          )}
        </View>

        {/* Text */}
        <View>
          {/* "Welcome back" label */}
          <Text
            style={{
              fontSize: 9,
              fontWeight: "800",
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              lineHeight: 12,
              marginBottom: 1,
            }}
          >
            Bem-vindo
          </Text>
          {/* User name */}
          <Text
            style={{
              color: "#0F172A",
              fontSize: 14,
              fontWeight: "700",
              lineHeight: 18,
            }}
          >
            {userName}
          </Text>
        </View>
      </Pressable>

      {/* Right: Notification bell */}
      <Pressable
        onPress={onNotificationPress}
        style={({ pressed }) => ({
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "white",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#F1F5F9",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 1,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Ionicons name="notifications" size={18} color="#475569" />
        {/* Red/black notification dot */}
        <View
          style={{
            position: "absolute",
            top: 9,
            right: 9,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#0F172A",
          }}
        />
      </Pressable>
    </View>
  );
}
