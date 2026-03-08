/**
 * components/index.js
 * Reusable small UI components used across the Payment Receipt screen.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

// ─── Section Title ────────────────────────────────────────────────────────────
export const SectionTitle = ({label}) => (
  <View style={styles.sectionTitleRow}>
    <View style={styles.sectionBar} />
    <Text style={styles.sectionTitleText}>{label}</Text>
  </View>
);

// ─── Field Label ──────────────────────────────────────────────────────────────
export const FieldLabel = ({text, required}) => (
  <Text style={styles.fieldLabel}>
    {text}
    {required && <Text style={styles.required}> *</Text>}
  </Text>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({status}) => {
  const isOverdue = status === 'Overdue';
  return (
    <View
      style={[
        styles.badge,
        {backgroundColor: isOverdue ? '#fee2e2' : '#dcfce7'},
      ]}>
      <View
        style={[
          styles.dot,
          {backgroundColor: isOverdue ? '#ef4444' : '#16a34a'},
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          {color: isOverdue ? '#dc2626' : '#15803d'},
        ]}>
        {status}
      </Text>
    </View>
  );
};

// ─── Payment For Selector Trigger ─────────────────────────────────────────────
export const PaymentForSelector = ({value, onPress}) => (
  <TouchableOpacity
    style={[
      styles.selectorBox,
      value ? styles.selectorBoxActive : styles.selectorBoxEmpty,
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text
      style={[
        styles.selectorText,
        {
          color: value ? '#001a6e' : '#94a3b8',
          fontWeight: value ? '600' : '400',
        },
      ]}>
      {value || 'Select…'}
    </Text>
    <Text style={styles.chevron}>▾</Text>
  </TouchableOpacity>
);

// ─── API Info Banner ──────────────────────────────────────────────────────────
export const ApiBanner = () => (
  <View style={styles.apiBanner}>
    <Text style={styles.apiBannerText}>
      🔗  Loans auto-loaded from borrower profile — read only
    </Text>
  </View>
);

// ─── Skeleton Loader Row ──────────────────────────────────────────────────────
export const SkeletonRow = () => (
  <View style={styles.skeletonCard}>
    {[100, 150, 80].map((w, i) => (
      <View key={i} style={[styles.skeletonLine, {width: w}]} />
    ))}
  </View>
);

// ─── Fetching Indicator ───────────────────────────────────────────────────────
export const FetchingIndicator = () => (
  <View style={styles.fetchingRow}>
    <ActivityIndicator size="small" color="#001a6e" />
    <Text style={styles.fetchingText}>Fetching loan accounts from API…</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionBar: {
    width: 3,
    height: 16,
    backgroundColor: '#001a6e',
    borderRadius: 2,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#001a6e',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fieldLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  required: {
    color: '#e53e3e',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  selectorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 4,
  },
  selectorBoxActive: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  selectorBoxEmpty: {
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 12,
  },
  chevron: {
    color: '#94a3b8',
    fontSize: 11,
  },
  apiBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  apiBannerText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '500',
  },
  skeletonCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fafbfc',
    gap: 8,
  },
  skeletonLine: {
    height: 11,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  fetchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fetchingText: {
    fontSize: 12,
    color: '#64748b',
  },
});
