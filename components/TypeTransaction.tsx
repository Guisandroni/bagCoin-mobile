import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const TypeTransaction = ({ icon, styleBg, TypeLanc }: { icon: any, styleBg: any, TypeLanc: string }) => {
    const handleType = () => {

    }

    const TypeTransactionDate = [
        {id:1, icons:'',TypeLanc:'Geral',styleBg:'bg-primary-100'},
        {id:2, icons:'calendar',TypeLanc:'Despesas',styleBg:'bg-red-400'},
        {id:3, icons:'calendar',TypeLanc:'Receitas',styleBg:'bg-green-400'},
        {id:4, icons:'calendar',TypeLanc:'Metas',styleBg:'bg-orange-400'},
      ]
    return (


        <SafeAreaView>
            <ScrollView className=''
                horizontal

            >
                <TouchableOpacity onPress={handleType} >

                    <View className={`bg-white px-2 py-2 rounded-full flex flex-row items-center justify-center gap-4 ${styleBg}`}>
                        <Image source={icon} className='size-6' />
                        <Text className=' text-white font-rubik'>{TypeLanc}</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>


    )
}

export default TypeTransaction