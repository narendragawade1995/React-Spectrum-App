/**
 * DispositionDetailScreen.js
 *
 * Displays full details for a single disposition record.
 * Data is pre-mapped by DispositionHistoryScreen.buildDetailData()
 * which mirrors Angular's opendialog() transformation exactly.
 *
 * Usage (from navigator):
 *   navigation.navigate('DispositionDetail', { detailData })
 */

import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Dimensions,Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SW } = Dimensions.get('window');

// ── Helpers ───────────────────────────────────────────────────────────────────
const getDispStyle = (disp) => {
  const s = (disp || '').toLowerCase();
  if (s.includes('promise') || s.includes('ptp'))
    return { bar: '#1565C0', bg: '#E3F2FD', col: '#1565C0' };
  if (s.includes('call back') || s.includes('callback'))
    return { bar: '#E65100', bg: '#FFF3E0', col: '#E65100' };
  if (s.includes('welcome'))
    return { bar: '#2E7D32', bg: '#E8F5E9', col: '#2E7D32' };
  if (s.includes('not willing') || s.includes('not contactable'))
    return { bar: '#AD1457', bg: '#FCE4EC', col: '#AD1457' };
  if (s.includes('willing') || s.includes('discuss'))
    return { bar: '#6A1B9A', bg: '#F3E5F5', col: '#6A1B9A' };
  return { bar: '#546E7A', bg: '#ECEFF1', col: '#546E7A' };
};

// ── Detail row component ──────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value, highlight = false, mono = false }) => {
  if (!value && value !== 0) return null;
  return (
    <View style={dd.row}>
      <View style={dd.rowLeft}>
        <View style={[dd.rowIconWrap, highlight && dd.rowIconWrapBlue]}>
          <Icon name={icon} size={14} color={highlight ? '#1565C0' : '#888'} />
        </View>
        <Text style={dd.rowLabel}>{label}</Text>
      </View>
      <Text style={[dd.rowValue, highlight && dd.rowValueBlue, mono && dd.rowValueMono]}>
        {String(value)}
      </Text>
    </View>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, color = '#1565C0' }) => (
  <View style={[dd.sectionHeader, { borderLeftColor: color }]}>
    <Icon name={icon} size={15} color={color} />
    <Text style={[dd.sectionTitle, { color }]}>{title}</Text>
  </View>
);

// ════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════
const DispositionDetailScreen = ({ navigation, route }) => {
  const detailData = route?.params?.detailData || {};

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const ds = getDispStyle(detailData.disposition);
  const isCall = !!(detailData.call_date || detailData.call_time);

  return (
    <View style={sc.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={sc.header}>
        <View style={sc.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={sc.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={sc.headerTitle}>Disposition Details</Text>
            <Text style={sc.headerSub} numberOfLines={1}>
              {detailData.account_number || '—'}
            </Text>
          </View>
        </View>

        {/* Borrower identity card (mirrors Angular dialog's header) */}
        <View style={sc.identCard}>
          <View style={sc.identAvatar}>
            <Icon name="account" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={sc.identName} numberOfLines={1}>
              {detailData.customer_name || 'Unknown Customer'}
            </Text>
            <Text style={sc.identAcc}>{detailData.account_number || '—'}</Text>
          </View>
          {detailData.disposition ? (
            <View style={[sc.identDispPill, { backgroundColor: ds.bg }]}>
              <View style={[sc.identDispDot, { backgroundColor: ds.col }]} />
              <Text style={[sc.identDispText, { color: ds.col }]}>
                {detailData.disposition}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Scrollable detail body ──────────────────────── */}
      <ScrollView
        contentContainerStyle={sc.body}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Account Information ── */}
        <View style={sc.card}>
          <SectionHeader icon="card-account-details-outline" title="Account Information" />
          <DetailRow icon="identifier" label="Account No." value={detailData.account_number} highlight mono />
          <DetailRow icon="account-outline" label="Customer Name" value={detailData.customer_name} highlight />
          <DetailRow icon="phone-outline" label="Virtual Number" value={detailData.virtual_number} />
          <DetailRow icon="bank-outline" label="Selling Bank" value={detailData.selling_bank} />
          <DetailRow icon="shield-key-outline" label="Trust Name" value={detailData.trust_name} />
        </View>

        {/* ── Disposition Info ── */}
        <View style={sc.card}>
          <SectionHeader icon="clipboard-text-outline" title="Disposition Info" color={ds.col} />
          <DetailRow icon="clipboard-edit-outline" label="Disposition" value={detailData.disposition} highlight />
          <DetailRow icon="comment-text-outline" label="Sub Disposition" value={detailData.sub_disposition} />
          <DetailRow icon="text-long" label="Remarks" value={detailData.remarks} />
          <DetailRow icon="cash-multiple" label="PTP Amount" value={detailData.ptp_amount} />
          <DetailRow icon="calendar-check" label="PTP Date" value={detailData.ptp_date} />
        </View>

        {/* ── Activity / Contact details ── */}
        <View style={sc.card}>
          <SectionHeader
            icon={isCall ? 'phone' : 'map-marker'}
            title={isCall ? 'Call Details' : 'Field Visit Details'}
            color={isCall ? '#1565C0' : '#2E7D32'}
          />
          {isCall ? (
            <>
              <DetailRow icon="calendar-outline" label="Call Date" value={detailData.call_date} />
              <DetailRow icon="clock-outline" label="Call Time" value={detailData.call_time} />
            </>
          ) : (
            <>
              <DetailRow icon="calendar-outline" label="Visit Date" value={detailData.Visit_date} />
              <DetailRow icon="clock-outline" label="Visit Time" value={detailData.Visit_time} />
            </>
          )}
          <DetailRow icon="lightning-bolt-outline" label="Type" value={detailData.type} />
          <DetailRow icon="source-branch" label="Source" value={detailData.source} />
        </View>

        {/* ── Officer Info ── */}
        <View style={sc.card}>
          <SectionHeader icon="account-tie-outline" title="Officer Details" color="#546E7A" />
          <DetailRow icon="account-circle-outline" label="Officer Name" value={detailData.username} />
          <DetailRow icon="badge-account-outline" label="User ID" value={detailData.user_id} />
          <DetailRow icon="office-building-outline" label="Zone" value={detailData.zone} />
          <DetailRow icon="map-marker-radius-outline" label="Branch" value={detailData.branch} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Detail row styles ────────────────────────────────────────────────────────
const dd = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FB',
    gap: 8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rowIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowIconWrapBlue: { backgroundColor: '#E8EEF9' },
  rowLabel: { fontSize: 12, color: '#888', fontWeight: '500', flex: 1 },
  rowValue: { fontSize: 13, color: '#1A1A2E', fontWeight: '600', textAlign: 'right', maxWidth: SW * 0.5 },
  rowValueBlue: { color: '#1565C0' },
  rowValueMono: { fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 6, paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: '#F0F4FF',
    borderLeftWidth: 3, paddingLeft: 10,
    borderRadius: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  identCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  identAvatar: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  identName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  identAcc: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  identDispPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexShrink: 0,
  },
  identDispDot: { width: 5, height: 5, borderRadius: 3 },
  identDispText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  body: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
});

export default DispositionDetailScreen;
