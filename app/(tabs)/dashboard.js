import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { api } from '../../lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAT_COLORS = ['#4f46e5','#06b6d4','#f59e0b','#ef4444','#10b981','#8b5cf6','#ec4899','#f97316'];

function fmt(n) { return `₹${(n || 0).toLocaleString()}`; }
function monthStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function monthLabel(d) { return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

export default function Dashboard() {
  const [month, setMonth] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api(`/dashboard?month=${monthStr(month)}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const shift = (dir) => setMonth(p => {
    const d = new Date(p);
    d.setMonth(d.getMonth() + dir);
    return d;
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={fetch_}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View>;
  if (!data) return null;

  const { salary = 0, budget = 0, spent = 0, remaining = 0, categories = [], topExpenses = [], weeklyForecast = [] } = data;
  const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const overBudget = spent > budget;
  const maxCat = Math.max(...categories.map(c => c.amount), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month Picker */}
      <View style={styles.monthPicker}>
        <TouchableOpacity onPress={() => shift(-1)} style={styles.arrow}><Text style={styles.arrowText}>◀</Text></TouchableOpacity>
        <Text style={styles.monthText}>{monthLabel(month)}</Text>
        <TouchableOpacity onPress={() => shift(1)} style={styles.arrow}><Text style={styles.arrowText}>▶</Text></TouchableOpacity>
      </View>

      {/* Budget Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Budget Summary</Text>
        <View style={styles.summaryRow}>
          <SummaryItem label="Salary" value={fmt(salary)} color="#1f2937" />
          <SummaryItem label="Budget" value={fmt(budget)} color="#4f46e5" />
        </View>
        <View style={styles.summaryRow}>
          <SummaryItem label="Spent" value={fmt(spent)} color={overBudget ? '#dc2626' : '#1f2937'} />
          <SummaryItem label="Remaining" value={fmt(remaining)} color={remaining >= 0 ? '#16a34a' : '#dc2626'} />
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: overBudget ? '#dc2626' : '#4f46e5' }]} />
        </View>
        <Text style={[styles.progressLabel, overBudget && { color: '#dc2626' }]}>{Math.round(progress * 100)}% used</Text>
      </View>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category Breakdown</Text>
          {categories.map((c, i) => (
            <View key={c.name} style={styles.catRow}>
              <Text style={styles.catName}>{c.name}</Text>
              <View style={styles.catBarBg}>
                <View style={[styles.catBarFill, { width: `${(c.amount / maxCat) * 100}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
              </View>
              <Text style={styles.catAmount}>{fmt(c.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Top 5 Expenses */}
      {topExpenses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Expenses</Text>
          {topExpenses.slice(0, 5).map((e, i) => (
            <View key={i} style={styles.expenseRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseName}>{e.description || e.category}</Text>
                <Text style={styles.expenseDate}>{e.date}</Text>
              </View>
              <Text style={styles.expenseAmount}>{fmt(e.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weekly Forecast */}
      {weeklyForecast.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weeklyForecast.map((w, i) => (
              <View key={i} style={styles.forecastCard}>
                <Text style={styles.forecastWeek}>{w.label || `Week ${i + 1}`}</Text>
                <Text style={styles.forecastAmount}>{fmt(w.predicted)}</Text>
                {w.actual != null && <Text style={styles.forecastActual}>Actual: {fmt(w.actual)}</Text>}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

function SummaryItem({ label, value, color }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  errorText: { color: '#dc2626', fontSize: 16, marginBottom: 12 },
  retry: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },

  monthPicker: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  arrow: { padding: 12 },
  arrowText: { fontSize: 18, color: '#4f46e5' },
  monthText: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginHorizontal: 16 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: '700' },

  progressBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, textAlign: 'right' },

  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catName: { width: 80, fontSize: 13, color: '#374151' },
  catBarBg: { flex: 1, height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, marginHorizontal: 8, overflow: 'hidden' },
  catBarFill: { height: 12, borderRadius: 6 },
  catAmount: { width: 70, fontSize: 13, color: '#374151', textAlign: 'right' },

  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  expenseName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  expenseDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: '#4f46e5' },

  forecastCard: { backgroundColor: '#eef2ff', borderRadius: 10, padding: 14, marginRight: 10, minWidth: 120, alignItems: 'center' },
  forecastWeek: { fontSize: 13, fontWeight: '600', color: '#4f46e5', marginBottom: 4 },
  forecastAmount: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  forecastActual: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
