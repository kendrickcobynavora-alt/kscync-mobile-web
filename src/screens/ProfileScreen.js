import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ProfileScreen({ navigation, route }) {
  const { userName = 'Guest User', userPhone = '+63 917 123 4567' } = route.params || {};

  const [currentName, setCurrentName] = useState(userName);
  const [editableName, setEditableName] = useState(userName);
  const [editablePhone, setEditablePhone] = useState(userPhone);
  const [mobileTab, setMobileTab] = useState('profile');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [expandedSection, setExpandedSection] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  const initials = currentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  useEffect(() => {
    const loadPhoto = async () => {
      try {
        const savedUri = await AsyncStorage.getItem(`profile_photo_${currentName}`);
        if (savedUri) setPhotoUri(savedUri);
      } catch (e) {}
    };
    loadPhoto();
  }, [currentName]);

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileSuccess('');

    if (!editableName.trim() || !editablePhone.trim()) {
      setProfileError('Username and Mobile Number cannot be empty.');
      return;
    }

    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_name: currentName,
          full_name: editableName.trim(),
          phone_number: editablePhone.trim()
        })
      });
      const data = await response.json();

      if (response.ok) {
        if (photoUri && data.user.name !== currentName) {
          await AsyncStorage.setItem(`profile_photo_${data.user.name}`, photoUri);
        }
        setCurrentName(data.user.name);
        setEditablePhone(data.user.phone);
        setProfileSuccess('Profile updated successfully.');
      } else {
        setProfileError(data.error || 'Could not update profile.');
      }
    } catch (error) {
      setProfileError('Network error connecting to the database.');
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setProfileError('Gallery permission is required to choose a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        await AsyncStorage.setItem(`profile_photo_${currentName}`, uri);
        setProfileError('');
      }
    } catch (e) {
      setProfileError('Could not open gallery.');
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const navTabs = [
    { label: 'Home', key: 'home', icon: 'home-outline', activeIcon: 'home' },
    { label: 'Schedule', key: 'schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
    { label: 'Track', key: 'track', icon: 'location-outline', activeIcon: 'location' },
    { label: 'Transactions', key: 'transactions', icon: 'receipt-outline', activeIcon: 'receipt' },
    { label: 'Profile', key: 'profile', icon: 'person-outline', activeIcon: 'person' }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View
        className="px-5 pb-4 flex-row items-center border-b border-gray-100 bg-white shadow-sm z-10 justify-center"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 12 }}
      >
        <Text className="text-xl font-bold text-gray-900">My Account & Settings</Text>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 160 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={140}
        extraScrollHeight={140}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6 flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePhotoUpload}
            className="w-16 h-16 rounded-full bg-[#15548a] items-center justify-center shadow-md mr-4 relative overflow-hidden"
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="font-bold text-white text-2xl">{initials}</Text>
            )}
            {!photoUri && (
              <View className="absolute bottom-0 bg-black/45 w-full items-center py-0.5">
                <Text className="text-[8px] text-white font-bold">EDIT</Text>
              </View>
            )}
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-black text-gray-900">{currentName}</Text>
            <Text className="text-xs text-gray-500 mt-1">{editablePhone} • Verified</Text>
          </View>
        </View>

        <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <TouchableOpacity activeOpacity={0.6} onPress={() => toggleSection('Profile')} className="p-5 flex-row justify-between items-center border-b border-gray-50">
            <Text className="font-bold text-gray-700 text-sm">Profile Settings</Text>
            <Ionicons name={expandedSection === 'Profile' ? 'chevron-down' : 'chevron-forward'} size={18} color="#9ca3af" />
          </TouchableOpacity>
          {expandedSection === 'Profile' && (
            <View className="px-5 pb-5 pt-3 bg-gray-50 border-b border-gray-100">
              {profileError ? <Text className="text-red-600 text-xs font-semibold mb-2">{profileError}</Text> : null}
              {profileSuccess ? <Text className="text-green-600 text-xs font-semibold mb-2">{profileSuccess}</Text> : null}
              <Text className="text-xs font-bold text-gray-500 mb-1.5">Username</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 mb-3"
                placeholderTextColor="#6B7280"
                value={editableName}
                onChangeText={(t) => { setEditableName(t); setProfileError(''); setProfileSuccess(''); }}
              />
              <Text className="text-xs font-bold text-gray-500 mb-1.5">Mobile Number</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-800 mb-4"
                placeholderTextColor="#6B7280"
                value={editablePhone}
                onChangeText={(t) => { setEditablePhone(t); setProfileError(''); setProfileSuccess(''); }}
                keyboardType="phone-pad"
              />
              <TouchableOpacity activeOpacity={0.8} onPress={handleSaveProfile} className="bg-[#0f4b81] py-3 rounded-xl items-center shadow-sm">
                <Text className="text-white font-bold text-xs">Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.6} onPress={() => toggleSection('Shift')} className="p-5 flex-row justify-between items-center border-b border-gray-50">
            <Text className="font-bold text-gray-700 text-sm">Shift Worker Wake-Up Preferences</Text>
            <Ionicons name={expandedSection === 'Shift' ? 'chevron-down' : 'chevron-forward'} size={18} color="#9ca3af" />
          </TouchableOpacity>
          {expandedSection === 'Shift' && (
            <View className="px-5 pb-5 pt-3 bg-gray-50 border-b border-gray-100">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-bold text-gray-800">Do Not Disturb Mode</Text>
                  <Text className="text-xs text-gray-500 mt-1">Mute all laundry alerts during day sleep</Text>
                </View>
                <Switch value={dndEnabled} onValueChange={setDndEnabled} trackColor={{ false: '#e5e7eb', true: '#0f4b81' }} />
              </View>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.6} onPress={() => toggleSection('Notifications')} className="p-5 flex-row justify-between items-center border-b border-gray-50">
            <Text className="font-bold text-gray-700 text-sm">Push Notification Preferences</Text>
            <Ionicons name={expandedSection === 'Notifications' ? 'chevron-down' : 'chevron-forward'} size={18} color="#9ca3af" />
          </TouchableOpacity>
          {expandedSection === 'Notifications' && (
            <View className="px-5 pb-5 pt-3 bg-gray-50 border-b border-gray-100">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-sm font-bold text-gray-800">App Status Updates</Text>
                <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#e5e7eb', true: '#0f4b81' }} />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-bold text-gray-800">SMS Text Alerts</Text>
                <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ false: '#e5e7eb', true: '#0f4b81' }} />
              </View>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.6} onPress={() => toggleSection('Help')} className="p-5 flex-row justify-between items-center border-b border-gray-50">
            <Text className="font-bold text-gray-700 text-sm">Help & FAQ</Text>
            <Ionicons name={expandedSection === 'Help' ? 'chevron-down' : 'chevron-forward'} size={18} color="#9ca3af" />
          </TouchableOpacity>
          {expandedSection === 'Help' && (
            <View className="px-5 pb-5 pt-3 bg-gray-50 border-b border-gray-100">
              <Text className="text-sm text-gray-700 leading-5">
                Need help? Visit the local barangay shop counter or contact the KSCync admin directly at <Text className="font-bold text-[#0f4b81]">0917-123-4567</Text>.
              </Text>
            </View>
          )}

          {!confirmLogout ? (
            <TouchableOpacity activeOpacity={0.6} onPress={() => setConfirmLogout(true)} className="p-5 flex-row justify-center items-center bg-red-50/50">
              <Text className="font-bold text-red-600 text-sm">Log Out</Text>
            </TouchableOpacity>
          ) : (
            <View className="p-4 bg-red-50 flex-row justify-between items-center">
              <Text className="text-xs font-bold text-red-700">Confirm log out?</Text>
              <View className="flex-row">
                <TouchableOpacity onPress={() => setConfirmLogout(false)} className="px-3 py-1.5 mr-2 rounded-lg bg-white border border-gray-200">
                  <Text className="text-xs font-semibold text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.replace('Login')} className="px-3 py-1.5 rounded-lg bg-red-600">
                  <Text className="text-xs font-bold text-white">Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-2.5 flex-row justify-between items-center shadow-lg z-30"
        style={{ paddingBottom: Platform.OS === 'android' ? 52 : 28 }}
      >
        {navTabs.map((tab) => {
          const isActive = mobileTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.6}
              onPress={() => {
                setMobileTab(tab.key);
                if (tab.key === 'profile') return;
                if (tab.key === 'home') navigation.navigate('Home', { userName: currentName, userPhone: editablePhone });
                if (tab.key === 'schedule') navigation.navigate('Schedule', { userName: currentName, userPhone: editablePhone });
                if (tab.key === 'track') navigation.navigate('Track', { userName: currentName, userPhone: editablePhone });
                if (tab.key === 'transactions') navigation.navigate('Transactions', { userName: currentName, userPhone: editablePhone });
              }}
              className="items-center flex-1 py-1"
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? '#0f4b81' : '#9ca3af'}
              />
              <Text className={`text-[10px] font-bold mt-1 ${isActive ? 'text-[#0f4b81]' : 'text-gray-400'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}