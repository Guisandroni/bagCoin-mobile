import { SplashScreen, Stack, Tabs } from "expo-router";
import '../global.css'
import { useEffect } from "react";
import { useFonts } from "expo-font"

export default function RootLayout() {
  const [fontLoader] = useFonts({
    "Rubik-Bold": require('../assets/fonts/Rubik-Bold.ttf'),
    "Rubik-ExtraBold": require('../assets/fonts/Rubik-ExtraBold.ttf'),
    "Rubik-Light": require('../assets/fonts/Rubik-Light.ttf'),
    "Rubik-Medium": require('../assets/fonts/Rubik-Medium.ttf'),
    "Rubik-Regular": require('../assets/fonts/Rubik-Regular.ttf'),
    "Rubik-SemiBold": require('../assets/fonts/Rubik-SemiBold.ttf'),
  })

  useEffect(() => {
    if (fontLoader) {
      SplashScreen.hideAsync()
    }
  }, [fontLoader])

  if (!fontLoader) return null

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: ''
      }}
    >
      {/* <Stack.Screen 
        name="modal-pages/despesa"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="modal-pages/metas"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="modal-pages/receitas"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      /> */}
      <Stack.Screen name="(roots)" options={{ headerShown: false }} />
    </Stack>
  )
}
