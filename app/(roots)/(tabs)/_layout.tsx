import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Tabs } from 'expo-router'
import NavigatorTabs from '@/app/(roots)/(tabs)/components/NavigatorTabs'
import icons from '@/constraints/icons'
import Modaladd from '@/app/(roots)/(tabs)/components/modalAdd'
import { Ionicons } from '@expo/vector-icons'

const TabsLayout = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false,
          title: '',
          tabBarStyle: {
            backgroundColor: 'white',
            position: 'absolute',
            borderTopColor: '#f0f0f2',
            borderTopWidth: 1,
            minHeight: 70,
            paddingHorizontal: 10
          }
        }}
      >
        <Tabs.Screen
          name='home'
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <NavigatorTabs focused={focused} title='Home' icon={icons.home} />
            )
          }}
        />

        <Tabs.Screen
          name='extract'
          options={{
            title: 'Extract',
            tabBarIcon: ({ focused }) => (
              <NavigatorTabs focused={focused} title='Extrato' icon={icons.wallet} />
            ),
          }}
        />

        <Tabs.Screen
          name='add'
          options={{
            title: 'Add',
            tabBarButton: () => (
              <View className="items-center" style={{ width: 75 }}>
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  className="items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-lg"
                  style={{
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  }}
                >
                  <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
              </View>
            )
          }}
        />

        <Tabs.Screen
          name='report'
          options={{
            title: 'Report',
            tabBarIcon: ({ focused }) => (
              <NavigatorTabs focused={focused} title='Relatório' icon={icons.pieOutline} />
            )
          }}
        />

        <Tabs.Screen
          name='profile'
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <NavigatorTabs focused={focused} title='Perfil' icon={icons.person} />
            )
          }}
        />
      </Tabs>
      <Modaladd visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  )
}

export default TabsLayout