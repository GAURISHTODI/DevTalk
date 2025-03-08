import { View, Text, TextInput, StyleSheet, TouchableOpacity, ToastAndroid, StatusBar, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { doSignInWithGoogle } from '../../firebase/auth';
import { useAuth } from '../../context/authContext';

const SignIn = () => {
    // Destructure necessary methods from AuthContext
    const { login, user, isLoading: contextLoading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setIsLoading] = useState(false);

    // Handle navigation if user is already logged in
    useEffect(() => {
        if (user) {
            // Redirect to home or main screen
            router.replace('/Chat');
        }
    }, [user]);

    const onSubmit = async () => {
        // Input validation
        if (!email || !password) {
            ToastAndroid.show("Please enter email and password", ToastAndroid.BOTTOM);
            return;
        }

        if (!isSigningIn) {
            setIsLoading(true);
            setIsSigningIn(true);
            try {
                // Use the login method from AuthContext
                await login(email, password);
                
                // Navigation will be handled by useEffect
                ToastAndroid.show("Signed in successfully!", ToastAndroid.BOTTOM);
            } catch (error) {
                // setErrorMessage(error.message);
                // ToastAndroid.show(error.message, ToastAndroid.BOTTOM);
            } finally {
                setIsSigningIn(false);
                setIsLoading(false);
            }
        }
    };

    const onGoogleSignIn = async () => {
        if (!isSigningIn) {
            setIsSigningIn(true);
            try {
                // Implement Google Sign-In through your existing method
                await doSignInWithGoogle();
                
                // Navigation will be handled by useEffect
                ToastAndroid.show("Google Sign-In successful!", ToastAndroid.BOTTOM);
            } catch (error) {
                setErrorMessage(error.message);
                ToastAndroid.show(error.message, ToastAndroid.BOTTOM);
            } finally {
                setIsSigningIn(false);
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
            style={{ padding: 25, backgroundColor: 'white', height: '100%' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <StatusBar barStyle='dark-content' />
            <TouchableOpacity style={{ marginTop: 30, margin: 5 }} onPress={() => router.push('/Login')}>
                <Ionicons name="arrow-back-outline" size={24} color="black" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'outfit-bold', fontSize: 30, padding: 20, marginTop: 10 }}>
                Let's Sign you In
            </Text>
            <Text style={{ fontFamily: 'outfit', fontSize: 21, color: 'grey', marginTop: 0 }}>
                Welcome back! We are excited to see you again!
            </Text>

            <View style={{ marginTop: 10 }}>
                <Text style={Styles.inptext}>EMAIL</Text>
                <TextInput
                    style={Styles.input}
                    onChangeText={setEmail}
                    placeholder='Enter Email'
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                />

                <Text style={Styles.inptext}>PASSWORD</Text>
                <TextInput
                    style={Styles.input}
                    placeholder='Enter Password'
                    secureTextEntry={true}
                    onChangeText={setPassword}
                    value={password}
                />
            </View>

            <View style={{ marginTop: 10 }}>
                <TouchableOpacity 
                    style={[Styles.buttonStyle, (loading || isSigningIn) && { opacity: 0.7 }]} 
                    onPress={onSubmit}
                    disabled={loading || isSigningIn}
                >
                    <Text style={Styles.buttonText}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[Styles.buttonStyle, (loading || isSigningIn) && { opacity: 0.7 }]} 
                    onPress={onGoogleSignIn}
                    disabled={loading || isSigningIn}
                >
                    <Text style={Styles.buttonText}>Sign in with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[Styles.buttonStyle, { backgroundColor: '#5865F2'}]}
                    onPress={() => router.replace("./signUp")}
                    disabled={loading || isSigningIn}
                >
                    <Text style={Styles.buttonText}>Create Account</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const Styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        padding: 15,
        marginTop: 10,
        fontSize: 18,
        borderRadius: 15,
        borderColor: 'grey',
        fontFamily: 'outfit',
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
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'outfit-bold',
    },
});

export default SignIn;