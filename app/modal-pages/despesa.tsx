import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Modal } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const categorias = [
  "Criar Nova Categoria",
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Outros"
]

const Despesa = () => {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [showCategorias, setShowCategorias] = useState(false);
  const [showNovaCategoriaModal, setShowNovaCategoriaModal] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');

  const handleCategoriaSelect = (cat: string) => {
    if (cat === "Criar Nova Categoria") {
      setShowNovaCategoriaModal(true);
    } else {
      setCategoria(cat);
    }
    setShowCategorias(false);
  };

  const handleSalvarNovaCategoria = () => {
    if (novaCategoria.trim()) {
      setCategoria(novaCategoria);
      setNovaCategoria('');
      setShowNovaCategoriaModal(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Nova Despesa</Text>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Salvar</Text>
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView className="flex-1 p-4">
          <View className="space-y-6">
            {/* Nome */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Nome da Despesa</Text>
              <TextInput
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
                placeholder="Digite o nome"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            {/* Valor */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Valor</Text>
              <TextInput
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
                placeholder="R$ 0,00"
                keyboardType="numeric"
                value={valor}
                onChangeText={setValor}
              />
            </View>

            {/* Categoria */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Categoria</Text>
              <TouchableOpacity 
                onPress={() => setShowCategorias(true)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl flex-row justify-between items-center"
              >
                <Text className={categoria ? "text-black" : "text-gray-400"}>
                  {categoria || "Selecione uma categoria"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Descrição */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Descrição</Text>
              <TextInput
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
                placeholder="Digite uma descrição"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={descricao}
                onChangeText={setDescricao}
              />
            </View>
          </View>
        </ScrollView>

        {/* Modal de Categorias */}
        <Modal
          visible={showCategorias}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategorias(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl">
              <View className="p-4 border-b border-gray-200">
                <Text className="text-xl font-semibold text-center">Selecione a Categoria</Text>
              </View>
              <ScrollView className="max-h-96">
                {categorias.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCategoriaSelect(cat)}
                    className="p-4 border-b border-gray-100 flex-row items-center"
                  >
                    {index === 0 ? (
                      <View className="flex-row items-center">
                        <Ionicons name="add-circle" size={24} color="#3b82f6" className="mr-2" />
                        <Text className="text-blue-500 font-medium">{cat}</Text>
                      </View>
                    ) : (
                      <Text className="text-gray-700">{cat}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setShowCategorias(false)}
                className="p-4 border-t border-gray-200"
              >
                <Text className="text-center text-blue-500 font-medium">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Nova Categoria */}
        <Modal
          visible={showNovaCategoriaModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNovaCategoriaModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl">
              <View className="p-4 border-b border-gray-200">
                <Text className="text-xl font-semibold text-center">Nova Categoria</Text>
              </View>
              <View className="p-4">
                <TextInput
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4"
                  placeholder="Nome da nova categoria"
                  value={novaCategoria}
                  onChangeText={setNovaCategoria}
                />
                <View className="flex-row space-x-4">
                  <TouchableOpacity
                    onPress={() => setShowNovaCategoriaModal(false)}
                    className="flex-1 p-4 border border-gray-200 rounded-xl"
                  >
                    <Text className="text-center text-gray-700">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSalvarNovaCategoria}
                    className="flex-1 p-4 bg-blue-500 rounded-xl"
                  >
                    <Text className="text-center text-white font-medium">Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

export default Despesa