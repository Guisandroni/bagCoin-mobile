import { View, Text, ScrollView, TextInput, Image, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '@/constraints/icons'
import TypeTransaction from '@/app/components/extract/TypeTransaction'
import Transacoes, { Transactions } from '@/app/components/Transacoes'

const Extract = () => {
  
  return (
    <SafeAreaView className='h-full bg-white'>
      <ScrollView contentContainerClassName='px-4 pb-40 '>  
       <View className='flex flex-col gap-2 items-start px-2'>
       <Text className='text-xl font-rubik-bold'>Lançamentos</Text>
        <View className='flex flex-row justify-center items-center px-4 w-full bg-white rounded-full shadow-xl shadow-black-100'>
          <Image source={icons.search} className='size-4'/>
          <TextInput className='w-full' placeholder='Pesquise aqui'/>
        </View>
       </View>

       <View className='flex flex-row justify-between items-center px-4 py-2 mt-4 bg-gray-100 rounded-xl'>
        <TouchableOpacity>
          <Image source={icons.rightArrow} className='size-5'/>
        </TouchableOpacity>
      <Text>Novembro</Text>
       < TouchableOpacity>
          <Image source={icons.rightArrow} className='size-5'/>
        </TouchableOpacity>
       </View>

       <View className='flex mt-4'>
       <TypeTransaction icon={icons.calendar} TypeLanc='Despesas' styleBg={'bg-green-400'} />
       </View>

       <FlatList
          data={Transactions}
          renderItem={({item}) => <Transacoes category={item.category} carteira={item.carteira} value={item.value} styleIcon={item.styleIcon} styleValue={item.styleValue}/>
        }
        />

      </ScrollView>
    </SafeAreaView>
  )
}

export default Extract