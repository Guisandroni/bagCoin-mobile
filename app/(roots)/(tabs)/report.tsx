import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '@/constraints/icons'
import ReportDate from '@/components/ReportDate'

const Report = () => {
  return (
    <SafeAreaView className='h-full bg-white'>
      <ScrollView contentContainerClassName='pb-40 px-4'>

       <Text className='font-rubik-bold text-xl'>Lançamentos</Text>

       <View className='flex flex-row  items-center justify-between px-4 mt-4 bg-gray-100 rounded-xl py-2'>
        <TouchableOpacity>
          <Image source={icons.rightArrow} className='size-5'/>
        </TouchableOpacity>
      <Text>Novembro</Text>
       < TouchableOpacity>
          <Image source={icons.rightArrow} className='size-5'/>
        </TouchableOpacity>
       </View>

       
     
        <ReportDate />
        


      </ScrollView>
    </SafeAreaView>
  )
}

export default Report