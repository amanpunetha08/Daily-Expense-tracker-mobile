import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

export default function Settings() {
  const { user, logout } = useAuth();
  const [salary, setSalary] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(false);

  const saveBudget = async () => {
    try {
      await api('/budget', { method: 'POST', body: JSON.stringify({ salary: Number(salary), budget: Number(budget), month: new Date().toISOString().slice(0, 7) }) });
      Alert.alert('Saved', 'Budget updated');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const saveNotifications = async () => {
    try {
      await api('/notification-settings', { method: 'POST', body: JSON.stringify({ phone, whatsapp }) });
      Alert.alert('Saved', 'Notification settings updated');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* User Info */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Profile</Text>
        <Text style={s.label}>Name</Text>
        <Text style={s.value}>{user?.name || '—'}</Text>
        <Text style={s.label}>Email</Text>
        <Text style={s.value}>{user?.email || '—'}</Text>
      </View>

      {/* Budget */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Monthly Budget</Text>
        <Text style={s.label}>Salary</Text>
        <TextInput style={s.input} value={salary} onChangeText={setSalary} keyboardType="numeric" placeholder="Enter salary" placeholderTextColor="#9ca3af" />
        <Text style={s.label}>Budget</Text>
        <TextInput style={s.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="Enter budget" placeholderTextColor="#9ca3af" />
        <TouchableOpacity style={s.btn} onPress={saveBudget}>
          <Text style={s.btnText}>Save Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Notifications</Text>
        <Text style={s.label}>Phone Number</Text>
        <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1 234 567 8900" placeholderTextColor="#9ca3af" />
        <View style={s.row}>
          <Text style={s.label}>WhatsApp Notifications</Text>
          <Switch value={whatsapp} onValueChange={setWhatsapp} trackColor={{ true: '#4f46e5' }} thumbColor="#fff" />
        </View>
        <TouchableOpacity style={s.btn} onPress={saveNotifications}>
          <Text style={s.btnText}>Save Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 4, marginTop: 8 },
  value: { fontSize: 16, color: '#1f2937', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#1f2937', backgroundColor: '#f9fafb', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  btn: { backgroundColor: '#4f46e5', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: { borderWidth: 1, borderColor: '#dc2626', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
});
