import { StatusBar, Image, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native';
import React from 'react';
import tw from 'tailwind-react-native-classnames';
import { StyleSheet } from "react-native";
import { useRouter } from 'expo-router';  

const Login = () => {
  const router = useRouter(); 

  return (
    <View style={tw`flex-1`} >
       <StatusBar translucent backgroundColor="transparent" />
      <Image
        source={require("./../assets/images/imageone.jpg")}
        style={tw`h-1/2 w-full `}  /> 

      <View style={styles.container}>
        <Text style={styles.headingStyle}> DevTalk </Text>
        <Text style={styles.headingTwo}> Lets talk about coding developers</Text>

        <View style={tw `mt-10`}>
          <TouchableOpacity
            style={tw`bg-black border rounded-lg p-6 ml-10 mr-10 `}
            onPress={() => router.push("/auth/signIn")} 
          >
            <Text style={[tw`text-white text-center`, { fontFamily: 'outfit-medium', fontSize: 20 }]}>
             LET'S START
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginTop: -20,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    height: '100%',
    padding: 15,
  },
  headingStyle: {
    fontSize: 45,
    padding: 5,
    fontFamily: 'outfit-bold'
  },
  headingTwo: {
    padding: 20,
    marginTop: 10,
    fontFamily: "outfit",
    fontSize: 25,
    textAlign: "center",
  } 
});

export default Login;