import { View, Text, Pressable, Image, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingsItem({ icon, label, onPress, rightElement }: SettingsItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4"
    >
      <View className="flex-row items-center gap-4">
        <Ionicons name={icon} size={24} color="#9ca3af" />
        <Text className="text-base font-normal text-slate-900 dark:text-white">
          {label}
        </Text>
      </View>
      {rightElement ?? (
        <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
      )}
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-slate-100 dark:bg-slate-800" />;
}

export function ProfileSettings({
  user,
  biometricsEnabled = true,
  onBiometricsToggle,
  onCategoryManagement,
  onBankPermissions,
  onNotifications,
  onSignOut,
}: ProfileSettingsProps) {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* Profile Header */}
      <View className="items-center pt-10 pb-8">
        <View className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden border border-slate-50 dark:border-slate-700">
          {user.image ? (
            <Image source={{ uri: user.image }} className="w-full h-full" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="person" size={40} color="#9ca3af" />
            </View>
          )}
        </View>
        <Text className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white">
          {user.name}
        </Text>
        {user.memberSince && (
          <Text className="text-slate-400 text-sm mt-1">
            Membro desde {user.memberSince}
          </Text>
        )}
      </View>

      {/* Settings Sections */}
      <View className="px-6">
        {/* Open Finance Section */}
        <View className="py-4">
          <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Open Finance
          </Text>
          <SettingsItem
            icon="grid-outline"
            label="Gerenciar Categorias"
            onPress={onCategoryManagement}
          />
          <Divider />
          <SettingsItem
            icon="wallet-outline"
            label="Permissões Bancárias"
            onPress={onBankPermissions}
          />
        </View>

        {/* Security Section */}
        <View className="py-4">
          <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Segurança
          </Text>
          <SettingsItem
            icon="finger-print"
            label="Biometria"
            rightElement={
              <Switch
                value={biometricsEnabled}
                onValueChange={onBiometricsToggle}
                trackColor={{ false: "#e5e7eb", true: "#000000" }}
                thumbColor="#ffffff"
              />
            }
          />
          <Divider />
          <SettingsItem
            icon="notifications-outline"
            label="Notificações"
            onPress={onNotifications}
          />
        </View>

        {/* Sign Out */}
        <View className="mt-12 mb-32">
          <Pressable
            onPress={onSignOut}
            className="w-full py-4 border border-red-50 dark:border-red-900 rounded-xl items-center"
          >
            <Text className="text-base font-medium text-red-500">
              Sair da Conta
            </Text>
          </Pressable>
          <Text className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-8 tracking-wide">
            VERSÃO 1.0.0 (1)
          </Text>
        </View>
      </View>
    </View>
  );
}
