import { Button, Image, Text, View } from "react-native";

export default function Welcome() {
    return (
        <View
            className="flex items-center justify-center p-4 gap-6"
        >
            <Image 
            className="w-40 h-40 object-cover"
            source={require('../../assets/images/bag.gif')} 
            />


            <Text className="text-blue-500 font-bold text-6xl">BagCoin</Text>

            <Text className="font-light text-xl">Sua Solução Completa para Gestão Financeira</Text>


          
               <Text className="text-xl font-light text-center">Controle suas finanças com facilidade. Acompanhe gastos, defina metas, analise investimentos e tome decisões financeiras inteligentes com o BagCoin.</Text>
                <Button 
                
                title="Começar Agora"/>
        </View>
    )
}