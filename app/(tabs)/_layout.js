import { Text } from 'react-native';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }} />
      <Tabs.Screen name="expenses" options={{ title: 'Expenses', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💰</Text> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }} />
    </Tabs>
  );
}
