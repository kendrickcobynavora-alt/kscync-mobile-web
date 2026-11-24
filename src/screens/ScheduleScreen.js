import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ScheduleScreen({ route, navigation }) {
  const { userName = 'Guest User', userPhone = '', applyPromo = false } = route.params || {};

  const [weight, setWeight] = useState('');
  const [containerDescription, setContainerDescription] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(applyPromo ? 'Today, 6:00 AM - 8:00 AM' : '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [targetTime, setTargetTime] = useState('');
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [previousBookings, setPreviousBookings] = useState([]);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (applyPromo) setSelectedSlot('Today, 6:00 AM - 8:00 AM');
  }, [applyPromo]);

  useEffect(() => {
    const fetchPrevious = async () => {
      try {
        const savedSlotsRaw = await AsyncStorage.getItem(`saved_slots_${userName}`);
        const savedSlots = savedSlotsRaw ? JSON.parse(savedSlotsRaw) : {};
        const res = await fetch('https://kscync-backend.onrender.com/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          const mine = (data.orders || []).filter(o => o.customer_name === userName);
          const unique = [];
          const seen = new Set();
          for (const o of mine) {
            const desc = o.containers?.[0]?.color || '';
            const key = `${desc}|${o.target_completion_time}`;
            if (desc && !seen.has(key)) {
              seen.add(key);
              const numWeight = parseFloat(o.total_weight_kg);
              unique.push({
                desc,
                target: o.target_completion_time,
                weight: !isNaN(numWeight) && numWeight > 0 ? String(numWeight) : '',
                slot: savedSlots[key] || 'Today, 6:00 AM - 8:00 AM'
              });
            }
            if (unique.length >= 3) break;
          }
          setPreviousBookings(unique);
        }
      } catch (e) {}
    };
    fetchPrevious();
  }, [userName]);

  const slots = [
    { label: 'Today, 6:00 AM - 8:00 AM', status: 'Loose' },
    { label: 'Today, 8:00 AM - 10:00 AM', status: 'Loose' },
    { label: 'Today, 10:00 AM - 12:00 PM', status: 'Loose' },
    { label: 'Today, 4:00 PM - 6:00 PM', status: 'Tight' },
    { label: 'Tomorrow, 6:00 AM - 8:00 AM', status: 'Loose' }
  ];

  const targetOptions = [
    'Same Day, 4:00 PM - 6:00 PM',
    'Same Day, 6:00 PM - 8:00 PM',
    'Tomorrow, 8:00 AM - 10:00 AM',
    'Tomorrow, 1:00 PM - 3:00 PM'
  ];

  const isEarlyBirdSlot = selectedSlot.includes('6:00 AM - 8:00 AM') || selectedSlot.includes('8:00 AM - 10:00 AM');

  const handleConfirm = async () => {
    const newErrors = {};
    setGeneralError('');

    let weightNum = 0;
    if (weight.trim() !== '') {
      weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum <= 0 || weightNum > 24) {
        newErrors.weight = 'Enter a weight between 1.0 kg and 24.0 kg (or leave blank).';
      }
    }

    if (!selectedSlot) newErrors.selectedSlot = 'Please select an available drop-off slot.';
    if (!targetTime) newErrors.targetTime = 'Please select a target completion time range.';
    if (!containerDescription.trim()) newErrors.containerDescription = 'Please describe your laundry bag/container.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: userName,
          booking_type: 'scheduled',
          total_weight_kg: weightNum,
          target_completion_time: targetTime,
          container1: { color: containerDescription.trim(), material: 'Plastic', brand: 'Unbranded' }
        })
      });

      const data = await response.json();

      if (response.ok) {
        try {
          const savedSlotsRaw = await AsyncStorage.getItem(`saved_slots_${userName}`);
          const savedSlots = savedSlotsRaw ? JSON.parse(savedSlotsRaw) : {};
          savedSlots[`${containerDescription.trim()}|${targetTime}`] = selectedSlot;
          await AsyncStorage.setItem(`saved_slots_${userName}`, JSON.stringify(savedSlots));
        } catch (e) {}

        const promoNote = isEarlyBirdSlot ? ' (Early Bird 10% OFF eligible)' : '';
        navigation.navigate('Home', {
          userName,
          userPhone,
          successMessage: `Schedule confirmed. Batches assigned: ${data.baskets.length}${promoNote}`
        });
      } else {
        setGeneralError(data.error || 'Booking failed. Please try again.');
      }
    } catch (error) {
      setGeneralError('Network error connecting to the database.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View
        className="px-5 pb-4 flex-row items-center border-b border-gray-100 bg-white z-10"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 12 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Schedule Drop-off &amp; Management</Text>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 140 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={140}
        extraScrollHeight={140}
      >
        {generalError ? (
          <View className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3.5 py-3 mb-4 flex-row items-center">
            <Ionicons name="alert-circle-outline" size={17} color="#dc2626" />
            <Text className="text-[#991b1b] text-xs font-semibold ml-2 flex-1">{generalError}</Text>
          </View>
        ) : null}

        <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-blue-800">Booking for:</Text>
            <Text className="font-bold text-blue-900 text-base">{userName}</Text>
          </View>
          <View className="flex-row space-x-1.5">
            <TouchableOpacity onPress={() => alert('Reschedule selected order')} className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg shadow-2xs">
              <Text className="text-[10px] font-bold text-[#0f4b81]">Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Cancel selected order')} className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg shadow-2xs">
              <Text className="text-[10px] font-bold text-rose-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {previousBookings.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-700 mb-2">Quick Fill from Previous Bookings</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {previousBookings.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setContainerDescription(item.desc);
                    if (targetOptions.includes(item.target)) setTargetTime(item.target);
                    setWeight(item.weight || '');
                    if (item.slot) setSelectedSlot(item.slot);
                    setErrors({});
                  }}
                  className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 mr-2.5 shadow-2xs"
                >
                  <Text className="text-xs font-bold text-[#0f4b81]">{item.desc}</Text>
                  <Text className="text-[10px] text-gray-500 mt-0.5">{item.target}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text className="text-xs font-bold text-gray-700 mb-1.5">Estimated Weight (kg) <Text className="text-gray-400 font-normal">(Optional)</Text></Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 text-xs text-gray-900 shadow-2xs"
          placeholder="e.g. 7.5 or 12"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Text className="text-xs font-bold text-gray-700 mb-1.5">Select Available Drop-off Slot</Text>
        <TouchableOpacity
          onPress={() => setDropdownOpen(!dropdownOpen)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 mb-2 shadow-2xs flex-row justify-between items-center"
        >
          <Text className={selectedSlot ? 'text-gray-900 font-semibold text-xs' : 'text-gray-500 text-xs'}>{selectedSlot || 'Pick a drop-off time slot'}</Text>
          <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
        </TouchableOpacity>

        {dropdownOpen && (
          <View className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm">
            {slots.map((slot, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { setSelectedSlot(slot.label); setDropdownOpen(false); }}
                className="p-3.5 border-b border-gray-100 flex-row justify-between items-center"
              >
                <Text className="text-xs text-gray-700 font-medium">{slot.label}</Text>
                <Text className="text-[10px] font-bold text-green-600">{slot.status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text className="text-xs font-bold text-gray-700 mt-2 mb-1.5">Estimated Completion Time</Text>
        <TouchableOpacity
          onPress={() => setTargetDropdownOpen(!targetDropdownOpen)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 mb-2 shadow-2xs flex-row justify-between items-center"
        >
          <Text className={targetTime ? 'text-gray-900 font-semibold text-xs' : 'text-gray-500 text-xs'}>{targetTime || 'Select estimated completion range'}</Text>
          <Ionicons name={targetDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
        </TouchableOpacity>

        {targetDropdownOpen && (
          <View className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm">
            {targetOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { setTargetTime(opt); setTargetDropdownOpen(false); }}
                className="p-3.5 border-b border-gray-100"
              >
                <Text className="text-xs text-gray-700 font-medium">{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text className="text-xs font-bold text-gray-700 mt-2 mb-1.5">Container Description</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 mb-6 text-xs text-gray-900 shadow-2xs"
          placeholder="e.g. Green Puregold Tote Bag"
          placeholderTextColor="#6B7280"
          value={containerDescription}
          onChangeText={setContainerDescription}
        />

        <TouchableOpacity onPress={handleConfirm} className="bg-[#0f4b81] py-4 rounded-xl items-center shadow-md">
          <Text className="text-white font-bold text-sm">Confirm Schedule &amp; Book</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}