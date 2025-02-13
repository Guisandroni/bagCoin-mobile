import { Link } from "expo-router";
import { Text, View } from "react-native";
import Welcome from "./screens/welcome";

export default function Index() {
  return (
    <View
      

      className="flex-1 justify-center items-center"
    >
      <Welcome/>
    </View>
  );
}
