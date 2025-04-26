import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

interface Meta {
  id: number;
  nome: string;
  tipo: string;
  valor: number;
  valorAtual: number;
  cor: string;
  icon: string;
  deadline: string;
}

const metas: Meta[] = [
  {
    id: 1,
    nome: "Investimentos",
    tipo: "Meta Mensal",
    valor: 1000,
    valorAtual: 600,
    cor: "bg-blue-700",
    icon: "trending-up",
    deadline: "31/12/2024"
  },
  {
    id: 2,
    nome: "Férias",
    tipo: "Meta Anual",
    valor: 5000,
    valorAtual: 2000,
    cor: "bg-green-600",
    icon: "airplane",
    deadline: "01/07/2024"
  },
  {
    id: 3,
    nome: "Carro Novo",
    tipo: "Meta a longo prazo",
    valor: 50000,
    valorAtual: 15000,
    cor: "bg-red-600",
    icon: "car-sport",
    deadline: "31/12/2025"
  }
];

const MetasList = () => {
  const router = useRouter();
  const ultimasMetas = metas.slice(-3);

  const handleVerTodasMetas = () => {
    router.push('/(roots)/(tabs)/extract?filter=metas');
  };

  const handleMetaPress = (metaId: number) => {
    router.push(`/functions-page/metas-detalhadas?id=${metaId}`);
  };

  const getProgressoPercentual = (atual: number, total: number) => {
    return (atual / total) * 100;
  };

  return (
    <View className='mt-8'>
      <View className='flex-row justify-between items-center mb-4'>
        <Text className='text-xl font-rubik-semibold'>Minhas Metas</Text>
        <TouchableOpacity onPress={handleVerTodasMetas}>
          <Text className='text-primary-300 font-rubik-medium'>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <View className='flex flex-col gap-4'>
        {ultimasMetas.map((meta) => (
          <TouchableOpacity 
            key={meta.id}
            onPress={() => handleMetaPress(meta.id)}
            className='gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm shadow-zinc-200'
          >
            <View className='flex flex-row justify-between items-center'>
              <View className='flex flex-row gap-4 items-center'>
                <View className={`w-10 h-10 ${meta.cor} rounded-full items-center justify-center`}>
                  <Ionicons name={meta.icon as any} size={20} color="white" />
                </View>
                <View className='flex items-start'>
                  <Text className='text-lg font-rubik-semibold'>{meta.nome}</Text>
                  <Text className='text-sm text-gray-500 font-rubik'>{meta.tipo}</Text>
                </View>
              </View>
              <View className='items-end'>
                <Text className='text-sm font-rubik-medium'>
                  R$ {meta.valorAtual.toFixed(2)}
                </Text>
                <Text className='text-xs text-gray-500'>
                  de R$ {meta.valor.toFixed(2)}
                </Text>
              </View>
            </View>

            <View className='mt-2'>
              <View className='overflow-hidden h-2 bg-gray-100 rounded-full'>
                <View 
                  className={`h-full ${meta.cor} rounded-full`}
                  style={{ width: `${getProgressoPercentual(meta.valorAtual, meta.valor)}%` }}
                />
              </View>
              <Text className='mt-1 text-xs text-gray-500'>
                Vencimento: {meta.deadline}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default MetasList