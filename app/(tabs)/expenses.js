import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert,
  ActivityIndicator, StyleSheet, ScrollView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, uploadFile } from '../../lib/api';

const CATEGORIES = ['Groceries', 'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
const CATEGORY_COLORS = { Groceries: '#16a34a', Food: '#ea580c', Transport: '#2563eb', Shopping: '#9333ea', Bills: '#dc2626', Health: '#0d9488', Entertainment: '#d946ef', Other: '#6b7280' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Expenses() {
  const [month, setMonth] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [receiptItems, setReceiptItems] = useState(null);
  const [form, setForm] = useState({ productName: '', amount: '', mrp: '', category: '', date: fmtDate(new Date()), quantity: '1', size: '' });
  const [syncing, setSyncing] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/expenses?month=${fmtMonth(month)}`);
      setExpenses(data.expenses || data);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const changeMonth = (dir) => {
    setMonth((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + dir); return d; });
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ productName: '', amount: '', mrp: '', category: '', date: fmtDate(new Date()), quantity: '1', size: '' });
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ productName: item.productName || '', amount: String(item.amount || ''), mrp: String(item.mrp || ''), category: item.category || '', date: item.date?.slice(0, 10) || fmtDate(new Date()), quantity: String(item.quantity || '1'), size: item.size || '' });
    setModalVisible(true);
  };

  const autoCategorize = async (name) => {
    if (!name.trim()) return;
    try {
      const res = await api('/categorize', { method: 'POST', body: JSON.stringify({ productName: name }) });
      if (res.category) setForm((f) => ({ ...f, category: res.category }));
    } catch {}
  };

  const saveExpense = async () => {
    if (!form.productName || !form.amount) return Alert.alert('Required', 'Product name and amount are required');
    try {
      const body = { ...form, amount: parseFloat(form.amount), mrp: form.mrp ? parseFloat(form.mrp) : undefined, quantity: parseInt(form.quantity, 10) || 1 };
      if (editItem) {
        await api(`/expenses/${editItem._id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/expenses', { method: 'POST', body: JSON.stringify(body) });
      }
      setModalVisible(false);
      fetchExpenses();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const deleteExpense = (id) => {
    Alert.alert('Delete', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await api(`/expenses/${id}`, { method: 'DELETE' }); fetchExpenses(); } catch (e) { Alert.alert('Error', e.message); } } },
    ]);
  };

  const syncProvider = async (provider) => {
    setSyncing(provider);
    try {
      const res = await api(`/sync/${provider}`, { method: 'POST' });
      Alert.alert('Synced', `${res.count || 0} items imported from ${provider}`);
      fetchExpenses();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSyncing(null); }
  };

  const pickReceipt = async (useCamera) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission required');

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (result.canceled) return;
    const asset = result.assets[0];
    try {
      const data = await uploadFile(asset.uri, asset.fileName || 'receipt.jpg', asset.mimeType || 'image/jpeg');
      if (data.items?.length) setReceiptItems(data.items);
      else { Alert.alert('Done', 'Receipt uploaded. No items extracted.'); fetchExpenses(); }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const confirmReceiptItems = async () => {
    try {
      await api('/expenses/bulk', { method: 'POST', body: JSON.stringify({ items: receiptItems }) });
      setReceiptItems(null);
      fetchExpenses();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={s.row} onPress={() => openEdit(item)} onLongPress={() => deleteExpense(item._id)} accessibilityRole="button" accessibilityLabel={`${item.productName}, ${item.amount} rupees`}>
      <View style={s.rowLeft}>
        <Text style={s.rowDate}>{item.date?.slice(5, 10)}</Text>
        <View>
          <Text style={s.rowName} numberOfLines={1}>{item.productName}</Text>
          <View style={[s.badge, { backgroundColor: CATEGORY_COLORS[item.category] || '#6b7280' }]}>
            <Text style={s.badgeText}>{item.category || 'Other'}</Text>
          </View>
        </View>
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowAmt}>₹{Number(item.amount).toFixed(2)}</Text>
        <TouchableOpacity onPress={() => deleteExpense(item._id)} hitSlop={8} accessibilityLabel="Delete expense">
          <Text style={s.delBtn}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      {/* Month Picker */}
      <View style={s.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} accessibilityLabel="Previous month"><Text style={s.arrow}>◀</Text></TouchableOpacity>
        <Text style={s.monthText}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} accessibilityLabel="Next month"><Text style={s.arrow}>▶</Text></TouchableOpacity>
      </View>

      {/* Sync Buttons */}
      <View style={s.syncRow}>
        {['swiggy', 'zepto'].map((p) => (
          <TouchableOpacity key={p} style={s.syncBtn} onPress={() => syncProvider(p)} disabled={!!syncing}>
            {syncing === p ? <ActivityIndicator size="small" color="#4f46e5" /> : <Text style={s.syncText}>Sync {p.charAt(0).toUpperCase() + p.slice(1)}</Text>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.syncBtn} onPress={() => Alert.alert('Upload Receipt', 'Choose source', [
          { text: 'Camera', onPress: () => pickReceipt(true) },
          { text: 'Gallery', onPress: () => pickReceipt(false) },
          { text: 'Cancel', style: 'cancel' },
        ])}>
          <Text style={s.syncText}>📷 Receipt</Text>
        </TouchableOpacity>
      </View>

      {/* Expense List */}
      {loading ? <ActivityIndicator style={s.loader} size="large" color="#4f46e5" /> : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={expenses.length === 0 && s.empty}
          ListEmptyComponent={<Text style={s.emptyText}>No expenses this month</Text>}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openAdd} accessibilityRole="button" accessibilityLabel="Add expense">
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>{editItem ? 'Edit Expense' : 'Add Expense'}</Text>

              <TextInput style={s.input} placeholder="Product Name" value={form.productName} onChangeText={(t) => setForm((f) => ({ ...f, productName: t }))} onBlur={() => autoCategorize(form.productName)} placeholderTextColor="#9ca3af" />
              <View style={s.rowInputs}>
                <TextInput style={[s.input, s.half]} placeholder="Amount" value={form.amount} onChangeText={(t) => setForm((f) => ({ ...f, amount: t }))} keyboardType="numeric" placeholderTextColor="#9ca3af" />
                <TextInput style={[s.input, s.half]} placeholder="MRP" value={form.mrp} onChangeText={(t) => setForm((f) => ({ ...f, mrp: t }))} keyboardType="numeric" placeholderTextColor="#9ca3af" />
              </View>

              <Text style={s.label}>Category</Text>
              <View style={s.catRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c} style={[s.catChip, form.category === c && { backgroundColor: CATEGORY_COLORS[c] || '#4f46e5' }]} onPress={() => setForm((f) => ({ ...f, category: c }))}>
                    <Text style={[s.catChipText, form.category === c && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={s.input} placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={(t) => setForm((f) => ({ ...f, date: t }))} placeholderTextColor="#9ca3af" />
              <View style={s.rowInputs}>
                <TextInput style={[s.input, s.half]} placeholder="Quantity" value={form.quantity} onChangeText={(t) => setForm((f) => ({ ...f, quantity: t }))} keyboardType="numeric" placeholderTextColor="#9ca3af" />
                <TextInput style={[s.input, s.half]} placeholder="Size" value={form.size} onChangeText={(t) => setForm((f) => ({ ...f, size: t }))} placeholderTextColor="#9ca3af" />
              </View>

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={saveExpense}><Text style={s.saveBtnText}>Save</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Receipt Confirmation Modal */}
      <Modal visible={!!receiptItems} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Confirm Receipt Items</Text>
            <FlatList
              data={receiptItems}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <View style={s.receiptRow}>
                  <Text style={s.receiptName}>{item.productName}</Text>
                  <Text style={s.receiptAmt}>₹{item.amount}</Text>
                  <TouchableOpacity onPress={() => setReceiptItems((prev) => prev.filter((_, j) => j !== index))} accessibilityLabel="Remove item">
                    <Text style={s.delBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setReceiptItems(null)}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={confirmReceiptItems}><Text style={s.saveBtnText}>Confirm All</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  monthRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  arrow: { fontSize: 18, color: '#4f46e5', paddingHorizontal: 20 },
  monthText: { fontSize: 18, fontWeight: '600', color: '#1f2937', minWidth: 120, textAlign: 'center' },
  syncRow: { flexDirection: 'row', padding: 8, gap: 8 },
  syncBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  syncText: { color: '#4f46e5', fontWeight: '500', fontSize: 13 },
  loader: { marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  rowDate: { color: '#6b7280', fontSize: 12, width: 40 },
  rowName: { fontSize: 15, fontWeight: '500', color: '#1f2937', maxWidth: 180 },
  badge: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowAmt: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  delBtn: { color: '#dc2626', fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, color: '#1f2937', backgroundColor: '#f9fafb' },
  rowInputs: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  catChip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  catChipText: { fontSize: 13, color: '#374151' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 8, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  receiptName: { flex: 1, fontSize: 14, color: '#1f2937' },
  receiptAmt: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginRight: 12 },
});
