import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

 const Carteira = () => {
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [novaCarteira, setNovaCarteira] = useState({ nome: '', saldo: '' });

  // Dados de exemplo - substituir por dados reais do backend
  const [carteiras, setCarteiras] = useState([
    { id: 1, nome: 'Carteira Principal', saldo: 1500 },
    { id: 2, nome: 'Poupança', saldo: 5000 },
  ]);
  

  const handleAddWallet = () => {
    if (novaCarteira.nome && novaCarteira.saldo) {
      setCarteiras([...carteiras, {
        id: carteiras.length + 1,
        nome: novaCarteira.nome,
        saldo: Number(novaCarteira.saldo)
      }]);
      setNovaCarteira({ nome: '', saldo: '' });
      setShowAddWalletModal(false);
    }
  };


  const handleDeleteWallet = (id: number, nome: string) => {
    Alert.alert(
      "Excluir Carteira",
      `Tem certeza que deseja excluir a carteira "${nome}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Excluir",
          onPress: () => {
            setCarteiras(carteiras.filter(carteira => carteira.id !== id));
          },
          style: "destructive"
        }
      ]
    );
  };


  return (
    <>
      <View className="mt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-rubik-semibold">Carteiras</Text>
          <TouchableOpacity
            onPress={() => setShowAddWalletModal(true)}
            className="p-2 rounded-full bg-primary-300"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-4">
            {carteiras.map((carteira) => (
              <View key={carteira.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-[160px]">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="wallet-outline" size={20} color="#666" />
                    <Text className="ml-2 font-rubik-medium">{carteira.nome}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteWallet(carteira.id, carteira.nome)}
                    className="p-1"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text className="text-lg font-rubik-bold text-primary-300">
                  R$ {carteira.saldo.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showAddWalletModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddWalletModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowAddWalletModal(false)}
          className="flex-1 bg-black/50"
        >
          <View className="flex-1 justify-end">
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-3xl">
                <View className="p-4 border-b border-gray-200">
                  <Text className="text-xl font-semibold text-center">Nova Carteira</Text>
                </View>
                <View className="p-4 space-y-4">
                  <View>
                    <Text className="mb-2 text-sm font-medium text-gray-700">Nome da Carteira</Text>
                    <TextInput
                      className="p-4 w-full bg-gray-50 rounded-xl border border-gray-200"
                      placeholder="Digite o nome"
                      value={novaCarteira.nome}
                      onChangeText={(text) => setNovaCarteira({ ...novaCarteira, nome: text })}
                    />
                  </View>
                  <View>
                    <Text className="mb-2 text-sm font-medium text-gray-700">Saldo Inicial</Text>
                    <TextInput
                      className="p-4 w-full bg-gray-50 rounded-xl border border-gray-200"
                      placeholder="R$ 0,00"
                      keyboardType="numeric"
                      value={novaCarteira.saldo}
                      onChangeText={(text) => setNovaCarteira({ ...novaCarteira, saldo: text })}
                    />
                  </View>
                  <View className="flex-row space-x-4">
                    <TouchableOpacity
                      onPress={() => setShowAddWalletModal(false)}
                      className="flex-1 p-4 rounded-xl border border-gray-200"
                    >
                      <Text className="text-center text-gray-700">Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAddWallet}
                      className="flex-1 p-4 rounded-xl bg-primary-300"
                    >
                      <Text className="font-medium text-center text-white">Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>

  )
}

export default Carteira