import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#4f46e5',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb', height: 60, paddingBottom: 6 },
      headerShown: false,
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }} />
      <Tabs.Screen name="expenses" options={{ title: 'Expenses', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text> }} />
      <Tabs.Screen name="settings" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
    </Tabs>
  );
}
