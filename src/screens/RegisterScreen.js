import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleRegister = async () => {
    const newErrors = {};
    setGeneralError('');

    if (!name.trim()) newErrors.name = 'Username is required.';
    if (!phone.trim()) newErrors.phone = 'Mobile number is required.';
    if (!email.trim()) newErrors.email = 'Email address is required.';
    if (!password) newErrors.password = 'Password is required.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name.trim(),
          phone_number: phone.trim(),
          email: email.trim().toLowerCase(),
          password
        })
      });
      const data = await response.json();
      if (response.ok) {
        navigation.replace('Home', { userName: name.trim(), userPhone: phone.trim() });
      } else {
        setGeneralError(data.error || 'Registration failed.');
      }
    } catch (error) {
      setGeneralError('Network error connecting to the database.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 140 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={140}
        extraScrollHeight={140}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-6">
          <Text className="text-2xl font-black text-gray-900 mb-1">Create Account</Text>
          <Text className="text-gray-500">Join the KSCync queueing system</Text>
        </View>

        <View className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          {generalError ? (
            <View className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3.5 py-3 mb-4 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={17} color="#dc2626" />
              <Text className="text-[#991b1b] text-xs font-semibold ml-2 flex-1">{generalError}</Text>
            </View>
          ) : null}

          <Text className="text-xs font-bold text-gray-700 mb-1.5">Username</Text>
          {errors.name ? <Text className="text-red-600 text-xs mb-1.5">{errors.name}</Text> : null}
          <TextInput
            className={`bg-gray-50 border rounded-xl px-4 py-3 mb-4 text-gray-900 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="e.g. kendrick_coby"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={(t) => { setName(t); setErrors({ ...errors, name: '' }); }}
          />

          <Text className="text-xs font-bold text-gray-700 mb-1.5">Mobile Number</Text>
          {errors.phone ? <Text className="text-red-600 text-xs mb-1.5">{errors.phone}</Text> : null}
          <TextInput
            className={`bg-gray-50 border rounded-xl px-4 py-3 mb-4 text-gray-900 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="e.g. 0917 123 4567"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => { setPhone(t); setErrors({ ...errors, phone: '' }); }}
          />

          <Text className="text-xs font-bold text-gray-700 mb-1.5">Email Address</Text>
          {errors.email ? <Text className="text-red-600 text-xs mb-1.5">{errors.email}</Text> : null}
          <TextInput
            className={`bg-gray-50 border rounded-xl px-4 py-3 mb-4 text-gray-900 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="e.g. kendrick@gmail.com"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
          />

          <Text className="text-xs font-bold text-gray-700 mb-1.5">Password</Text>
          {errors.password ? <Text className="text-red-600 text-xs mb-1.5">{errors.password}</Text> : null}
          <TextInput
            className={`bg-gray-50 border rounded-xl px-4 py-3 mb-4 text-gray-900 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="Create a secure password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
          />

          <Text className="text-xs font-bold text-gray-700 mb-1.5">Confirm Password</Text>
          {errors.confirmPassword ? <Text className="text-red-600 text-xs mb-1.5">{errors.confirmPassword}</Text> : null}
          <TextInput
            className={`bg-gray-50 border rounded-xl px-4 py-3 mb-6 text-gray-900 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="Re-enter your password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors({ ...errors, confirmPassword: '' }); }}
          />

          <TouchableOpacity onPress={handleRegister} className="bg-[#0f4b81] py-4 rounded-xl items-center shadow-md">
            <Text className="text-white font-bold text-base">Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} className="mt-5 items-center">
            <Text className="text-gray-500">
              Already have an account? <Text className="font-bold text-[#0f4b81]">Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}