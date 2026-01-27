import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="new-transaction"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="linked-accounts" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="transaction/[id]" />
      <Stack.Screen name="category/[id]" />
    </Stack>
  );
}
