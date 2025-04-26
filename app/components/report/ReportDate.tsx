import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'

export const reportDate = [
    {id:1,title:'Hoje'},
    {id:2,title:'Mês Atual'},
    {id:3,title:'Semana Atual'},
    {id:4,title:'Semana Passada'},
]
const ReportDate = () => {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className='py-4 mt-1'>
           {reportDate.map((item,index) =>(
             <TouchableOpacity className='px-5 py-2 mr-4 bg-white rounded-xl shadow-lg'>
             <Text className='font-rubik-medium'>{item.title}</Text>
         </TouchableOpacity>
           ))}
        </ScrollView>
    )
}

export default ReportDate