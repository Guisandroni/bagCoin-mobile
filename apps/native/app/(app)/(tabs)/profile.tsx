import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, ScrollView } from "react-native";

import { ProfileSettings } from "@/components/profile";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  const handleCategoryManagement = () => {
    router.push("/(app)/categories");
  };

  const handleBankPermissions = () => {
    router.push("/(app)/linked-accounts");
  };

  const handleNotifications = () => {
    router.push("/(app)/notifications");
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    queryClient.invalidateQueries();
    router.replace("/(auth)/login");
  };

  const user = {
    name: session?.user?.name ?? "Usuário",
    email: session?.user?.email ?? undefined,
    image: session?.user?.image ?? undefined,
    memberSince: "Outubro 2024",
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileSettings
          user={user}
          biometricsEnabled={biometricsEnabled}
          onBiometricsToggle={setBiometricsEnabled}
          onCategoryManagement={handleCategoryManagement}
          onBankPermissions={handleBankPermissions}
          onNotifications={handleNotifications}
          onSignOut={handleSignOut}
          onBackPress={() => router.back()}
        />
      </ScrollView>
    </View>
  );
}
