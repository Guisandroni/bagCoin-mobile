import { router } from "expo-router";
import { Modal, TouchableOpacity, View, Text } from "react-native"
import { Ionicons } from '@expo/vector-icons';

type ModalRoutes = '/modal-pages/despesa' | '/modal-pages/metas' | '/modal-pages/receitas';

const Modaladd = ({ visible, onClose }: { visible: any, onClose: any }) => {
    const handleNavigation = (route: ModalRoutes) => {
        onClose();
        setTimeout(() => {
            router.push(route as any);
        }, 100);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="justify-end flex-1 bg-black/50">
                <View className="p-6 bg-white h-72 rounded-t-3xl">
                    <Text className="mb-6 text-xl font-bold text-center">Adicionar</Text>
                    
                    <View className="flex-row justify-around mb-8">
                        <TouchableOpacity
                            onPress={() => handleNavigation('/modal-pages/despesa')}
                            className="items-center w-24"
                        >
                            <View className="items-center justify-center w-16 h-16 mb-2 bg-red-100 rounded-full">
                                <Ionicons name="arrow-down-circle" size={32} color="#ef4444" />
                            </View>
                            <Text className="text-sm font-medium text-gray-600">Despesa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleNavigation('/modal-pages/metas')}
                            className="items-center w-24"
                        >
                            <View className="items-center justify-center w-16 h-16 mb-2 bg-yellow-100 rounded-full">
                                <Ionicons name="flag" size={32} color="#eab308" />
                            </View>
                            <Text className="text-sm font-medium text-gray-600">Meta</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => handleNavigation('/modal-pages/receitas')}
                            className="items-center w-24"
                        >
                            <View className="items-center justify-center w-16 h-16 mb-2 bg-green-100 rounded-full">
                                <Ionicons name="arrow-up-circle" size={32} color="#22c55e" />
                            </View>
                            <Text className="text-sm font-medium text-gray-600">Receita</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className="py-4 bg-gray-100 rounded-xl"
                        onPress={onClose}
                    >
                        <Text className="text-base font-medium text-center text-gray-600">Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default Modaladd
