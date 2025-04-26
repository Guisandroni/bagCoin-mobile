import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import images from '@/constraints/images'
import icons from '@/constraints/icons'
import TypeTransaction from '@/app/components/extract/TypeTransaction'
import SaldoContainer from '@/app/components/home/SaldoContainer'
import MetasList from '@/app/components/home/MetasList'
import Transacoes, { Transactions } from '@/app/components/Transacoes'
import Cartoes from '@/app/components/home/cartoes'
import Carteira from '@/app/components/home/carteiras'

const Home = () => {


  return (
    <SafeAreaView className='h-full bg-white'>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='flex flex-row gap-2 justify-between items-center'>
          <Image source={images.avatar} className='size-8' />
          <Text className='text-lg font-rubik-bold'>Guilherme Dias</Text>
          <TouchableOpacity>
            <Image source={icons.bell} className='size-6' />
          </TouchableOpacity>
        </View>

        <SaldoContainer />

        <Carteira />
        <Cartoes />

        <MetasList />

        <Text className='mt-10 mb-4 text-xl font-rubik-semibold'>Transações</Text>

        <TypeTransaction icon={''} styleBg={'bg-primary-300'} TypeLanc='geral' />

        <FlatList
          data={Transactions}
          renderItem={({ item }) => <Transacoes category={item.category} carteira={item.carteira} value={item.value} styleIcon={item.styleIcon} styleValue={item.styleValue} />}
          scrollEnabled={false}
        />
      </ScrollView>

    </SafeAreaView>
  )
}

export default Home