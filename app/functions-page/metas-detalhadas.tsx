import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet from '@gorhom/bottom-sheet';

interface Meta {
  id: number;
  nome: string;
  tipo: string;
  valor: number;
  valorAtual: number;
  cor: string;
  icon: string;
  deadline: string;
  descricao: string;
  categoria: string;
}

const MetasDetalhadas = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategorias, setShowCategorias] = useState(false);

  // Simulated data - replace with your actual data fetching
  useEffect(() => {
    setMeta({
      id: 1,
      nome: "Investimentos",
      tipo: "Meta Mensal",
      valor: 1000,
      valorAtual: 600,
      cor: "bg-purple-600",
      icon: "trending-up",
      deadline: "2024-12-31",
      descricao: "Meta para investimentos mensais",
      categoria: "Investimento"
    });
  }, [id]);

  const handleSave = () => {
    // Implement save functionality
    Alert.alert("Sucesso", "Meta atualizada com sucesso!");
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta meta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            // Implement delete functionality
            router.back();
          }
        }
      ]
    );
  };

  if (!meta) return null;

  const progresso = (meta.valorAtual / meta.valor) * 100;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-semibold">Detalhes da Meta</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {/* Progress Circle */}
        <View className="items-center mb-6">
          <View className="w-32 h-32 rounded-full border-8 border-purple-200 items-center justify-center">
            <Text className="text-2xl font-rubik-bold text-purple-600">
              {progresso.toFixed(0)}%
            </Text>
          </View>
          <Text className="mt-2 text-gray-600">
            R$ {meta.valorAtual.toFixed(2)} de R$ {meta.valor.toFixed(2)}
          </Text>
        </View>

        {/* Form Fields */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-rubik-medium text-gray-600 mb-1">Nome da Meta</Text>
            <TextInput
              value={meta.nome}
              onChangeText={(text) => setMeta({ ...meta, nome: text })}
              className="p-3 bg-gray-50 rounded-xl border border-gray-200"
            />
          </View>

          <View>
            <Text className="text-sm font-rubik-medium text-gray-600 mb-1">Valor Total</Text>
            <TextInput
              value={meta.valor.toString()}
              onChangeText={(text) => setMeta({ ...meta, valor: parseFloat(text) || 0 })}
              keyboardType="numeric"
              className="p-3 bg-gray-50 rounded-xl border border-gray-200"
            />
          </View>

          <View>
            <Text className="text-sm font-rubik-medium text-gray-600 mb-1">Valor Atual</Text>
            <TextInput
              value={meta.valorAtual.toString()}
              onChangeText={(text) => setMeta({ ...meta, valorAtual: parseFloat(text) || 0 })}
              keyboardType="numeric"
              className="p-3 bg-gray-50 rounded-xl border border-gray-200"
            />
          </View>

          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            className="p-3 bg-gray-50 rounded-xl border border-gray-200"
          >
            <Text className="text-sm font-rubik-medium text-gray-600">Data Limite</Text>
            <Text>{meta.deadline}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowCategorias(true)}
            className="p-3 bg-gray-50 rounded-xl border border-gray-200"
          >
            <Text className="text-sm font-rubik-medium text-gray-600">Categoria</Text>
            <Text>{meta.categoria}</Text>
          </TouchableOpacity>

          <View>
            <Text className="text-sm font-rubik-medium text-gray-600 mb-1">Descrição</Text>
            <TextInput
              value={meta.descricao}
              onChangeText={(text) => setMeta({ ...meta, descricao: text })}
              multiline
              numberOfLines={4}
              className="p-3 bg-gray-50 rounded-xl border border-gray-200"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          className="mt-6 p-4 bg-purple-600 rounded-xl"
        >
          <Text className="text-white text-center font-rubik-semibold">
            Salvar Alterações
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(meta.deadline)}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setMeta({
                ...meta,
                deadline: date.toISOString().split('T')[0]
              });
            }
          }}
        />
      )}

      {/* Categories Bottom Sheet */}
      <BottomSheet
        index={showCategorias ? 0 : -1}
        snapPoints={['50%']}
        onClose={() => setShowCategorias(false)}
      >
        <View className="p-4">
          <Text className="text-xl font-rubik-semibold mb-4">Categorias</Text>
          {['Viagem', 'Educação', 'Casa Própria', 'Carro', 'Investimento', 'Emergência'].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setMeta({ ...meta, categoria: cat });
                setShowCategorias(false);
              }}
              className="p-3 border-b border-gray-100"
            >
              <Text className="font-rubik">{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </ScrollView>
  );
};

export default MetasDetalhadas;