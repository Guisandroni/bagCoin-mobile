import { Link } from "expo-router";
import { Text, View, ScrollView, Image, TouchableOpacity, TextInput } from "react-native";
import bag from '../assets/images/bag.gif'
import icons from "@/constraints/icons";


export default function Index() {
  return (
    <View className="flex items-center justify-between flex-1 py-4 bg-white">
      <View className="flex flex-col items-center justify-center mt-10 ">
        <Image source={bag} className="w-40 h-40 resize-cover" />
        <Text className="mt-2 text-3xl uppercase text-primary-300 font-rubik-bold">BagCoin</Text>
        <Text className="text-3xl text-black-300 font-rubik-bold">Finance Application</Text>
      </View>

     <View className="mb-10">
     <View className="flex flex-col gap-4 px-10">
        <View className="flex flex-row items-center justify-center px-4 bg-white shadow rounded-xl shadow-zinc-200">

          <Image source={icons.calendar} className="size-6" />
          <TextInput
            className="items-stretch px-10 text-xl "
            placeholder="Endereço de e-mail"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View className="flex flex-row items-center justify-center px-4 bg-white shadow rounded-xl shadow-zinc-200">

          <Image source={icons.people} className="size-6" />
          <TextInput
            className="items-stretch px-10 text-xl "
            placeholder="Endereço de e-mail"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          className='py-3 mt-5 bg-white rounded-full shadow-xl shadow-zinc-600'

        >
          <Link href={'/(roots)/(tabs)/home'}>
          <Text
            className='ml-2 text-lg text-center font-rubik-medium text-black-300'
          >Login</Text>
          </Link>

        </TouchableOpacity>
      </View>

      <View className="px-10 mt-4">
        <Text className='mt-12 text-lg text-center font-rubik text-black-200'>
          Login to BagCoin with Google
        </Text>

        <TouchableOpacity
          className='w-full px-6 py-4 mt-5 bg-white rounded-full shadow-xl shadow-zinc-600'
        >
          <View className='flex flex-row items-center justify-center gap-2'>
            <Image source={icons.google}
              className='w-6 h-6'
              resizeMode='contain'
            />
            <Text
              className='ml-2 text-lg font-rubik-bold text-black-300'
            >Continue With Google</Text>
          </View>
        </TouchableOpacity>
      </View>
     </View>
    </View>
  );
}
