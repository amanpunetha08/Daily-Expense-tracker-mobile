import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAT_ICONS = { 'Personal Care': '💄', Household: '🏠', Dairy: '🥛', Vegetables: '🥬', 'Grocery / Spices': '🛒', 'Frozen Food': '🧊', Transport: '🚗', Bills: '📄', Entertainment: '🎬', Health: '💊', Other: '📦' };
const W = Dimensions.get('window').width;

const fmt = n => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const monthStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function Dashboard() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(new Date());
  const [data, setData] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [d, ins] = await Promise.all([
        api(`/dashboard?month=${monthStr(month)}`),
        api(`/insights?month=${monthStr(month)}`).catch(() => null),
      ]);
      setData(d);
      setInsight(ins?.insights?.[0] || null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const shift = dir => setMonth(p => { const d = new Date(p); d.setMonth(d.getMonth() + dir); return d; });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  if (error) return <View style={s.center}><Text style={s.errText}>{error}</Text><TouchableOpacity onPress={load}><Text style={s.retry}>Retry</Text></TouchableOpacity></View>;
  if (!data) return null;

  const { budget: b, totalSpent, totalDiscount, remaining, utilization, categories, top5, weeks } = data;
  const pct = Math.min(utilization || 0, 100);
  const over = totalSpent > b.budget && b.budget > 0;

  return (
    <ScrollView style={s.bg} contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting}, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.subGreeting}>Here's your expense overview</Text>
        </View>
      </View>

      {/* Budget Overview Card */}
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.cardTitle}>Budget Overview</Text>
          <TouchableOpacity style={s.monthPill}>
            <TouchableOpacity onPress={() => shift(-1)}><Text style={s.arrTxt}>◀ </Text></TouchableOpacity>
            <Text style={s.monthTxt}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
            <TouchableOpacity onPress={() => shift(1)}><Text style={s.arrTxt}> ▶</Text></TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Circular progress + spent/remaining */}
        <View style={[s.row, { marginTop: 16, justifyContent: 'space-around' }]}>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.bigNum}>{fmt(totalSpent)}</Text>
            <Text style={s.label}>Spent</Text>
          </View>
          <View style={s.circle}>
            <Text style={[s.circPct, over && { color: '#dc2626' }]}>{Math.round(pct)}%</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[s.bigNum, { color: remaining >= 0 ? '#16a34a' : '#dc2626' }]}>{fmt(remaining)}</Text>
            <Text style={s.label}>Remaining</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progBg}>
          <View style={[s.progFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: over ? '#dc2626' : '#4f46e5' }]} />
        </View>
        <View style={s.row}>
          <Text style={s.progLabel}>of {fmt(b.budget)} budget</Text>
          <Text style={s.progLabel}>{Math.round(pct)}% used</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {[
          { icon: '💰', label: 'Total Budget', val: fmt(b.budget), color: '#4f46e5' },
          { icon: '📈', label: 'Spent Till Now', val: fmt(totalSpent), color: '#f59e0b' },
          { icon: '💵', label: 'Remaining', val: fmt(remaining), color: remaining >= 0 ? '#16a34a' : '#dc2626' },
          { icon: '🏷️', label: 'Discount Saved', val: fmt(totalDiscount), color: '#06b6d4' },
        ].map((s2, i) => (
          <View key={i} style={[s.statCard, i === 0 && { marginLeft: 0 }]}>
            <Text style={{ fontSize: 20 }}>{s2.icon}</Text>
            <Text style={s.statLabel}>{s2.label}</Text>
            <Text style={[s.statVal, { color: s2.color }]}>{s2.val}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Category-wise Spend */}
      {categories.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Category-wise Spend</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((c, i) => (
              <View key={i} style={s.catItem}>
                <View style={s.catIcon}><Text style={{ fontSize: 24 }}>{CAT_ICONS[c.category] || '📦'}</Text></View>
                <Text style={s.catName} numberOfLines={1}>{c.category}</Text>
                <Text style={s.catAmt}>{fmt(c.total)}</Text>
                <Text style={s.catPct}>({c.percent}%)</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* AI Insight */}
      {insight && (
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: '#1f2937', marginBottom: 2 }}>AI Insight ✨</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 18 }}>{insight.text}</Text>
          </View>
        </View>
      )}

      {/* Top 3 Spend Items */}
      {top5.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Top 3 Spend Items</Text>
          {top5.slice(0, 3).map((e, i) => (
            <View key={i} style={s.topRow}>
              <View style={[s.topBadge, { backgroundColor: ['#4f46e5', '#f59e0b', '#ef4444'][i] }]}>
                <Text style={s.topBadgeTxt}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.topName} numberOfLines={1}>{e.product_name}</Text>
                <Text style={s.topCat}>{e.category}</Text>
              </View>
              <Text style={s.topAmt}>{fmt(e.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weekly Spend Forecast */}
      {weeks.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Weekly Spend Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weeks.map((w, i) => {
              const active = w.status === 'in_progress';
              const done = w.status === 'covered';
              return (
                <View key={i} style={[s.weekCard, active && s.weekActive]}>
                  <Text style={[s.weekTitle, active && { color: '#4f46e5' }]}>Week {w.week}</Text>
                  <Text style={s.weekRange}>{w.dateRange}</Text>
                  <Text style={s.weekAmt}>{fmt(w.actual || 0)}</Text>
                  <View style={[s.weekBadge, done ? s.weekDone : active ? s.weekInProg : s.weekUp]}>
                    <Text style={s.weekBadgeTxt}>{done ? '✅ Covered' : active ? '⏳ In Progress' : '📅 Upcoming'}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f5f5ff' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5ff' },
  errText: { color: '#dc2626', fontSize: 16, marginBottom: 12 },
  retry: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  header: { marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1f2937' },
  subGreeting: { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#4f46e5', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },

  monthPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  monthTxt: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  arrTxt: { fontSize: 12, color: '#4f46e5' },

  bigNum: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  circle: { width: 72, height: 72, borderRadius: 36, borderWidth: 5, borderColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  circPct: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },

  progBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progFill: { height: 8, borderRadius: 4 },
  progLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginLeft: 10, width: (W - 52) / 2.5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  statVal: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  catItem: { alignItems: 'center', marginRight: 20, width: 72 },
  catIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#f5f5ff', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
  catAmt: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginTop: 2 },
  catPct: { fontSize: 10, color: '#9ca3af' },

  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  topBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  topBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  topName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  topCat: { fontSize: 12, color: '#4f46e5', marginTop: 1 },
  topAmt: { fontSize: 15, fontWeight: '700', color: '#1f2937' },

  weekCard: { borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginRight: 10, minWidth: 110, alignItems: 'center' },
  weekActive: { borderColor: '#4f46e5', backgroundColor: '#f5f5ff' },
  weekTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  weekRange: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  weekAmt: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginTop: 6 },
  weekBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  weekDone: { backgroundColor: '#dcfce7' },
  weekInProg: { backgroundColor: '#fef3c7' },
  weekUp: { backgroundColor: '#f3f4f6' },
  weekBadgeTxt: { fontSize: 10, fontWeight: '600', color: '#374151' },
});
