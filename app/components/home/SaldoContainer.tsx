import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import icons from '@/constraints/icons'

const SaldoContainer = () => {
  return (
    <View className='flex flex-col gap-2 justify-center px-8 py-5 mt-6 bg-gray-100 rounded-xl'>
             <View className='flex flex-row justify-between items-center'>
               <Text className='text-xl font-rubik-semibold'>R$ 3.480,00</Text>
               <Image source={icons.info} className='font-bold size-6' />
             </View>
   
             <View className='flex flex-row gap-4 items-center'>
               <TouchableOpacity className='gap-2 px-6 py-3 bg-green-100 rounded-xl'>
                 <Text className='text-lg font-rubik text-black-100'>$ receitas</Text>
                 <Text className='text-xl text-green-600 font-rubik-semibold'>R$5.000,00</Text>
               </TouchableOpacity>
   
               <TouchableOpacity className='gap-2 px-6 py-3 bg-red-100 rounded-xl'>
                 <Text className='text-lg font-rubik text-black-100'># despesas</Text>
                 <Text className='text-xl text-red-600 font-rubik-semibold'>R$5.000,00</Text>
               </TouchableOpacity>
             </View>
   
           </View>
  )
}

export default SaldoContainer