import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'


export const Cartoes = () => {
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [novoCartao, setNovoCartao] = useState({ nome: '', limite: '', fechamento: '', vencimento: '' });

    // Dados de exemplo - substituir por dados reais do backend
   

    const [cartoes, setCartoes] = useState([
        { id: 1, nome: 'Nubank', limite: 5000, fechamento: 10, vencimento: 17, disponivel: 3500 },
        { id: 2, nome: 'Inter', limite: 3000, fechamento: 5, vencimento: 12, disponivel: 3000 },
    ]);

   

    const handleAddCard = () => {
        if (novoCartao.nome && novoCartao.limite) {
            setCartoes([...cartoes, {
                id: cartoes.length + 1,
                nome: novoCartao.nome,
                limite: Number(novoCartao.limite),
                fechamento: Number(novoCartao.fechamento),
                vencimento: Number(novoCartao.vencimento),
                disponivel: Number(novoCartao.limite)
            }]);
            setNovoCartao({ nome: '', limite: '', fechamento: '', vencimento: '' });
            setShowAddCardModal(false);
        }
    };

   

    const handleDeleteCard = (id: number, nome: string) => {
        Alert.alert(
            "Excluir Cartão",
            `Tem certeza que deseja excluir o cartão "${nome}"?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    onPress: () => {
                        setCartoes(cartoes.filter(cartao => cartao.id !== id));
                    },
                    style: "destructive"
                }
            ]
        );
    };
    return (
        <>
            <View className="mt-6">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-rubik-semibold">Cartões de Crédito</Text>
                    <TouchableOpacity
                        onPress={() => setShowAddCardModal(true)}
                        className="p-2 rounded-full bg-primary-300"
                    >
                        <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-4">
                        {cartoes.map((cartao) => (
                            <View key={cartao.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-[200px]">
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center">
                                        <Ionicons name="card-outline" size={20} color="#666" />
                                        <Text className="ml-2 font-rubik-medium">{cartao.nome}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteCard(cartao.id, cartao.nome)}
                                        className="p-1"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                                <View className="space-y-1">
                                    <Text className="text-sm text-gray-500">Limite: R$ {cartao.limite.toFixed(2)}</Text>
                                    <Text className="text-sm text-gray-500">Disponível: R$ {cartao.disponivel.toFixed(2)}</Text>
                                    <Text className="text-xs text-gray-400">
                                        Fecha dia {cartao.fechamento} e vence dia {cartao.vencimento}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            <Modal
                visible={showAddCardModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddCardModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowAddCardModal(false)}
                    className="flex-1 bg-black/50"
                >
                    <View className="justify-end flex-1">
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            <View className="bg-white rounded-t-3xl">
                                <View className="p-4 border-b border-gray-200">
                                    <Text className="text-xl font-semibold text-center">Novo Cartão de Crédito</Text>
                                </View>
                                <View className="p-4 space-y-4">
                                    <View>
                                        <Text className="mb-2 text-sm font-medium text-gray-700">Nome do Cartão</Text>
                                        <TextInput
                                            className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl"
                                            placeholder="Digite o nome"
                                            value={novoCartao.nome}
                                            onChangeText={(text) => setNovoCartao({ ...novoCartao, nome: text })}
                                        />
                                    </View>
                                    <View>
                                        <Text className="mb-2 text-sm font-medium text-gray-700">Limite</Text>
                                        <TextInput
                                            className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl"
                                            placeholder="R$ 0,00"
                                            keyboardType="numeric"
                                            value={novoCartao.limite}
                                            onChangeText={(text) => setNovoCartao({ ...novoCartao, limite: text })}
                                        />
                                    </View>
                                    <View className="flex-row space-x-4">
                                        <View className="flex-1">
                                            <Text className="mb-2 text-sm font-medium text-gray-700">Dia Fechamento</Text>
                                            <TextInput
                                                className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl"
                                                placeholder="Dia"
                                                keyboardType="numeric"
                                                value={novoCartao.fechamento}
                                                onChangeText={(text) => setNovoCartao({ ...novoCartao, fechamento: text })}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="mb-2 text-sm font-medium text-gray-700">Dia Vencimento</Text>
                                            <TextInput
                                                className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl"
                                                placeholder="Dia"
                                                keyboardType="numeric"
                                                value={novoCartao.vencimento}
                                                onChangeText={(text) => setNovoCartao({ ...novoCartao, vencimento: text })}
                                            />
                                        </View>
                                    </View>
                                    <View className="flex-row space-x-4">
                                        <TouchableOpacity
                                            onPress={() => setShowAddCardModal(false)}
                                            className="flex-1 p-4 border border-gray-200 rounded-xl"
                                        >
                                            <Text className="text-center text-gray-700">Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleAddCard}
                                            className="flex-1 p-4 bg-primary-300 rounded-xl"
                                        >
                                            <Text className="font-medium text-center text-white">Salvar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    )
}