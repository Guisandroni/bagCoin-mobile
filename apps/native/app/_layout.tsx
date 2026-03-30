import "@/polyfills";
import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-transaction"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="add-expense"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="add-receipt"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="edit-receipt"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="accounts"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="import-statement"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="statement"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="filters"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="select-period"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="categories"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="new-category"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="ai"
        options={{ presentation: "modal", title: "AI Chat" }}
      />
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <StackLayout />
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
