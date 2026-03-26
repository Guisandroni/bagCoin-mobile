import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { TransactionForm } from "@/components/forms";

export default function NewTransactionScreen() {
  const params = useLocalSearchParams<{ type?: "expense" | "income" }>();

  const handleSubmit = async (data: {
    type: "expense" | "income";
    amount: number;
    description: string;
    categoryId: string;
    date: Date;
  }) => {
    // TODO: Call API to create transaction
    console.log("Creating transaction:", data);
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <TransactionForm
        initialType={params.type ?? "expense"}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    </View>
  );
}
