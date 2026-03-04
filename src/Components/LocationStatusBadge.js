/**
 * LocationStatusBadge.js
 *
 * A compact status indicator shown in the AllocatedAccountsScreen header.
 * Shows:
 *  - 🟢 Active pulse  — tracking is running
 *  - 🟡 Partial       — foreground only (no background permission)
 *  - 🔴 Off           — not tracking (permission denied)
 *  - 🕐 Pending count — number of pings awaiting upload
 *
 * Tapping it opens a small info modal explaining tracking status.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { TRACKING_STATUS } from '../services/useLocationTracking';

// ── Pulse animation for "active" indicator ─────────────────────────────────
const PulseDot = ({ color }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.8, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={p.container}>
      <Animated.View style={[p.ring, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[p.dot, { backgroundColor: color }]} />
    </View>
  );
};

const p = StyleSheet.create({
  container: { width: 14, height: 14, justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ── Main badge ─────────────────────────────────────────────────────────────
const LocationStatusBadge = ({
  trackingStatus,
  pendingCount = 0,
  lastPingTime = null,
  onManualPing,
  backgroundPermission,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const isActive = trackingStatus === TRACKING_STATUS.ACTIVE;
  const isPartial = trackingStatus === TRACKING_STATUS.PERMISSION_PARTIAL;
  const isDenied = trackingStatus === TRACKING_STATUS.PERMISSION_DENIED;
  const isLoading = trackingStatus === TRACKING_STATUS.REQUESTING_PERMISSION ||
                    trackingStatus === TRACKING_STATUS.STOPPING;

  const dotColor = isActive ? '#4CAF50' : isPartial ? '#FFC107' : isDenied ? '#F44336' : '#9E9E9E';

  const statusLabel = isActive
    ? 'Location Active'
    : isPartial
    ? 'Foreground Only'
    : isDenied
    ? 'Location Off'
    : isLoading
    ? 'Starting…'
    : 'Inactive';

  const formatTime = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <TouchableOpacity
        style={[
          badge.wrap,
          isActive && badge.wrapActive,
          isDenied && badge.wrapDenied,
          isPartial && badge.wrapPartial,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        {isActive ? (
          <PulseDot color={dotColor} />
        ) : (
          <View style={[badge.staticDot, { backgroundColor: dotColor }]} />
        )}
        <Text style={[badge.label, { color: dotColor }]}>{statusLabel}</Text>
        {pendingCount > 0 && (
          <View style={badge.pending}>
            <Text style={badge.pendingText}>{pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Info Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={m.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity style={m.card} activeOpacity={1} onPress={() => {}}>
            {/* Header */}
            <View style={m.header}>
              <View style={[m.iconWrap, { backgroundColor: dotColor + '22' }]}>
                <Text style={{ fontSize: 20 }}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={m.title}>Location Tracking</Text>
                <Text style={[m.subtitle, { color: dotColor }]}>{statusLabel}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={m.closeBtn}>
                <Text style={{ color: '#999', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Status rows */}
            <View style={m.rows}>
              <StatusRow icon="🕐" label="Last Ping" value={formatTime(lastPingTime)} />
              <StatusRow icon="📡" label="Mode" value={backgroundPermission ? 'Background (Always)' : 'Foreground Only'} />
              <StatusRow icon="⏱️" label="Interval" value="Every 15 minutes" />
              <StatusRow
                icon="📦"
                label="Pending Upload"
                value={pendingCount > 0 ? `${pendingCount} ping(s) queued` : 'All synced ✓'}
                highlight={pendingCount > 0}
              />
            </View>

            {/* Info note */}
            <View style={m.note}>
              <Text style={m.noteText}>
                📌 Your location is recorded every 15 minutes to verify field visit activity. 
                Data is used only for attendance and reimbursement verification.
              </Text>
            </View>

            {/* Actions */}
            <View style={m.actions}>
              {!backgroundPermission && (
                <TouchableOpacity
                  style={[m.btn, m.btnPrimary]}
                  onPress={() => { setModalVisible(false); Linking.openSettings(); }}
                >
                  <Text style={m.btnPrimaryText}>⚙️ Enable Background Location</Text>
                </TouchableOpacity>
              )}
              {onManualPing && isActive && (
                <TouchableOpacity
                  style={[m.btn, m.btnSecondary]}
                  onPress={() => { setModalVisible(false); onManualPing(); }}
                >
                  <Text style={m.btnSecondaryText}>📤 Send Location Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const StatusRow = ({ icon, label, value, highlight = false }) => (
  <View style={m.row}>
    <Text style={m.rowIcon}>{icon}</Text>
    <Text style={m.rowLabel}>{label}</Text>
    <Text style={[m.rowValue, highlight && m.rowValueHighlight]}>{value}</Text>
  </View>
);

const badge = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  wrapActive: { borderColor: 'rgba(76,175,80,0.4)', backgroundColor: 'rgba(76,175,80,0.15)' },
  wrapDenied: { borderColor: 'rgba(244,67,54,0.4)', backgroundColor: 'rgba(244,67,54,0.15)' },
  wrapPartial: { borderColor: 'rgba(255,193,7,0.4)', backgroundColor: 'rgba(255,193,7,0.15)' },
  staticDot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  pending: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FF5722',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 2,
  },
  pendingText: { fontSize: 9, color: '#fff', fontWeight: '800' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 340, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  rows: { paddingHorizontal: 18, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  rowIcon: { fontSize: 14, width: 22 },
  rowLabel: { fontSize: 12, color: '#888', fontWeight: '500', flex: 1 },
  rowValue: { fontSize: 12, color: '#333', fontWeight: '600', textAlign: 'right' },
  rowValueHighlight: { color: '#FF5722' },
  note: { margin: 14, marginTop: 6, backgroundColor: '#F3F7FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#DDEEFF' },
  noteText: { fontSize: 11, color: '#4a6080', lineHeight: 17 },
  actions: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  btn: { height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnPrimary: { backgroundColor: '#1565C0' },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnSecondary: { backgroundColor: '#f0f4ff', borderWidth: 1, borderColor: '#BBDEFB' },
  btnSecondaryText: { color: '#1565C0', fontSize: 13, fontWeight: '700' },
});

export default LocationStatusBadge;
