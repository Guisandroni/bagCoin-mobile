import { View, Text, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import images from '@/constraints/images'
import icons from '@/constraints/icons'
import TypeTransaction from '@/components/TypeTransaction'
import SaldoContainer from '@/components/SaldoContainer'
import MetasList from '@/components/MetasList'
import Transacoes, { Transactions } from '@/components/Transacoes'

const Home = () => {

  const handleType = () => {
    console.log('click')
  }

 
  return (
    <SafeAreaView className='h-full bg-white'>
      <ScrollView
        contentContainerClassName='px-4 pb-40 py-4'
      >
        <View className='flex flex-row items-center justify-between gap-2'>
          <Image source={images.avatar} className='size-8' />
          <Text className='text-lg font-rubik-bold'>Guilherme Dias</Text>
          <TouchableOpacity>
            <Image source={icons.bell} className='size-6' />
          </TouchableOpacity>
        </View>

        <SaldoContainer />

        <MetasList />

        {/* <View className='mt-6 flex flex-col w-full items-start gap-4'> */}
        <Text className='text-xl font-rubik-semibold mt-10 mb-4'>Transações</Text>

        <TypeTransaction icon={''} styleBg={'bg-primary-300'} TypeLanc='geral' />

        <FlatList
          data={Transactions}
          renderItem={({item}) => <Transacoes category={item.category} carteira={item.carteira} value={item.value} styleIcon={item.styleIcon} styleValue={item.styleValue}/>
        }
        />

      </ScrollView>

    </SafeAreaView>
  )
}

export default Home