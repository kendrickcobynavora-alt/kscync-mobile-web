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

export default function TrackScreen({ route, navigation }) {
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userName } = route.params || {};

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://kscync-backend.onrender.com/api/dashboard');
      const data = await response.json();
      if (response.ok) {
        const filtered = data.orders.filter(o => o.customer_name === userName);
        setUserOrders(filtered);
      }
    } catch (error) {
      console.error('Network Error connecting to PostgreSQL');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [userName]);

  const stages = [
    { key: 'SCHEDULED', label: 'Scheduled', icon: 'calendar-outline' },
    { key: 'RECEIVED AT SHOP', label: 'Received at Shop', icon: 'cube-outline' },
    { key: 'WASHING', label: 'Washing', icon: 'water-outline' },
    { key: 'DRYING', label: 'Drying', icon: 'sunny-outline' },
    { key: 'FOLDING', label: 'Folding', icon: 'layers-outline' },
    { key: 'READY FOR PICK-UP', label: 'Ready for Pick-up', icon: 'checkmark-circle-outline' },
    { key: 'PICKED UP', label: 'Picked Up', icon: 'bag-check-outline' }
  ];

  const normalizeStatus = (status) => {
    if (!status) return 'SCHEDULED';
    const upper = status.toUpperCase().trim();
    if (upper === 'RECEIVED' || upper === 'SCHEDULED') return 'SCHEDULED';
    if (upper === 'RECEIVED AT SHOP') return 'RECEIVED AT SHOP';
    if (upper === 'READY' || upper === 'READY FOR PICK-UP') return 'READY FOR PICK-UP';
    if (upper === 'COMPLETED' || upper === 'PICKED UP') return 'PICKED UP';
    return upper;
  };

  const getDailyOrderNumber = (targetOrder) => {
    const targetDay = new Date(targetOrder.created_at).toDateString();
    const sameDayOrders = userOrders
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
        <Text className="text-xl font-bold text-gray-900">Track Laundry</Text>
      </View>

      <ScrollView
        className="p-5 flex-1"
        contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 80 : 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0f4b81" className="mt-10" />
        ) : userOrders.length > 0 ? (
          userOrders.map((order) => {
            const dailyNum = getDailyOrderNumber(order);
            const dateLabel = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const orderNumberLabel = `Order #${dailyNum} (${dateLabel})`;
            const displayStatus = normalizeStatus(order.status);
            const currentIndex = stages.findIndex(s => s.key === displayStatus);
            const isWeightPending = parseFloat(order.total_weight_kg || 0) <= 0;

            return (
              <View key={order.order_id} className="mb-6">
                <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-3">
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                      <Text className="text-xs font-extrabold text-[#0f4b81]">{orderNumberLabel}</Text>
                    </View>
                    <Text className={`text-xs font-bold uppercase ${displayStatus === 'PICKED UP' ? 'text-green-600' : 'text-[#0f4b81]'}`}>
                      {displayStatus}
                    </Text>
                  </View>

                  <Text className="text-xs font-bold text-gray-700 mb-2">Physical Identification</Text>
                  {order.containers && order.containers.map((basket, index) => {
                    const displayColor = basket.basket_number === 1
                      ? basket.color
                      : `${order.containers[0]?.color} (Batch 2)`;
                    return (
                      <View key={index} className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-2">
                        <Text className="text-sm font-bold text-[#0f4b81]">Batch {basket.basket_number}: {displayColor}</Text>
                        <Text className="text-xs text-blue-700 mt-1">
                          Weight: {isWeightPending ? 'To be weighed at shop' : `${basket.assigned_weight_kg} kg`}
                        </Text>
                      </View>
                    );
                  })}
                  <Text className="text-xs text-gray-500 mt-2">Est. Completion: {order.target_completion_time}</Text>
                </View>

                <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <Text className="text-sm font-bold text-gray-800 mb-5">{orderNumberLabel} — Workflow Progress</Text>
                  {stages.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isActive = index <= currentIndex;
                    return (
                      <View key={stage.key} className="flex-row items-center mb-4 relative">
                        {index !== stages.length - 1 && (
                          <View className={`absolute left-4 top-8 bottom-[-18px] w-0.5 ${isCompleted ? 'bg-[#0f4b81]' : 'bg-gray-200'}`} />
                        )}
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center z-10 border ${
                            isCurrent
                              ? 'bg-[#0f4b81] border-[#0f4b81]'
                              : isCompleted
                              ? 'bg-blue-50 border-[#0f4b81]'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Ionicons
                            name={isCompleted ? 'checkmark' : stage.icon}
                            size={15}
                            color={isCurrent ? '#ffffff' : isCompleted ? '#0f4b81' : '#9ca3af'}
                          />
                        </View>
                        <Text className={`ml-3.5 font-semibold text-sm ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {stage.label}
                        </Text>
                        {isCurrent && (
                          <Text className={`ml-auto text-[10px] px-2.5 py-1 rounded-full font-bold ${stage.key === 'PICKED UP' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-[#0f4b81]'}`}>
                            {stage.key === 'PICKED UP' ? 'DONE' : 'CURRENT'}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        ) : (
          <View className="items-center justify-center mt-20">
            <Text className="text-gray-400 font-bold">No active laundry currently in queue.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}