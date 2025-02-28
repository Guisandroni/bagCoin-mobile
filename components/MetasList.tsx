import { View, Text } from 'react-native'
import React from 'react'

const MetasList = () => {
  return (
    <View className='mt-8'>
    <Text className='text-xl font-rubik-semibold'>Minhas Metas</Text>

    <View className='flex flex-col gap-4 mt-4'>

      <View className='gap-3 px-2 py-3 bg-white shadow-xl shadow-zinc-400 rounded-xl'>
        <View className='flex flex-row items-center justify-start gap-4'>
          <View className='w-10 h-10 bg-blue-800 rounded-full'></View>
          <View className='flex items-start'>
            <Text className='text-lg font-rubik-semibold'>Investimentos</Text>
            <Text className='text-md font-rubik text-black-100'>Meta Mensal</Text>
          </View>
        </View>

        <View>
          <View className='h-2 bg-blue-700 rounded-full'></View>
          
        </View>
      </View>

      <View className='gap-3 px-2 py-3 bg-white shadow-xl shadow-zinc-400 rounded-xl'>
        <View className='flex flex-row items-center justify-start gap-4'>
          <View className='w-10 h-10 bg-green-600 rounded-full'></View>
          <View className='flex items-start'>
            <Text className='text-lg font-rubik-semibold'>Férias</Text>
            <Text className='text-md font-rubik text-black-100'>Meta Anual</Text>
          </View>
        </View>

        <View>
          <View className='h-2 bg-green-600 rounded-full'></View>
          
        </View>
      </View>

      <View className='gap-3 px-2 py-3 bg-white shadow-xl shadow-zinc-400 rounded-xl'>
        <View className='flex flex-row items-center justify-start gap-4'>
          <View className='w-10 h-10 bg-red-600 rounded-full'></View>
          <View className='flex items-start'>
            <Text className='text-lg font-rubik-semibold'>Carro Novo</Text>
            <Text className='text-md font-rubik text-black-100'>Meta a longo prazo</Text>
          </View>
        </View>

        <View>
          <View className='h-2 bg-red-600 rounded-full'></View>
          
        </View>
      </View>
    </View>
  </View>
  )
}

export default MetasList