import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('ksc_logged_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          navigation.replace('Home', { userName: user.name, userPhone: user.phone });
        }
      } catch (e) {}
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      hasError = true;
    }
    if (hasError) return;

    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json();
      if (response.ok) {
        const userData = {
          name: data.user.name,
          phone: data.user.phone || '+63 900 000 0000'
        };
        await AsyncStorage.setItem('ksc_logged_user', JSON.stringify(userData));
        navigation.replace('Home', userData);
      } else {
        setErrorMessage(data.error || 'Invalid email or password.');
      }
    } catch (error) {
      setErrorMessage('Network error connecting to the server. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 140 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={140}
        extraScrollHeight={140}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-6">
          <Image
            source={require('../../assets/welcome-bg.jpg')}
            className="w-20 h-20 rounded-2xl shadow-md mb-3 border border-gray-100"
            resizeMode="cover"
          />
          <Text className="text-2xl font-black text-gray-900 mb-1">Welcome to KSCync</Text>
          <Text className="text-gray-500 text-xs font-medium">Barangay Laundry Queueing System</Text>
        </View>

        <View className="w-full bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
          {errorMessage ? (
            <View className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3.5 py-3 mb-4 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={17} color="#dc2626" />
              <Text className="text-[#991b1b] text-xs font-semibold ml-2 flex-1">{errorMessage}</Text>
            </View>
          ) : null}

          <Text className="text-xs font-bold text-gray-700 mb-1.5">Email Address</Text>
          {emailError ? <Text className="text-red-600 text-xs mb-1.5">{emailError}</Text> : null}
          <TextInput
            className={`bg-gray-50 border rounded-xl px-4 py-3.5 mb-4 text-gray-900 text-xs ${emailError ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="e.g. kendrick@gmail.com"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
              setErrorMessage('');
            }}
          />

          <Text className="text-xs font-bold text-gray-700 mb-1.5">Password</Text>
          {passwordError ? <Text className="text-red-600 text-xs mb-1.5">{passwordError}</Text> : null}
          <TextInput
            className={`bg-gray-50 border rounded-xl px-4 py-3.5 mb-6 text-gray-900 text-xs ${passwordError ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="Enter your password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
              setErrorMessage('');
            }}
          />

          <TouchableOpacity onPress={handleLogin} className="bg-[#0f4b81] py-4 rounded-xl items-center shadow-md">
            <Text className="text-white font-bold text-sm">Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('Register')} className="mt-5 items-center">
            <Text className="text-gray-500 text-xs">
              Don't have an account? <Text className="font-bold text-[#0f4b81]">Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}