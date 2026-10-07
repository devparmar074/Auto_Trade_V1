import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import type { DashboardSummary, TransactionType } from '../types/trading';
import { fetchDashboard, submitLiveOrder } from '../api/tradingApi';

export const TradingScreen: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [pendingType, setPendingType] = useState<TransactionType>('BUY');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const data = await fetchDashboard();
      setDashboard(data);
    } catch { }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderPress = (type: TransactionType) => {
    if (!dashboard?.brokerConnected) {
      Alert.alert('Not Connected', 'Upstox account is not connected. Please connect via web first.');
      return;
    }
    if (quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity of 1 or more.');
      return;
    }
    setPendingType(type);
    setModalVisible(true);
  };

  const confirmLiveOrder = async () => {
    setSubmitting(true);
    try {
      const result = await submitLiveOrder({
        transactionType: pendingType,
        orderType: 'MARKET',
        quantity: quantity,
        product: 'D',
        correlationId: `MOB_${Date.now()}`
      });
      setModalVisible(false);
      Alert.alert('Order Submitted', `Live ${pendingType} order placed! ID: ${result.upstoxOrderId || result.localOrderId}`);
      loadData();
    } catch (err: any) {
      Alert.alert('Order Failed', err.message || 'Error communicating with broker.');
    } finally {
      setSubmitting(false);
    }
  };

  const quote = dashboard?.quote;
  const pos = dashboard?.position;
  const isUp = (quote?.change ?? 0) >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>AUTO TRADE</Text>
          <View style={[styles.badge, { backgroundColor: dashboard?.brokerConnected ? '#065f46' : '#7f1d1d' }]}>
            <Text style={styles.badgeText}>
              Upstox: {dashboard?.brokerConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Stock Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.stockSymbol}>VODAFONE IDEA</Text>
            <View style={styles.marketBadge}>
              <Text style={styles.marketText}>Market: {dashboard?.marketStatus || 'CLOSED'}</Text>
            </View>
          </View>
          <Text style={styles.segmentText}>NSE &bull; NSE_EQ &bull; INE669E01016</Text>

          <View style={styles.grid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LTP</Text>
              <Text style={[styles.statValue, { color: isUp ? '#10b981' : '#ef4444' }]}>
                ₹{quote ? quote.ltp.toFixed(2) : '--.--'}
              </Text>
              <Text style={{ color: isUp ? '#10b981' : '#ef4444', fontSize: 11 }}>
                {quote ? `${isUp ? '+' : ''}${quote.change.toFixed(2)} (${isUp ? '+' : ''}${quote.changePercent.toFixed(2)}%)` : ''}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>POSITION</Text>
              <Text style={styles.statValue}>{pos?.quantity ?? 0}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>Avg: ₹{pos?.averagePrice.toFixed(2) ?? '0.00'}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>P&L</Text>
              <Text style={[styles.statValue, { color: (pos?.totalPnL ?? 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                ₹{pos?.totalPnL.toFixed(2) ?? '0.00'}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>Unreal: ₹{pos?.unrealizedPnL.toFixed(2) ?? '0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Order Controls */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Quantity:</Text>
            <View style={styles.qtyContainer}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                <Text style={styles.stepBtnText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                keyboardType="numeric"
                value={quantity.toString()}
                onChangeText={(t) => setQuantity(Math.max(1, parseInt(t) || 1))}
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity(quantity + 1)}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.buyBtn} onPress={() => handleOrderPress('BUY')}>
              <Text style={styles.btnText}>BUY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sellBtn} onPress={() => handleOrderPress('SELL')}>
              <Text style={styles.btnText}>SELL</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footnote}>Delivery (D) &bull; Validity: DAY &bull; MARKET</Text>
        </View>

        {/* Last Order */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Last Order</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Status: <Text style={styles.whiteBold}>{dashboard?.lastOrder?.statusText || '-'}</Text></Text>
            <Text style={styles.label}>ID: <Text style={styles.whiteBold}>{dashboard?.lastOrder?.upstoxOrderId || (dashboard?.lastOrder?.localOrderId ? `#${dashboard?.lastOrder.localOrderId}` : '-')}</Text></Text>
          </View>
          <View style={{ marginTop: 6 }}>
            <Text style={styles.label}>Price: <Text style={styles.whiteBold}>{dashboard?.lastOrder?.executionPrice ? `₹${dashboard?.lastOrder.executionPrice.toFixed(2)}` : '-'}</Text></Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Live Order</Text>
            <Text style={styles.modalStock}>Vodafone Idea Limited ({pendingType})</Text>
            <Text style={styles.modalQty}>Quantity: {quantity} Share{quantity > 1 ? 's' : ''}</Text>

            <View style={styles.warningAlert}>
              <Text style={styles.warningText}>
                ⚠️ REAL MONEY ORDER: This is a LIVE order and will be sent immediately to your real Upstox account.
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: pendingType === 'BUY' ? '#10b981' : '#ef4444' }]}
                onPress={confirmLiveOrder}
                disabled={submitting}
              >
                <Text style={styles.confirmText}>{submitting ? 'SENDING...' : 'CONFIRM LIVE'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  scroll: { padding: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  appTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockSymbol: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  segmentText: { color: '#64748b', fontSize: 11, marginTop: 2, marginBottom: 12 },
  marketBadge: { backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#475569' },
  marketText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: '#0f172a', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  label: { color: '#94a3b8', fontSize: 14 },
  whiteBold: { color: '#f8fafc', fontWeight: '700' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { backgroundColor: '#334155', width: 36, height: 36, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  qtyInput: { backgroundColor: '#0f172a', color: '#ffffff', width: 60, height: 36, borderRadius: 6, textAlign: 'center', fontWeight: '700', borderWidth: 1, borderColor: '#475569' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  buyBtn: { flex: 1, backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' },
  sellBtn: { flex: 1, backgroundColor: '#ef4444', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  footnote: { color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 20, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  modalStock: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 4 },
  modalQty: { fontSize: 16, fontWeight: '700', color: '#38bdf8', textAlign: 'center', marginBottom: 14 },
  warningAlert: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 8, padding: 10, marginBottom: 16 },
  warningText: { color: '#fca5a5', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelText: { color: '#ffffff', fontWeight: '700' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  confirmText: { color: '#ffffff', fontWeight: '800' }
});
