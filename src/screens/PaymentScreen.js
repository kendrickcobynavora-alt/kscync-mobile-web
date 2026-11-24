import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentScreen({ navigation, route }) {
  const { userName = 'Guest User', userPhone = '' } = route.params || {};
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoApplied, setPromoApplied] = useState(false);
  const [payNowToggle, setPayNowToggle] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchActiveOrder = async () => {
    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/dashboard');
      const data = await response.json();
      if (response.ok) {
        const current = data.orders.find(
          o => o.customer_name === userName && o.status !== 'Completed' && o.status !== 'Picked Up'
        );
        setActiveOrder(current || null);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveOrder();
    }, [userName])
  );

  const calculateBasePrice = (weight) => {
    const numWeight = parseFloat(weight || 0);
    if (numWeight <= 0) return 0;
    if (numWeight <= 2) return 150.00;
    if (numWeight <= 4) return 160.00;
    if (numWeight <= 5) return 175.00;
    if (numWeight <= 6) return 180.00;
    if (numWeight <= 8) return 200.00;
    if (numWeight <= 8.5) return 225.00;
    if (numWeight <= 9) return 320.00;
    if (numWeight <= 10) return 340.00;
    if (numWeight <= 12) return 360.00;
    return 360.00 + ((numWeight - 12) * 15);
  };

  const baseTotal = activeOrder ? calculateBasePrice(activeOrder.total_weight_kg) : 0;
  const earlyBirdDiscount = promoApplied ? baseTotal * 0.10 : 0;
  const finalTotal = Math.max(baseTotal - earlyBirdDiscount - voucherDiscount, 0);

  const handleApplyVoucher = () => {
    if (voucherCode.trim().toUpperCase() === 'KSC100') {
      setVoucherDiscount(50.00);
      setStatusMessage('Voucher applied successfully! ₱50.00 off.');
    } else {
      setStatusMessage('Invalid voucher code.');
    }
  };

  const handleConfirmOrderPlacement = async () => {
    if (!activeOrder) return;
    try {
      const statusToSet = payNowToggle ? 'Paid' : 'Unpaid';
      await fetch(`https://kscync-backend.onrender.com/api/orders/${activeOrder.order_id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: statusToSet })
      });
      navigation.navigate('Home', {
        userName,
        userPhone,
        successMessage: payNowToggle ? 'Payment confirmed and order placed!' : 'Order confirmed. Please pay at the shop counter.'
      });
    } catch (e) {
      setStatusMessage('Unable to finalize order right now.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View
        className="px-5 pb-4 flex-row items-center border-b border-gray-100 bg-white shadow-xs z-10"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 12 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Checkout &amp; Payment</Text>
      </View>

      <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 60 }}>
        {statusMessage ? (
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="information-circle" size={18} color="#0f4b81" />
            <Text className="text-[#0f4b81] text-xs font-semibold ml-2 flex-1">{statusMessage}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color="#0f4b81" className="my-10" />
        ) : (
          <View className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 mb-5">
            {activeOrder ? (
              <>
                <Text className="text-xs font-extrabold text-[#0f4b81] mb-3">Order Billing Summary</Text>
                <View className="flex-row justify-between mb-2 text-xs">
                  <Text className="text-gray-500">Laundry Weight</Text>
                  <Text className="font-bold text-gray-900">{activeOrder.total_weight_kg || 0} kg</Text>
                </View>
                <View className="flex-row justify-between mb-2 text-xs">
                  <Text className="text-gray-500">Wash &amp; Dry Total (No Service Fee)</Text>
                  <Text className="font-bold text-gray-900">₱{baseTotal.toFixed(2)}</Text>
                </View>
                {promoApplied && (
                  <View className="flex-row justify-between mb-2 text-xs text-green-600 font-semibold">
                    <Text>Early Bird Promo (10%)</Text>
                    <Text>-₱{earlyBirdDiscount.toFixed(2)}</Text>
                  </View>
                )}
                {voucherDiscount > 0 && (
                  <View className="flex-row justify-between mb-2 text-xs text-green-600 font-semibold">
                    <Text>Voucher Discount</Text>
                    <Text>-₱{voucherDiscount.toFixed(2)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between items-center border-t border-gray-100 pt-3 mt-2">
                  <Text className="font-bold text-gray-900 text-sm">Final Amount</Text>
                  <Text className="font-black text-[#0f4b81] text-lg">₱{finalTotal.toFixed(2)}</Text>
                </View>

                <View className="mt-4 flex-row space-x-2">
                  <TextInput
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                    placeholder="Enter Voucher Code (e.g. KSC100)"
                    placeholderTextColor="#9ca3af"
                    value={voucherCode}
                    onChangeText={setVoucherCode}
                  />
                  <TouchableOpacity
                    onPress={handleApplyVoucher}
                    className="bg-gray-800 px-4 py-2 rounded-xl justify-center"
                  >
                    <Text className="text-white text-xs font-bold">Apply</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text className="text-center text-gray-400 font-bold py-4">No active order to checkout.</Text>
            )}
          </View>
        )}

        <Text className="text-xs font-bold text-gray-700 mb-2">When would you like to settle payment?</Text>
        <View className="flex-row space-x-3 mb-5">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPayNowToggle(true)}
            className={`flex-1 p-4 rounded-2xl border ${payNowToggle ? 'bg-blue-50 border-[#0f4b81]' : 'bg-white border-gray-200'} items-center`}
          >
            <Ionicons name="card-outline" size={20} color={payNowToggle ? '#0f4b81' : '#6b7280'} />
            <Text className={`font-bold text-xs mt-1.5 ${payNowToggle ? 'text-[#0f4b81]' : 'text-gray-700'}`}>Pay Now Online</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPayNowToggle(false)}
            className={`flex-1 p-4 rounded-2xl border ${!payNowToggle ? 'bg-green-50 border-green-600' : 'bg-white border-gray-200'} items-center`}
          >
            <Ionicons name="storefront-outline" size={20} color={!payNowToggle ? '#15803d' : '#6b7280'} />
            <Text className={`font-bold text-xs mt-1.5 ${!payNowToggle ? 'text-green-700' : 'text-gray-700'}`}>Pay in the Shop Later</Text>
          </TouchableOpacity>
        </View>

        {payNowToggle && (
          <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 shadow-xs items-center">
            <Text className="font-bold text-gray-800 mb-3 text-xs">Scan GCash Owner QR to Pay</Text>
            <Image source={require('../../assets/gcash-qr.png')} className="w-32 h-32 rounded-xl mb-3" resizeMode="contain" />
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConfirmOrderPlacement}
          className="bg-[#0f4b81] py-4 rounded-xl items-center shadow-md"
        >
          <Text className="text-white font-bold text-sm">Finalize &amp; Confirm Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}