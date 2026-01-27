import { router } from "expo-router";
import { AuthRegisterScreen } from "@/components/auth";
import { authClient } from "@/lib/auth-client";

export default function RegisterScreen() {
  const handleGooglePress = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
      });
      router.replace("/(app)/(tabs)");
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  };

  const handleFacebookPress = async () => {
    try {
      await authClient.signIn.social({
        provider: "facebook",
      });
      router.replace("/(app)/(tabs)");
    } catch (error) {
      console.error("Facebook sign in error:", error);
    }
  };

  const handleLoginPress = () => {
    router.push("/(auth)/login");
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <AuthRegisterScreen
      onGooglePress={handleGooglePress}
      onFacebookPress={handleFacebookPress}
      onLoginPress={handleLoginPress}
      onBackPress={handleBackPress}
    />
  );
}
