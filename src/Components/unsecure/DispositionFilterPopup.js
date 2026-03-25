/**
 * DispositionFilterPopup.js
 *
 * Filter fields (mirrors Angular agency-disposition.component.html):
 *
 * Basic filters (always visible):
 *  1. Account Number / Customer Name  — auto-suggest via GET agency/customer?customername=xxx
 *  2. Disposition                     — multi-select from static DISPOSITION_OPTIONS list
 *  3. Trust Name                      — dropdown from dropdownOption.trust_list
 *
 * Extended filters (Show More):
 *  4. Selling Bank  — dropdown from dropdownOption.selling_bank_list
 *  5. Source        — dropdown from dropdownOption.source (bindLabel/Value = "type")
 *  6. Start Date    — date picker (ISO format with +05:30 offset, mirrors Angular dateSelected)
 *  7. End Date      — date picker (disabled until Start Date selected)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, PanResponder, Dimensions, StyleSheet,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Api from '../../Utilities/apiService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Static disposition list (from Angular's disposition constant / disposition_master) ──
const DISPOSITION_OPTIONS = [
  'Call back',
  'Promise to pay',
  'To be contacted',
  'Willing to Discuss',
  'Welcome Call',
  'Not willing to discuss',
  'Not Contactable',
];

// ── Debounce ───────────────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ── Angular dateSelected() mirror: set to 05:30 IST offset, return ISO string ──
const toISOWithIST = (date) => {
  const d = new Date(date);
  d.setHours(5, 30, 0, 0);
  return d.toISOString();
};

const formatDisplayDate = (isoStr) => {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return null; }
};

// ═════════════════════════════════════════════════════════════════════════════
//  SIMPLE DATE PICKER ROW  (native keyboard-friendly)
//  Uses three TextInput fields: DD / MM / YYYY — validates on blur
// =============================================================================
const DateField = ({ label, icon, value, onSelect, onClear, disabled, minDate }) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const hasValue = !!value;

  // Pre-fill from ISO value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setDay(String(d.getDate()).padStart(2, '0'));
      setMonth(String(d.getMonth() + 1).padStart(2, '0'));
      setYear(String(d.getFullYear()));
    } else {
      setDay(''); setMonth(''); setYear('');
    }
  }, [value]);

  const tryCommit = (d, m, y) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const dateObj = new Date(`${y}-${m}-${d}`);
      if (isNaN(dateObj.getTime())) return;
      // Respect maxDate = today
      if (dateObj > new Date()) return;
      // Respect minDate (for EndDate)
      if (minDate && dateObj < new Date(minDate)) return;
      onSelect(toISOWithIST(dateObj));
    }
  };

  const handleClear = () => {
    setDay(''); setMonth(''); setYear('');
    onClear();
  };

  return (
    <View style={fp.fieldWrap}>
      <View style={fp.fieldLabelRow}>
        <Icon name={icon} size={14} color={hasValue ? '#1565C0' : (disabled ? '#ccc' : '#888')} />
        <Text style={[fp.fieldLabel, hasValue && fp.fieldLabelActive, disabled && fp.fieldLabelDisabled]}>
          {label}
        </Text>
        {hasValue && (
          <TouchableOpacity onPress={handleClear} style={fp.clearField}>
            <Icon name="close-circle" size={14} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>
      <View style={[fp.dateRow, disabled && fp.dateRowDisabled, hasValue && fp.dateRowActive]}>
        <TextInput
          style={fp.datePart}
          placeholder="DD"
          placeholderTextColor="#ccc"
          value={day}
          maxLength={2}
          keyboardType="numeric"
          editable={!disabled}
          onChangeText={t => {
            setDay(t);
            if (t.length === 2) monthRef.current?.focus();
            tryCommit(t, month, year);
          }}
        />
        <Text style={fp.dateSep}>/</Text>
        <TextInput
          ref={monthRef}
          style={fp.datePart}
          placeholder="MM"
          placeholderTextColor="#ccc"
          value={month}
          maxLength={2}
          keyboardType="numeric"
          editable={!disabled}
          onChangeText={t => {
            setMonth(t);
            if (t.length === 2) yearRef.current?.focus();
            tryCommit(day, t, year);
          }}
        />
        <Text style={fp.dateSep}>/</Text>
        <TextInput
          ref={yearRef}
          style={[fp.datePart, fp.dateYear]}
          placeholder="YYYY"
          placeholderTextColor="#ccc"
          value={year}
          maxLength={4}
          keyboardType="numeric"
          editable={!disabled}
          onChangeText={t => {
            setYear(t);
            tryCommit(day, month, t);
          }}
        />
        <Icon
          name="calendar-month-outline"
          size={16}
          color={hasValue ? '#1565C0' : (disabled ? '#ccc' : '#bbb')}
          style={{ marginLeft: 6 }}
        />
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  DROPDOWN FIELD  (single select)
// =============================================================================
const DropdownField = ({ label, icon, placeholder, value, options, onSelect, onClear, bindLabel }) => {
  const [open, setOpen] = useState(false);
  const hasValue = !!value;

  return (
    <View style={fp.fieldWrap}>
      <View style={fp.fieldLabelRow}>
        <Icon name={icon} size={14} color={hasValue ? '#1565C0' : '#888'} />
        <Text style={[fp.fieldLabel, hasValue && fp.fieldLabelActive]}>{label}</Text>
        {hasValue && (
          <TouchableOpacity onPress={() => { onClear(); setOpen(false); }} style={fp.clearField}>
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
            style={{ maxHeight: 170 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {(options || []).map((opt, idx, arr) => {
              const label = bindLabel ? opt[bindLabel] : opt;
              const isSelected = label === value;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    fp.dropdownOption,
                    idx < arr.length - 1 && fp.dropdownOptionBorder,
                    isSelected && fp.dropdownOptionSelected,
                  ]}
                  onPress={() => { onSelect(label); setOpen(false); }}
                >
                  <Text style={[fp.dropdownOptionText, isSelected && fp.dropdownOptionTextSelected]}>
                    {label}
                  </Text>
                  {isSelected && <Icon name="check" size={14} color="#1565C0" />}
                </TouchableOpacity>
              );
            })}
            {(!options || options.length === 0) && (
              <Text style={fp.dropdownEmpty}>No options available</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MULTI-SELECT FIELD  (Disposition — can select multiple)
// =============================================================================
const MultiSelectField = ({ label, icon, options, selected = [], onToggle, onClear }) => {
  const [open, setOpen] = useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = selected.length > 0
    ? `${selected.length} selected`
    : null;

  return (
    <View style={fp.fieldWrap}>
      <View style={fp.fieldLabelRow}>
        <Icon name={icon} size={14} color={hasValue ? '#1565C0' : '#888'} />
        <Text style={[fp.fieldLabel, hasValue && fp.fieldLabelActive]}>{label}</Text>
        {hasValue && (
          <TouchableOpacity onPress={() => { onClear(); }} style={fp.clearField}>
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
          {displayLabel || 'Select dispositions...'}
        </Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={hasValue ? '#1565C0' : '#bbb'} />
      </TouchableOpacity>

      {open && (
        <View style={fp.dropdownList}>
          <ScrollView
            style={{ maxHeight: 210 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {options.map((opt, idx) => {
              const isChecked = selected.includes(opt);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    fp.dropdownOption,
                    idx < options.length - 1 && fp.dropdownOptionBorder,
                    isChecked && fp.dropdownOptionSelected,
                  ]}
                  onPress={() => onToggle(opt)}
                >
                  <View style={[fp.checkbox, isChecked && fp.checkboxChecked]}>
                    {isChecked && <Icon name="check" size={10} color="#fff" />}
                  </View>
                  <Text style={[fp.dropdownOptionText, isChecked && fp.dropdownOptionTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* Selected pills */}
          {selected.length > 0 && (
            <View style={fp.selectedPills}>
              {selected.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={fp.selectedPill}
                  onPress={() => onToggle(s)}
                >
                  <Text style={fp.selectedPillText}>{s}</Text>
                  <Icon name="close" size={10} color="#1565C0" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  AUTO-SUGGEST FIELD (Account Number / Customer Name)
// =============================================================================
const AutoSuggestField = ({ label, icon, placeholder, value, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const hasValue = !!value;

  // Mirrors Angular: GET agency/customer?customername=xxx, minTermLength = 3
  const debouncedFetch = useRef(
    debounce(async (text) => {
      if (text.length < 3) {
        setSuggestions([]); setShowSugg(false); setLoading(false); return;
      }
      try {
        setLoading(true);
        const res = await Api.get(`agency/customer?customername=${encodeURIComponent(text)}`);
        // Angular bindLabel/Value = "customername"
        const list = Array.isArray(res) ? res : (res?.data || []);
        setSuggestions(list);
        setShowSugg(list.length > 0);
      } catch (e) {
        console.error('AutoSuggest error:', e);
      } finally {
        setLoading(false);
      }
    }, 800) // matches Angular debounceTime(800)
  ).current;

  const handleChange = (text) => {
    onChange(text);
    if (text.length >= 3) { setLoading(true); debouncedFetch(text); }
    else { setSuggestions([]); setShowSugg(false); setLoading(false); }
  };

  const handleSelect = (item) => {
    // Angular: bindValue = "customername", so pass customername
    onSelect(item.customername || item.account_number || '');
    setSuggestions([]); setShowSugg(false);
  };

  return (
    <View style={fp.fieldWrap}>
      <View style={fp.fieldLabelRow}>
        <Icon name={icon} size={14} color={hasValue ? '#1565C0' : '#888'} />
        <Text style={[fp.fieldLabel, hasValue && fp.fieldLabelActive]}>{label}</Text>
        {loading && <ActivityIndicator size={12} color="#1565C0" style={{ marginLeft: 4 }} />}
        {hasValue && !loading && (
          <TouchableOpacity
            onPress={() => { onChange(''); setSuggestions([]); setShowSugg(false); }}
            style={fp.clearField}
          >
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
              style={[fp.suggestItem, idx < Math.min(6, suggestions.length) - 1 && fp.suggestItemBorder]}
              onPress={() => handleSelect(item)}
            >
              <Icon name="account-search-outline" size={13} color="#aaa" />
              <View style={{ flex: 1 }}>
                <Text style={fp.suggestPrimary} numberOfLines={1}>
                  {item.customername || item.account_number || '—'}
                </Text>
                {item.account_number && item.customername && (
                  <Text style={fp.suggestSecondary}>{item.account_number}</Text>
                )}
              </View>
              <Icon name="arrow-top-left" size={12} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN FILTER POPUP
// =============================================================================
const DispositionFilterPopup = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
  dropdownOption = {},
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [showMore, setShowMore] = useState(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      setShowMore(false);
      translateY.setValue(SCREEN_HEIGHT);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const closeModal = (cb) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => cb && cb());
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

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const clear = (key) => setFilters(prev => { const n = { ...prev }; delete n[key]; return n; });

  // Multi-select toggle for disposition
  const toggleDisposition = (val) => {
    const current = filters.disposition || [];
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val];
    next.length === 0 ? clear('disposition') : set('disposition', next);
  };

  const handleReset = () => {
    setFilters({});
    setShowMore(false);
  };

  const handleApply = () => {
    const active = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== '';
      })
    );
    closeModal(() => onApply(active));
  };

  // Count active filters
  const activeCount = Object.entries(filters).filter(([_, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }).length;

  // Dropdown option lists from Angular's getdropdowndata()
  const trustList = dropdownOption?.trust_list || [];
  const bankList = dropdownOption?.selling_bank_list || [];
  const sourceList = dropdownOption?.source || [];

  if (!visible) return null;

  return (
    <Modal
      transparent visible={visible} animationType="none"
      onRequestClose={() => closeModal(onClose)} statusBarTranslucent
    >
      <Animated.View style={[fp.overlay, { opacity }]}>
        <TouchableOpacity style={fp.backdrop} activeOpacity={1} onPress={() => closeModal(onClose)} />
        <Animated.View style={[fp.sheet, { transform: [{ translateY }] }]}>

          {/* Drag handle */}
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
                  <Text style={fp.headerSub}>
                    {activeCount} filter{activeCount > 1 ? 's' : ''} active
                  </Text>
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

          {/* Filter fields */}
          <ScrollView
            style={fp.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
          >
            <View style={fp.fieldsContainer}>

              {/* ── BASIC FILTERS (always visible) ── */}

              {/* 1. Account Number / Customer Name — auto-suggest */}
              <AutoSuggestField
                label="Account Number / Customer Name"
                icon="account-search-outline"
                placeholder="Type 3+ chars to search..."
                value={filters.customername || ''}
                onChange={(t) => set('customername', t)}
                onSelect={(val) => set('customername', val)}
              />

              {/* 2. Disposition — multi-select */}
              <MultiSelectField
                label="Disposition"
                icon="clipboard-text-outline"
                options={DISPOSITION_OPTIONS}
                selected={filters.disposition || []}
                onToggle={toggleDisposition}
                onClear={() => clear('disposition')}
              />

              {/* 3. Trust Name — dropdown from dropdownOption.trust_list */}
              <DropdownField
                label="Trust Name"
                icon="shield-key-outline"
                placeholder="Select trust..."
                value={filters.trustname || ''}
                options={trustList}
                bindLabel="trust_name"
                onSelect={(val) => set('trustname', val)}
                onClear={() => clear('trustname')}
              />

              {/* ── Show More / Less toggle ── */}
              <TouchableOpacity
                style={fp.showMoreBtn}
                onPress={() => setShowMore(v => !v)}
              >
                <Icon
                  name={showMore ? 'chevron-up' : 'chevron-down'}
                  size={16} color="#1565C0"
                />
                <Text style={fp.showMoreText}>
                  {showMore ? 'Show Less Filters' : 'Show More Filters'}
                </Text>
              </TouchableOpacity>

              {/* ── EXTENDED FILTERS (show more) ── */}
              {showMore && (
                <>
                  {/* 4. Selling Bank */}
                  <DropdownField
                    label="Selling Bank"
                    icon="bank-outline"
                    placeholder="Select bank..."
                    value={filters.selling_bank || ''}
                    options={bankList}
                    bindLabel="selling_bank"
                    onSelect={(val) => set('selling_bank', val)}
                    onClear={() => clear('selling_bank')}
                  />

                  {/* 5. Source — bindLabel/Value = "type" (Angular: source dropdown) */}
                  <DropdownField
                    label="Source"
                    icon="lightning-bolt-outline"
                    placeholder="Select source..."
                    value={filters.source || ''}
                    options={sourceList}
                    bindLabel="type"
                    onSelect={(val) => set('source', val)}
                    onClear={() => clear('source')}
                  />

                  {/* 6 & 7. Start Date / End Date */}
                  <DateField
                    label="Start Date"
                    icon="calendar-start"
                    value={filters.startDate || ''}
                    onSelect={(iso) => set('startDate', iso)}
                    onClear={() => { clear('startDate'); clear('EndDate'); }}
                  />
                  <DateField
                    label="End Date"
                    icon="calendar-end"
                    value={filters.EndDate || ''}
                    disabled={!filters.startDate}
                    minDate={filters.startDate}
                    onSelect={(iso) => set('EndDate', iso)}
                    onClear={() => clear('EndDate')}
                  />
                </>
              )}
            </View>
            <View style={{ height: 24 }} />
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
              <Text style={fp.applyText}>
                Apply{activeCount > 0 ? ` (${activeCount})` : ''}
              </Text>
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
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.93,
    minHeight: SCREEN_HEIGHT * 0.55,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 12,
  },
  dragArea: { paddingVertical: 12, alignItems: 'center' },
  dragHandle: { width: 38, height: 4, backgroundColor: '#ddd', borderRadius: 2 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: '#1565C0', marginTop: 1, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#FFCDD2',
  },
  resetText: { fontSize: 12, color: '#F44336', fontWeight: '600' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center',
  },

  scroll: { flex: 1 },
  fieldsContainer: { paddingHorizontal: 20, paddingTop: 16 },
  fieldWrap: { marginBottom: 18 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  fieldLabel: { fontSize: 13, color: '#888', fontWeight: '500', flex: 1 },
  fieldLabelActive: { color: '#1565C0' },
  fieldLabelDisabled: { color: '#ccc' },
  clearField: { padding: 2 },

  textInput: {
    height: 46, borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 12, paddingHorizontal: 14,
    fontSize: 14, color: '#1A1A2E', backgroundColor: '#FAFAFA',
  },
  textInputActive: { borderColor: '#1565C0', backgroundColor: '#F0F4FF' },

  // Auto-suggest
  suggestList: {
    marginTop: 4, borderWidth: 1, borderColor: '#E8EEF9',
    borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  suggestItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  suggestItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestPrimary: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  suggestSecondary: { fontSize: 11, color: '#888', marginTop: 1 },

  // Dropdown
  dropdownTrigger: {
    height: 46, borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FAFAFA',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownTriggerActive: { borderColor: '#1565C0', backgroundColor: '#F0F4FF' },
  dropdownValue: { fontSize: 14, color: '#1A1A2E', flex: 1 },
  dropdownPlaceholder: { color: '#bbb' },
  dropdownList: {
    marginTop: 4, borderWidth: 1, borderColor: '#E8EEF9',
    borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  dropdownOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, paddingHorizontal: 14,
  },
  dropdownOptionBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dropdownOptionSelected: { backgroundColor: '#F0F4FF' },
  dropdownOptionText: { fontSize: 13, color: '#333', flex: 1 },
  dropdownOptionTextSelected: { color: '#1565C0', fontWeight: '600' },
  dropdownEmpty: { paddingVertical: 14, paddingHorizontal: 14, fontSize: 13, color: '#aaa', textAlign: 'center' },

  // Multi-select checkbox
  checkbox: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 1.5,
    borderColor: '#CBD5E1', backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  checkboxChecked: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  selectedPills: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 6, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  selectedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  selectedPillText: { fontSize: 11, color: '#1565C0', fontWeight: '600' },

  // Date field
  dateRow: {
    height: 46, borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FAFAFA',
    flexDirection: 'row', alignItems: 'center',
  },
  dateRowActive: { borderColor: '#1565C0', backgroundColor: '#F0F4FF' },
  dateRowDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E8E8E8', opacity: 0.6 },
  datePart: { fontSize: 14, color: '#1A1A2E', width: 28, textAlign: 'center' },
  dateYear: { width: 44 },
  dateSep: { fontSize: 16, color: '#bbb', marginHorizontal: 2 },

  // Show more button
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, marginBottom: 6,
    alignSelf: 'flex-start',
  },
  showMoreText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },

  // Section divider
  sectionDivider: {
    height: 1, backgroundColor: '#F0F4FF', marginVertical: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff',
  },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#666', fontWeight: '600' },
  applyBtn: {
    flex: 2, height: 50, borderRadius: 14,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 6,
    elevation: 3, shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  applyBtnDisabled: { backgroundColor: '#90A4AE', elevation: 0, shadowOpacity: 0 },
  applyText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

export default DispositionFilterPopup;
