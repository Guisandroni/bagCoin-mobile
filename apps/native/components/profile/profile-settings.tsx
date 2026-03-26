import { View, Text, Pressable, Image, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ProfileSettingsProps {
  user: {
    name: string;
    email?: string;
    image?: string;
    memberSince?: string;
  };
  biometricsEnabled?: boolean;
  onBiometricsToggle?: (value: boolean) => void;
  onCategoryManagement?: () => void;
  onBankPermissions?: () => void;
  onNotifications?: () => void;
  onSignOut?: () => void;
  onBackPress?: () => void;
}

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingsRow({ icon, label, onPress, rightElement }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Ionicons name={icon} size={24} color="#9CA3AF" />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "400",
            color: "#111827",
          }}
        >
          {label}
        </Text>
      </View>

      {rightElement ?? (
        <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
      )}
    </Pressable>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: "#F2F2F7",
      }}
    />
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "600",
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 8,
        paddingHorizontal: 4,
      }}
    >
      {label}
    </Text>
  );
}

export function ProfileSettings({
  user,
  biometricsEnabled = true,
  onBiometricsToggle,
  onCategoryManagement,
  onBankPermissions,
  onNotifications,
  onSignOut,
  onBackPress,
}: ProfileSettingsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* ── Top Nav ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          backgroundColor: "rgba(255,255,255,0.85)",
          borderBottomWidth: 1,
          borderBottomColor: "#F9F9F9",
        }}
      >
        <Pressable
          onPress={onBackPress}
          style={({ pressed }) => ({
            width: 40,
            alignItems: "flex-start",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>

        <Text
          style={{
            fontSize: 17,
            fontWeight: "600",
            letterSpacing: -0.3,
            color: "#111827",
          }}
        >
          Profile
        </Text>

        <Pressable
          style={({ pressed }) => ({
            width: 40,
            alignItems: "flex-end",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
        </Pressable>
      </View>

      {/* ── Avatar + Name ── */}
      <View
        style={{
          alignItems: "center",
          paddingTop: 40,
          paddingBottom: 32,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            position: "relative",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              overflow: "hidden",
              backgroundColor: "#F3F4F6",
              borderWidth: 1,
              borderColor: "#F9FAFB",
            }}
          >
            {user.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
            )}
          </View>
        </View>

        {/* Name */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "500",
            letterSpacing: -0.5,
            color: "#111827",
          }}
        >
          {user.name}
        </Text>

        {/* Member since */}
        {user.memberSince && (
          <Text
            style={{
              fontSize: 14,
              color: "#9CA3AF",
              marginTop: 4,
            }}
          >
            Membro desde {user.memberSince}
          </Text>
        )}
      </View>

      {/* ── Settings ── */}
      <View style={{ paddingHorizontal: 24 }}>
        {/* OPEN FINANCE */}
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <SectionLabel label="Open Finance" />

          <SettingsRow
            icon="grid-outline"
            label="Gerenciar Categorias"
            onPress={onCategoryManagement}
          />
          <Divider />
          <SettingsRow
            icon="wallet-outline"
            label="Permissões Bancárias"
            onPress={onBankPermissions}
          />
        </View>

        {/* SECURITY */}
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <SectionLabel label="Segurança" />

          <SettingsRow
            icon="finger-print"
            label="Biometria"
            rightElement={
              <Switch
                value={biometricsEnabled}
                onValueChange={onBiometricsToggle}
                trackColor={{ false: "#E5E7EB", true: "#111827" }}
                thumbColor="white"
                ios_backgroundColor="#E5E7EB"
              />
            }
          />
          <Divider />
          <SettingsRow
            icon="notifications-outline"
            label="Notificações"
            onPress={onNotifications}
          />
        </View>

        {/* Sign Out */}
        <View style={{ marginTop: 48, marginBottom: 32 }}>
          <Pressable
            onPress={onSignOut}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 16,
              borderWidth: 1,
              borderColor: "#FFF1F2",
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: pressed ? "#FFF1F2" : "white",
            })}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#EF4444",
              }}
            >
              Sair da Conta
            </Text>
          </Pressable>

          <Text
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "#D1D5DB",
              marginTop: 32,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            VERSÃO 1.0.0 (1)
          </Text>
        </View>
      </View>
    </View>
  );
}
