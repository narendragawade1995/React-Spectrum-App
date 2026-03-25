/**
 * FilterPopupNew.js
 *
 * Filter fields:
 *  1. Account Number  — text with API auto-suggest (after 3 chars)
 *  2. Customer Name   — text with API auto-suggest (after 3 chars)
 *  3. Virtual Number  — plain text
 *  4. Trust Name      — dropdown from filterData.first.trustlist
 *  5. Selling Bank    — dropdown from filterData.first.trustlist (unique selling_bank values)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Api from '../../Utilities/apiService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Debounce helper ──────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ─── Derive unique selling banks from trustlist ───────────────────────────────
const getUniqueBanks = (trustlist = []) => {
  const seen = new Set();
  return trustlist
    .map(t => (t.selling_bank || '').trim())
    .filter(bank => bank && !seen.has(bank) && seen.add(bank));
};

// ════════════════════════════════════════════════════════════════════════════
//  DROPDOWN FIELD  (Trust Name / Selling Bank)
// ════════════════════════════════════════════════════════════════════════════
const DropdownField = ({ label, icon, placeholder, value, options, onSelect, onClear }) => {
  const [open, setOpen] = useState(false);
  const hasValue = value && value.trim() !== '';

  return (
    <View style={fp.fieldWrap}>
      <View style={fp.fieldLabelRow}>
        <Icon name={icon} size={14} color={hasValue ? '#1565C0' : '#888'} />
        <Text style={[fp.fieldLabel, hasValue && fp.fieldLabelActive]}>{label}</Text>
        {hasValue && (
          <TouchableOpacity onPress={onClear} style={fp.clearField}>
            <Icon name="close-circle" size={14} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[fp.dropdownTrigger, hasValue && fp.dropdownTriggerActive]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
        <Text style={[fp.dropdownValue, !hasValue && fp.dropdownPlaceholder]} numberOfLines={1}>
          {hasValue ? value : placeholder}
        </Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={hasValue ? '#1565C0' : '#bbb'} />
      </TouchableOpacity>

      {open && (
        <View style={fp.dropdownList}>
          <ScrollView
            style={{ maxHeight: 180 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  fp.dropdownOption,
                  idx < options.length - 1 && fp.dropdownOptionBorder,
                  opt === value && fp.dropdownOptionSelected,
                ]}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <Text style={[fp.dropdownOptionText, opt === value && fp.dropdownOptionTextSelected]}>
                  {opt}
                </Text>
                {opt === value && <Icon name="check" size={14} color="#1565C0" />}
              </TouchableOpacity>
            ))}
            {options.length === 0 && (
              <Text style={fp.dropdownEmpty}>No options available</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  AUTO-SUGGEST FIELD  (Account Number / Customer Name)
// ════════════════════════════════════════════════════════════════════════════
const AutoSuggestField = ({ label, icon, placeholder, value, onChange, onSelect, fetchSuggestions }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const hasValue = value && value.trim() !== '';

  const debouncedFetch = useRef(
    debounce(async (text) => {
      if (text.length < 3) { setSuggestions([]); setShowSugg(false); setLoading(false); return; }
      try {
        setLoading(true);
        const results = await fetchSuggestions(text);
         setSuggestions(results || []);
        setShowSugg((results || []).length > 0);
      } catch (e) {
        console.error('AutoSuggest fetch error:', e);
      } finally {
        setLoading(false);
      }
    }, 400)
  ).current;

  const handleChange = (text) => {
    onChange(text);
    if (text.length >= 3) {
      setLoading(true);
      debouncedFetch(text);
    } else {
      setSuggestions([]);
      setShowSugg(false);
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setSuggestions([]);
    setShowSugg(false);
  };

  return (
    <View style={fp.fieldWrap}>
      <View style={fp.fieldLabelRow}>
        <Icon name={icon} size={14} color={hasValue ? '#1565C0' : '#888'} />
        <Text style={[fp.fieldLabel, hasValue && fp.fieldLabelActive]}>{label}</Text>
        {loading && <ActivityIndicator size={12} color="#1565C0" style={{ marginLeft: 4 }} />}
        {hasValue && !loading && (
          <TouchableOpacity onPress={() => { onChange(''); setSuggestions([]); setShowSugg(false); }} style={fp.clearField}>
            <Icon name="close-circle" size={14} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={[fp.textInput, hasValue && fp.textInputActive]}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        value={value}
        onChangeText={handleChange}
        autoCapitalize="none"
      />
      {showSugg && suggestions.length > 0 && (
        <View style={fp.suggestList}>
          {suggestions.slice(0, 6).map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[fp.suggestItem, idx < Math.min(suggestions.length, 6) - 1 && fp.suggestItemBorder]}
              onPress={() => handleSelect(item)}
            >
              <Icon name="magnify" size={13} color="#aaa" />
              <View style={{ flex: 1 }}>
                <Text style={fp.suggestPrimary} numberOfLines={1}>
                  {item.account_no || item.customer_name || '—'}
                </Text>
                {item.customer_name && item.account_no && (
                  <Text style={fp.suggestSecondary} numberOfLines={1}>{item.customer_name}</Text>
                )}
              </View>
              <Icon name="arrow-top-left" size={13} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  MAIN FILTER POPUP
// ════════════════════════════════════════════════════════════════════════════
const FilterPopup = ({ visible, onClose, onApply, initialFilters = {}, filterData = { first: {} } }) => {
  // filters shape: { account_no, customer_name, virtual_number, trust_name, selling_bank }
  const [filters, setFilters] = useState(initialFilters);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Dropdown option lists derived from filterData
  const trustlist = filterData?.first?.trustlist || [];
  const trustNames = trustlist.map(t => (t.trust_name || '').trim()).filter(Boolean);
  const sellingBanks = getUniqueBanks(trustlist);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      translateY.setValue(SCREEN_HEIGHT);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const closeModal = (callback) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => callback && callback());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.8) closeModal(onClose);
        else Animated.spring(translateY, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }).start();
      },
    })
  ).current;

  const setField = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearField = (key) => setFilters(prev => ({ ...prev, [key]: '' }));

  const handleReset = () => setFilters({});

  const handleApply = () => {
    const active = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v && v.trim() !== '')
    );
    closeModal(() => onApply(active));
  };

  // ── API fetch functions for auto-suggest ──────────────────────────────
  const fetchByAccountNo = async (text) => {
    const res = await Api.sendRequest(
      { accountno: text, from: 'search' },
      'unsecured_allocation/unsecuredSearch'
    );
        console.error('unsecure_allocation/unsecuredSearch', res );

    if (!res.ok) return [];
    const data = await res.json();
    console.error('AutoSuggest results for account_no', text, data);
    return data.ArrayOfResponse || [];
  };
 

  const fetchByCustomerName = async (text) => {
    const res = await Api.sendRequest(
      { customer_name: text, from: 'search' },
      'unsecure_allocation/unsecuredSearch'
    );
        console.error('AutoSuggest results for fetchByCustomerName', text, res);

    if (!res.ok) return [];
    const data = await res.json();
    console.error('AutoSuggest results for fetchByCustomerName', text, data);

    return data.ArrayOfResponse || [];
  };

  const activeCount = Object.values(filters).filter(v => v && v.trim() !== '').length;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => closeModal(onClose)}
      statusBarTranslucent
    >
      <Animated.View style={[fp.overlay, { opacity }]}>
        <TouchableOpacity style={fp.backdrop} activeOpacity={1} onPress={() => closeModal(onClose)} />
        <Animated.View style={[fp.sheet, { transform: [{ translateY }] }]}>

          {/* Drag Handle */}
          <View style={fp.dragArea} {...panResponder.panHandlers}>
            <View style={fp.dragHandle} />
          </View>

          {/* Header */}
          <View style={fp.header}>
            <View style={fp.headerLeft}>
              <View style={fp.headerIconWrap}>
                <Icon name="filter-variant" size={18} color="#fff" />
              </View>
              <View>
                <Text style={fp.headerTitle}>Filters</Text>
                {activeCount > 0 && (
                  <Text style={fp.headerSub}>{activeCount} filter{activeCount > 1 ? 's' : ''} active</Text>
                )}
              </View>
            </View>
            <View style={fp.headerRight}>
              {activeCount > 0 && (
                <TouchableOpacity style={fp.resetBtn} onPress={handleReset}>
                  <Icon name="refresh" size={14} color="#F44336" />
                  <Text style={fp.resetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={fp.closeBtn} onPress={() => closeModal(onClose)}>
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Fields */}
          <ScrollView
            style={fp.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
          >
            <View style={fp.fieldsContainer}>

              {/* 1. Account Number — auto-suggest */}
              <AutoSuggestField
                label="Account Number"
                icon="card-account-details-outline"
                placeholder="Type 3+ chars to search..."
                value={filters.account_no || ''}
                onChange={(text) => setField('account_no', text)}
                onSelect={(item) => setField('accountno', item.account_no || '')}
                fetchSuggestions={fetchByAccountNo}
              />

              {/* 2. Customer Name — auto-suggest */}
              <AutoSuggestField
                label="Customer Name"
                icon="account-outline"
                placeholder="Type 3+ chars to search..."
                value={filters.customer_name || ''}
                onChange={(text) => setField('customername', text)}
                onSelect={(item) => setField('customer_name', item.customer_name || '')}
                fetchSuggestions={fetchByCustomerName}
              />

              {/* 3. Virtual Number — plain text */}
              <View style={fp.fieldWrap}>
                <View style={fp.fieldLabelRow}>
                  <Icon name="phone-outline" size={14} color={filters.virtual_number ? '#1565C0' : '#888'} />
                  <Text style={[fp.fieldLabel, filters.virtual_number && fp.fieldLabelActive]}>Virtual Number</Text>
                  {filters.virtual_number ? (
                    <TouchableOpacity onPress={() => clearField('virtual_number')} style={fp.clearField}>
                      <Icon name="close-circle" size={14} color="#aaa" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TextInput
                  style={[fp.textInput, filters.virtual_number && fp.textInputActive]}
                  placeholder="Enter virtual number..."
                  placeholderTextColor="#bbb"
                  value={filters.virtual_number || ''}
                  onChangeText={(text) => setField('virtual_number', text)}
                  keyboardType="numeric"
                />
              </View>

              {/* 4. Trust Name — dropdown */}
              <DropdownField
                label="Trust Name"
                icon="shield-key-outline"
                placeholder="Select trust..."
                value={filters.trust_name || ''}
                options={trustNames}
                onSelect={(val) => setField('trust_name', val)}
                onClear={() => clearField('trust_name')}
              />

              {/* 5. Selling Bank — dropdown */}
              <DropdownField
                label="Selling Bank"
                icon="bank-outline"
                placeholder="Select bank..."
                value={filters.selling_bank || ''}
                options={sellingBanks}
                onSelect={(val) => setField('selling_bank', val)}
                onClear={() => clearField('selling_bank')}
              />

            </View>
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={fp.footer}>
            <TouchableOpacity style={fp.cancelBtn} onPress={() => closeModal(onClose)}>
              <Text style={fp.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[fp.applyBtn, activeCount === 0 && fp.applyBtnDisabled]}
              onPress={handleApply}
            >
              <Icon name="check" size={16} color="#fff" />
              <Text style={fp.applyText}>Apply{activeCount > 0 ? ` (${activeCount})` : ''}</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const fp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.92,
    minHeight: SCREEN_HEIGHT * 0.55,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  dragArea: { paddingVertical: 12, alignItems: 'center' },
  dragHandle: { width: 38, height: 4, backgroundColor: '#ddd', borderRadius: 2 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: '#1565C0', marginTop: 1, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#FFCDD2' },
  resetText: { fontSize: 12, color: '#F44336', fontWeight: '600' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },

  // Scroll / fields
  scroll: { flex: 1 },
  fieldsContainer: { paddingHorizontal: 20, paddingTop: 16 },
  fieldWrap: { marginBottom: 18 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  fieldLabel: { fontSize: 13, color: '#888', fontWeight: '500', flex: 1 },
  fieldLabelActive: { color: '#1565C0' },
  clearField: { padding: 2 },

  // Text input
  textInput: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },
  textInputActive: { borderColor: '#1565C0', backgroundColor: '#F0F4FF' },

  // Auto-suggest list
  suggestList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E8EEF9',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  suggestItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14 },
  suggestItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestPrimary: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  suggestSecondary: { fontSize: 11, color: '#888', marginTop: 1 },

  // Dropdown
  dropdownTrigger: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerActive: { borderColor: '#1565C0', backgroundColor: '#F0F4FF' },
  dropdownValue: { fontSize: 14, color: '#1A1A2E', flex: 1 },
  dropdownPlaceholder: { color: '#bbb' },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E8EEF9',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 14 },
  dropdownOptionBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dropdownOptionSelected: { backgroundColor: '#F0F4FF' },
  dropdownOptionText: { fontSize: 13, color: '#333', flex: 1 },
  dropdownOptionTextSelected: { color: '#1565C0', fontWeight: '600' },
  dropdownEmpty: { paddingVertical: 14, paddingHorizontal: 14, fontSize: 13, color: '#aaa', textAlign: 'center' },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#666', fontWeight: '600' },
  applyBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, elevation: 3, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  applyBtnDisabled: { backgroundColor: '#90A4AE', elevation: 0, shadowOpacity: 0 },
  applyText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

export default FilterPopup;
