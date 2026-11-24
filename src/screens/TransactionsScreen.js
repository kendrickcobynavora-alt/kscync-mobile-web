import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionsScreen({ route, navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { userName } = route.params || {};

  const fetchHistory = async () => {
    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/dashboard');
      const data = await response.json();
      if (response.ok) {
        const userSpecificOrders = data.orders.filter(order => order.customer_name === userName);
        setHistory(userSpecificOrders);
      }
    } catch (error) {
      console.error('Network Error connecting to PostgreSQL');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userName]);

  const calculatePrice = (weight) => {
    const numWeight = parseFloat(weight || 0);
    if (numWeight <= 0) return null;
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

  const getDailyOrderNumber = (targetOrder) => {
    const targetDay = new Date(targetOrder.created_at).toDateString();
    const sameDayOrders = history
      .filter(o => new Date(o.created_at).toDateString() === targetDay)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return sameDayOrders.findIndex(o => o.order_id === targetOrder.order_id) + 1;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View
        className="px-5 pb-4 flex-row items-center border-b border-gray-100 bg-white shadow-sm z-10"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 12 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">History</Text>
      </View>

      <ScrollView
        className="p-5"
        contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 80 : 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0f4b81" className="mt-10" />
        ) : history.length > 0 ? (
          history.map((order) => {
            const dailyNum = getDailyOrderNumber(order);
            const dateObj = new Date(order.created_at);
            const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const rawStatus = order.status?.toUpperCase() || '';
            const syncedStatus = rawStatus === 'RECEIVED' ? 'SCHEDULED' : (rawStatus === 'COMPLETED' ? 'PICKED UP' : rawStatus);
            const price = calculatePrice(order.total_weight_kg);
            const isPaid = order.payment_status === 'Paid';

            return (
              <View key={order.order_id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 shadow-sm flex-row justify-between items-center">
                <View className="flex-1 pr-3">
                  <Text className="font-extrabold text-[#0f4b81] text-xs">Order #{dailyNum}</Text>
                  <Text className="font-bold text-gray-900 mt-0.5">{order.customer_name}'s Laundry</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {dateString} • {price === null ? 'Weight TBD at shop' : `${order.total_weight_kg} kg`}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Text className={`text-[10px] font-bold uppercase mr-2 ${syncedStatus === 'PICKED UP' ? 'text-green-600' : 'text-blue-500'}`}>
                      {syncedStatus}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${isPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Text className={`text-[9px] font-bold uppercase ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="items-end">
                  {price !== null ? (
                    <Text className="font-bold text-green-700 text-base">₱ {price.toFixed(2)}</Text>
                  ) : (
                    <>
                      <Text className="font-bold text-amber-600 text-xs">Pending Weight</Text>
                      <Text className="text-[9px] text-gray-400 mt-0.5 text-right">Price varies on actual weight</Text>
                    </>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View className="items-center justify-center mt-20">
            <Text className="text-gray-400 font-bold">No transaction history found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}