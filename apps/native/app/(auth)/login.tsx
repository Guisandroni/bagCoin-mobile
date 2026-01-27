import { router } from "expo-router";
import { AuthLoginScreen } from "@/components/auth";
import { authClient } from "@/lib/auth-client";

export default function LoginScreen() {
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

  return (
    <AuthLoginScreen
      onGooglePress={handleGooglePress}
      onFacebookPress={handleFacebookPress}
    />
  );
}
