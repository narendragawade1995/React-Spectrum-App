/**
 * Paymentindex.js
 * Reusable UI components used across PaymentReceiptScreen and ReceiptListScreen.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  TouchableWithoutFeedback,
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

// ─── Error Text ───────────────────────────────────────────────────────────────
export const ErrorText = ({message}) =>
  message ? <Text style={styles.errorText}>{message}</Text> : null;

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({status}) => {
  const isLive = (status ?? '').toLowerCase() === 'live';
  const isClosed = (status ?? '').toLowerCase() === 'closed';
  let bg = '#fef9c3';
  let dot = '#ca8a04';
  let color = '#92400e';
  if (isLive) {
    bg = '#dcfce7'; dot = '#16a34a'; color = '#15803d';
  } else if (isClosed) {
    bg = '#f1f5f9'; dot = '#64748b'; color = '#475569';
  }
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <View style={[styles.dot, {backgroundColor: dot}]} />
      <Text style={[styles.badgeText, {color}]}>{status}</Text>
    </View>
  );
};

// ─── Receipt Status Badge ─────────────────────────────────────────────────────
export const ReceiptStatusBadge = ({status}) => {
  const statusLower = (status ?? '').toLowerCase();
  let bg = '#fef9c3'; let color = '#92400e'; let dot = '#ca8a04';
  if (statusLower === 'accounted') { bg = '#dcfce7'; dot = '#16a34a'; color = '#15803d'; }
  else if (statusLower === 'rejected') { bg = '#fee2e2'; dot = '#ef4444'; color = '#dc2626'; }
  else if (statusLower === 'hold') { bg = '#fef9c3'; dot = '#ca8a04'; color = '#92400e'; }
  else if (statusLower === 'inprocess') { bg = '#eff6ff'; dot = '#3b82f6'; color = '#1d4ed8'; }
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <View style={[styles.dot, {backgroundColor: dot}]} />
      <Text style={[styles.badgeText, {color}]}>{status || '—'}</Text>
    </View>
  );
};

// ─── Payment For Selector ─────────────────────────────────────────────────────
export const PaymentForSelector = ({value, onPress, error}) => (
  <>
    <TouchableOpacity
      style={[
        styles.selectorBox,
        value ? styles.selectorBoxActive : styles.selectorBoxEmpty,
        error ? styles.selectorBoxError : null,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.selectorText,
          {color: value ? '#001a6e' : '#94a3b8', fontWeight: value ? '600' : '400'},
        ]}>
        {value || 'Select…'}
      </Text>
      <Text style={styles.chevron}>▾</Text>
    </TouchableOpacity>
    {error ? <Text style={styles.errorTextSmall}>{error}</Text> : null}
  </>
);

// ─── API Banner ───────────────────────────────────────────────────────────────
export const ApiBanner = () => (
  <View style={styles.apiBanner}>
    <Text style={styles.apiBannerText}>
      🔗  Loan accounts auto-loaded from borrower profile
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
export const FetchingIndicator = ({label = 'Fetching accounts from API…'}) => (
  <View style={styles.fetchingRow}>
    <ActivityIndicator size="small" color="#001a6e" />
    <Text style={styles.fetchingText}>{label}</Text>
  </View>
);

// ─── Alert Banner ─────────────────────────────────────────────────────────────
export const AlertBanner = ({message}) =>
  message ? (
    <View style={styles.alertBanner}>
      <Text style={styles.alertBannerText}>⚠️  {message}</Text>
    </View>
  ) : null;

// ─── Image Preview Modal ──────────────────────────────────────────────────────
export const ImagePreviewModal = ({visible, imageUri, onClose}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.imageModalOverlay}>
        <TouchableWithoutFeedback>
          <View style={styles.imageModalContent}>
            <TouchableOpacity style={styles.imageModalClose} onPress={onClose}>
              <Text style={styles.imageModalCloseText}>✕</Text>
            </TouchableOpacity>
            {imageUri ? (
              <Image
                source={{uri: imageUri}}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionBar: {width: 3, height: 16, backgroundColor: '#001a6e', borderRadius: 2},
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
  required: {color: '#e53e3e'},
  errorText: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 3,
  },
  errorTextSmall: {
    fontSize: 10,
    color: '#dc2626',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  dot: {width: 5, height: 5, borderRadius: 3},
  badgeText: {fontSize: 10, fontWeight: '700'},
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
  selectorBoxActive: {borderColor: '#bfdbfe', backgroundColor: '#eff6ff'},
  selectorBoxEmpty: {borderColor: '#e2e8f0', backgroundColor: '#fff'},
  selectorBoxError: {borderColor: '#fca5a5', backgroundColor: '#fff1f2'},
  selectorText: {fontSize: 12},
  chevron: {color: '#94a3b8', fontSize: 11},
  apiBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  apiBannerText: {fontSize: 11, color: '#15803d', fontWeight: '500'},
  skeletonCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fafbfc',
    gap: 8,
  },
  skeletonLine: {height: 11, backgroundColor: '#e2e8f0', borderRadius: 6},
  fetchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fetchingText: {fontSize: 12, color: '#64748b'},
  alertBanner: {
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  alertBannerText: {fontSize: 12, color: '#854d0e', fontWeight: '500'},
  // Image Modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  imageModalClose: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  imageModalCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  fullImage: {
    width: '100%',
    height: 400,
  },
});
