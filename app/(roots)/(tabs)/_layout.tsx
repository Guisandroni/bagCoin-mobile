import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import NavigatorTabs from '@/components/NavigatorTabs'
import icons from '@/constraints/icons'

const TabsLayout = () => {
  return (
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
        }
    }}
>
    <Tabs.Screen
        name='home'
        options={{
            title: 'Home',
            tabBarIcon:({focused})=>(
              <NavigatorTabs focused={focused} title='Home' icon={icons.home}/>
            )
          
        }}
    />

<Tabs.Screen
        name='extract'
        options={{
            title: 'Extract', 
            tabBarIcon:({focused})=>(
              <NavigatorTabs focused={focused} title='Extrato' icon={icons.wallet}/>
            ),
           
        }}
    />

    <Tabs.Screen
    name='teste'
    options={{
      title:'teste',
      tabBarIcon:({focused})=>(
        <NavigatorTabs focused={focused} title='' icon={icons.edit}/>
      ),
      

    }
    }
    />


<Tabs.Screen


        name='report'
        options={{
            title: 'Report', 
            tabBarIcon:({focused})=>(
              <NavigatorTabs focused={focused} title='Relatório' icon={icons.pieOutline}/>
            )
        }}
    />






<Tabs.Screen
        name='profile'
        options={{
            title: 'Profile', 
            tabBarIcon:({focused})=>(
              <NavigatorTabs focused={focused} title='Perfil' icon={icons.person}/>
            )
        }}
    />

</Tabs>
  )
}

export default TabsLayout