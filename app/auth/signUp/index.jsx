import { View, Text, TextInput, TouchableOpacity, ToastAndroid, StatusBar, KeyboardAvoidingView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/authContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const SignUp = () => {
    const router = useRouter();
    const { user,register, isLoading: contextLoading} = useAuth();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('')
    const [gitHub, setGitHub]= useState('')
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Handle navigation if user is already logged in
    useEffect(() => {
        if (user) {
            // Redirect to home or main screen
            router.replace('/Chat');
        }
    }, [user]);

    const onSubmit = async () => {
        // Validate inputs
        if (!name || !email || !password) {
            ToastAndroid.show("Minimum requirements are name, email and password", ToastAndroid.BOTTOM);
            return;
        }

        // Validate name length
        if (name.length < 2) {
            ToastAndroid.show("Name must be at least 2 characters", ToastAndroid.BOTTOM);
            return;
        }

        if (!isSigningUp) {
            setLoading(true);
            setIsSigningUp(true);
            
            try {
                // Modify your create user function to accept name as third parameter
                let response = await register(email, password, name, phone, gitHub)
                console.log(response)
                // Navigation will be handled by useEffect
            } catch (error) {
                setErrorMessage(error.message);
                // console.log(errorMessage);
                ToastAndroid.show(error.message, ToastAndroid.BOTTOM);
            } finally {
                setIsSigningUp(false);
                setLoading(false);
            }
        }
    };

    // Prevent interaction while context is loading
    if (contextLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={Styles.container}
        >
            <StatusBar barStyle='dark-content' />
            <TouchableOpacity 
                style={{ marginTop: 15 }} 
                onPress={() => router.push("./signIn")}
            >
                <Ionicons name="arrow-back-outline" size={24} color="black" />
            </TouchableOpacity>
            
            <Text style={{ fontFamily: 'outfit-bold', fontSize: 25, marginTop: 0 }}>
                Create New Account
            </Text>

            <Text style={Styles.inptext}>EMAIL</Text>
                <TextInput 
                    style={Styles.input} 
                    placeholder='Enter Email'
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={Styles.inptext}>PASSWORD</Text>
                <TextInput 
                    style={Styles.input} 
                    placeholder='Enter Password' 
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                />

            <View style={{ marginTop: 30 }}>
                <Text style={Styles.inptext}>NAME</Text>
                <TextInput 
                    style={Styles.input} 
                    placeholder='Enter Name'
                    value={name}
                    onChangeText={setName}
                />
                <Text style={Styles.inptext}>PHONE</Text>
                <TextInput 
                    style={Styles.input} 
                    placeholder='Enter Phone number'
                    value={phone}
                    onChangeText={setPhone}
                />

                <Text style={Styles.inptext}>GITHUB</Text>
                <TextInput 
                    style={Styles.input} 
                    placeholder='Enter GitHub ID'
                    value={gitHub}
                    onChangeText={setGitHub}
                />

                <View style={{ marginTop: 0 }}>
                    <TouchableOpacity 
                        style={[
                            Styles.buttonStyle, 
                            (loading || isSigningUp) && { opacity: 0.7 }
                        ]}
                        onPress={onSubmit}
                        disabled={loading || isSigningUp}
                    >
                        <Text style={{ color: 'white', textAlign: "center", fontSize: 20 }}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const Styles = StyleSheet.create({
    container: {
        padding: 30,
        marginTop: 20,
        flex: 1,
        backgroundColor: 'white'
    },
    input: {
        borderWidth: 1,
        padding: 15,
        marginTop: 10,
        fontSize: 18,
        borderRadius: 15,
        fontFamily: 'outfit-medium',
        borderColor: 'grey'
    },
    inptext: {
        fontFamily: 'outfit',
        fontSize: 19,
        marginTop: 5,
    },
    buttonStyle: {
        marginTop: 20,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        backgroundColor: 'black',
        textAlign: 'center'
    }
});

export default SignUp;