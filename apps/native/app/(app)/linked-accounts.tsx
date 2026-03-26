import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinkedAccountsScreen } from "@/components/screens";

export default function LinkedAccountsPage() {
  const insets = useSafeAreaInsets();

  const mockBankAccounts = [
    {
      id: 1,
      name: "Conta Corrente",
      bankName: "Nubank",
      lastFourDigits: "1234",
      balance: 12450,
      color: "#8B5CF6",
      icon: "wallet" as const,
      lastSync: "2m atrás",
      isSynced: true,
    },
    {
      id: 2,
      name: "Poupança",
      bankName: "Itaú",
      lastFourDigits: "5678",
      balance: 8200,
      color: "#EF4444",
      icon: "cash" as const,
      lastSync: "1h atrás",
      isSynced: false,
    },
  ];

  const mockCreditCards = [
    {
      id: 1,
      name: "Apple Card",
      cardType: "Gold Titanium",
      lastFourDigits: "9012",
      currentBalance: 1240.45,
      creditLimit: 5000,
      dueDay: 12,
      color: "#1A1A1A",
    },
  ];

  const handleAddConnection = () => {
    // TODO: Open bank connection flow
  };

  const handleAccountPress = (id: number) => {
    // TODO: Navigate to account details
  };

  const handleCardPress = (id: number) => {
    // TODO: Navigate to card details
  };

  const handleRefresh = (id: number) => {
    // TODO: Refresh account balance
  };

  const handlePayCard = (id: number) => {
    // TODO: Navigate to payment flow
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <LinkedAccountsScreen
        totalBalance={42550}
        percentageChange={2.4}
        bankAccounts={mockBankAccounts}
        creditCards={mockCreditCards}
        onAddConnection={handleAddConnection}
        onAccountPress={handleAccountPress}
        onCardPress={handleCardPress}
        onRefresh={handleRefresh}
        onPayCard={handlePayCard}
        onBackPress={handleBackPress}
      />
    </View>
  );
}
