import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Image,
  Keyboard
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ route, navigation }) {
  const [mobileTab, setMobileTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [photoUri, setPhotoUri] = useState(null);

  const prevStatusesRef = useRef({});
  const handledReviewIdsRef = useRef(new Set());
  const isModalOpenRef = useRef(false);

  const { userName = 'Guest User', userPhone = 'No number provided', successMessage = '' } = route.params || {};
  const [bannerMessage, setBannerMessage] = useState(successMessage);
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  useEffect(() => {
    if (route.params?.successMessage) {
      setBannerMessage(route.params.successMessage);
    }
  }, [route.params?.successMessage]);

  useEffect(() => {
    if (!bannerMessage && !liveNotification) return;
    const timer = setTimeout(() => {
      setBannerMessage('');
      setLiveNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [bannerMessage, liveNotification]);

  const loadProfilePhoto = async () => {
    try {
      const savedUri = await AsyncStorage.getItem(`profile_photo_${userName}`);
      setPhotoUri(savedUri || null);
    } catch (error) {}
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);

        const userOrders = data.orders?.filter(o => o.customer_name === userName) || [];
        userOrders.forEach((order) => {
          const prevStatus = prevStatusesRef.current[order.order_id];
          if (prevStatus && prevStatus !== order.status) {
            setLiveNotification(`Your laundry status updated to: ${order.status.toUpperCase()}`);
          }
          prevStatusesRef.current[order.order_id] = order.status;
        });

        if (!isModalOpenRef.current && !reviewOrder) {
          const storedRaw = await AsyncStorage.getItem(`handled_reviews_${userName}`);
          const storedIds = storedRaw ? JSON.parse(storedRaw) : [];

          const unreviewedPickedUp = userOrders.find(
            o => {
              const st = (o.status || '').trim().toLowerCase();
              return (st === 'picked up' || st === 'completed') &&
                !o.has_review &&
                !handledReviewIdsRef.current.has(o.order_id) &&
                !storedIds.includes(o.order_id);
            }
          );

          if (unreviewedPickedUp) {
            isModalOpenRef.current = true;
            setReviewOrder(unreviewedPickedUp);
          }
        }
      }
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setMobileTab('home');
      loadProfilePhoto();
      fetchDashboard();
    }, [userName])
  );

  useEffect(() => {
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, [userName]);

  const executeDismissal = (orderId) => {
    Keyboard.dismiss();
    if (orderId) handledReviewIdsRef.current.add(orderId);
    isModalOpenRef.current = false;
    setReviewOrder(null);
    setRating(0);
    setFeedback('');
    setBannerMessage('Review submitted. Thank you for your feedback.');
  };

  const handleSubmitReview = () => {
    const orderId = reviewOrder?.order_id;
    const selectedRating = rating === 0 ? 5 : rating;
    const trimmedFeedback = feedback.trim();
    executeDismissal(orderId);

    if (orderId) {
      AsyncStorage.getItem(`handled_reviews_${userName}`)
        .then((storedRaw) => {
          const storedIds = storedRaw ? JSON.parse(storedRaw) : [];
          if (!storedIds.includes(orderId)) {
            AsyncStorage.setItem(`handled_reviews_${userName}`, JSON.stringify([...storedIds, orderId]));
          }
        })
        .catch(() => {});

      fetch('https://kscync-backend.onrender.com/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, customer_name: userName, rating: selectedRating, feedback: trimmedFeedback })
      }).catch(err => console.log('Review error:', err));
    }
  };

  const userOrders = dashboardData?.orders?.filter(o => o.customer_name === userName) || [];
  const latestOrders = userOrders.slice(0, 3);

  const navTabs = [
    { label: 'Home', key: 'home', icon: 'home-outline', activeIcon: 'home' },
    { label: 'Schedule', key: 'schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
    { label: 'Track & History', key: 'track', icon: 'location-outline', activeIcon: 'location' },
    { label: 'Profile', key: 'profile', icon: 'person-outline', activeIcon: 'person' }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Top Header & Compact Announcement Bar */}
      <View
        className="px-5 pb-3 bg-white border-b border-gray-100 shadow-2xs"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 12 }}
      >
        <View className="flex-row justify-between items-center mb-2.5">
          <View>
            <Text className="text-xs text-gray-500 font-medium">Welcome back,</Text>
            <Text className="text-lg font-black text-gray-900">{userName}</Text>
          </View>
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Track', { userName, userPhone })}
              className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 relative"
            >
              <Ionicons name="notifications-outline" size={18} color="#0f4b81" />
              <View className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Profile', { userName, userPhone })}
              className="w-10 h-10 rounded-full bg-[#0f4b81] items-center justify-center shadow-sm overflow-hidden"
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="font-bold text-white text-sm">{initials}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl flex-row items-center shadow-2xs">
          <Ionicons name="megaphone-outline" size={16} color="#d97706" />
          <Text className="text-amber-900 text-[11px] font-bold ml-2.5 flex-1">
            Shop Notice: Open daily 6:00 AM – 6:00 PM (Drop-offs until 10:00 PM).
          </Text>
        </View>
      </View>

      {liveNotification ? (
        <View className="mx-5 mt-2 bg-[#0f4b81] px-4 py-3 rounded-2xl flex-row items-center justify-between shadow-sm">
          <View className="flex-row items-center flex-1 pr-3">
            <Ionicons name="information-circle-outline" size={18} color="#ffffff" />
            <Text className="text-white text-xs font-semibold ml-2.5 flex-1">{liveNotification}</Text>
          </View>
          <TouchableOpacity onPress={() => setLiveNotification(null)}>
            <Ionicons name="close" size={16} color="#bfdbfe" />
          </TouchableOpacity>
        </View>
      ) : null}

      {bannerMessage ? (
        <View className="mx-5 mt-2 bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-3 rounded-2xl flex-row items-center justify-between shadow-sm">
          <View className="flex-row items-center flex-1 pr-3">
            <Ionicons name="checkmark-circle-outline" size={18} color="#15803d" />
            <Text className="text-[#166534] text-xs font-semibold ml-2.5 flex-1">{bannerMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => setBannerMessage('')}>
            <Ionicons name="close" size={16} color="#15803d" />
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
      >
        {/* User Analytics & Total Savings Summary */}
        <View className="bg-white p-4.5 rounded-2xl shadow-xs border border-gray-100 mb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">My Laundry Activity</Text>
            <Text className="text-base font-black text-gray-900 mt-0.5">{userOrders.length} Total Batches</Text>
          </View>
          <View className="bg-green-50 border border-green-200 px-3.5 py-2 rounded-xl items-end shadow-2xs">
            <Text className="text-[10px] font-bold text-green-700 uppercase">Estimated Savings</Text>
            <Text className="text-xs font-extrabold text-green-800">₱150.00 (Promos)</Text>
          </View>
        </View>

        {/* Latest Active & Recent Orders Summary Cards */}
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-xs font-bold text-gray-700">Latest Active &amp; Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Track', { userName, userPhone })}>
            <Text className="text-xs font-bold text-[#0f4b81]">View All History →</Text>
          </TouchableOpacity>
        </View>

        {latestOrders.length > 0 ? (
          latestOrders.map((order, idx) => (
            <TouchableOpacity
              key={order.order_id || idx}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Track', { userName, userPhone })}
              className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 mb-3"
            >
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-xs font-extrabold text-[#0f4b81]">Order #{idx + 1}</Text>
                <Text className="px-2.5 py-0.5 bg-blue-50 text-[#0f4b81] text-[10px] font-bold rounded-full uppercase">
                  {order.status || 'Scheduled'}
                </Text>
              </View>
              <Text className="text-xs text-gray-600">
                Container: <Text className="font-bold text-gray-800">{order.containers?.[0]?.color || 'Standard Bag'}</Text>
              </Text>
              <Text className="text-[11px] text-gray-400 mt-1">Est. Ready: {order.target_completion_time}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View className="bg-white p-7 rounded-2xl border border-gray-100 items-center mb-4 shadow-2xs">
            <Text className="text-xs text-gray-400 font-bold mb-3">No active orders found.</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Schedule', { userName, userPhone })}
              className="bg-[#0f4b81] px-5 py-2.5 rounded-xl shadow-sm"
            >
              <Text className="text-white text-xs font-bold">Schedule Drop-off Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Early Bird Promo Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Schedule', { userName, userPhone, applyPromo: true })}
          className="bg-[#e8f5e9] border border-[#c8e6c9] p-4.5 rounded-2xl flex-row items-center shadow-xs mb-4"
        >
          <View className="bg-[#4caf50] w-10 h-10 rounded-full items-center justify-center mr-3.5 shadow-sm">
            <Ionicons name="pricetag-outline" size={18} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-[#2e7d32]">Early Bird Promo Active</Text>
            <Text className="text-[11px] text-[#388e3c] mt-0.5">10% OFF on all drop-offs before 9:00 AM daily. Tap to book!</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewOrder !== null} transparent animationType="fade" onRequestClose={() => setReviewOrder(null)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-3xl p-6 border border-gray-100 shadow-xl">
            <Text className="text-base font-bold text-gray-900 text-center">Rate Your Laundry Service</Text>
            <Text className="text-xs text-gray-500 text-center mt-1 mb-5">Your order was picked up. How was your experience?</Text>

            <View className="flex-row justify-center items-center mb-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = star <= rating;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    className={`w-11 h-11 mx-1 rounded-xl border items-center justify-center ${isSelected ? 'bg-blue-50 border-[#0f4b81]' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <Ionicons name={isSelected ? 'star' : 'star-outline'} size={20} color={isSelected ? '#0f4b81' : '#9ca3af'} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 text-xs mb-4"
              placeholder="Optional written feedback..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
              value={feedback}
              onChangeText={setFeedback}
            />

            <TouchableOpacity onPress={handleSubmitReview} className="py-3.5 rounded-xl items-center mb-2 bg-[#0f4b81]">
              <Text className="text-white font-bold text-sm">Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
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
                if (tab.key === 'home') return;
                if (tab.key === 'profile') navigation.navigate('Profile', { userName, userPhone });
                if (tab.key === 'schedule') navigation.navigate('Schedule', { userName, userPhone });
                if (tab.key === 'track') navigation.navigate('Track', { userName, userPhone });
              }}
              className="items-center flex-1 py-1"
            >
              <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={isActive ? '#0f4b81' : '#9ca3af'} />
              <Text className={`text-[10px] font-bold mt-1 ${isActive ? 'text-[#0f4b81]' : 'text-gray-400'}`}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}