import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export function ThemeToggle() {
  return (
    <View style={{ paddingHorizontal: 10 }}>
      <Ionicons color="#F1F5F9" name="moon" size={20} />
    </View>
  );
}
