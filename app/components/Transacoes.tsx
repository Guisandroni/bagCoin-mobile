import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import icons from '@/constraints/icons'

export const Transactions= [
    { id:1, category:'Mercado', carteira:'Carteira', value:890, styleIcon: 'bg-red-400', styleValue: 'text-red-500'},
    { id:2, category:'Boleto', carteira:'Pix', value:1700, styleIcon: 'bg-red-400', styleValue: 'text-red-500'},

    { id:3, category:'Carro', carteira:'Pix', value:30000, styleIcon: 'bg-green-400', styleValue: 'text-green-500'},

    { id:4, category:'Mercado Livre', carteira:'Cartão de Crédito', value:560, styleIcon: 'bg-green-400', styleValue: 'text-green-500'},

    { id:5, category:'Netflix', carteira:'Cartão de Crédito', value:60, styleIcon: 'bg-red-400', styleValue: 'text-red-500'},
    { id:6, category:'Academia', carteira:'Cartão de Debito', value:120, styleIcon: 'bg-red-400', styleValue: 'text-red-500'},
    { id:6, category:'Salário', carteira:'Transferência', value:5000, styleIcon: 'bg-blue-200', styleValue: 'text-green-500'}



  ]
const Transacoes = ({category,carteira,value,styleIcon,styleValue}: {category:string,carteira:string,value:number,styleIcon:any,styleValue:any}) => {
    const FormatValue = value.toLocaleString('pt-br', {style:'currency', currency:'BRL'})
   
    return (
        <TouchableOpacity className='flex flex-row gap-4 justify-between items-center py-4 mt-4 border-b border-primary-200'>
            <View className='flex flex-row gap-4 items-center'>
                <View className={`p-2 bg-white rounded-full ${styleIcon}`}>
                    <Image source={icons.chat} className='size-6' tintColor={'black'} />
                </View>
                <View className='w-30'>
                    <Text className='font-rubik text-black-300'>{category}</Text>
                    <Text className='uppercase font-rubik text-black-100'>{carteira}</Text>
                </View>
            </View>
            <Text className={`text-xl font-rubik-semibold ${styleValue}`}>{FormatValue}</Text>
        </TouchableOpacity>
    )
}

export default Transacoes