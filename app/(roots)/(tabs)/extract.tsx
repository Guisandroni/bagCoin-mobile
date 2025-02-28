import { View, Text, ScrollView, TextInput, Image, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '@/constraints/icons'
import TypeTransaction from '@/components/TypeTransaction'
import Transacoes, { Transactions } from '@/components/Transacoes'

const Extract = () => {
  
  return (
    <SafeAreaView className='bg-white h-full'>
      <ScrollView contentContainerClassName='px-4 pb-40 '>  
       <View className='flex flex-col  items-start px-2 gap-2'>
       <Text className='font-rubik-bold text-xl'>Lançamentos</Text>
        <View className='flex flex-row  items-center justify-center shadow-xl shadow-black-100 bg-white w-full  rounded-full px-4'>
          <Image source={icons.search} className='size-4'/>
          <TextInput className='w-full' placeholder='Pesquise aqui'/>
        </View>
       </View>

       <View className='flex flex-row  items-center justify-between px-4 mt-4 bg-gray-100 rounded-xl py-2'>
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