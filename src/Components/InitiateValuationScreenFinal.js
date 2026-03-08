/**
 * InitiateValuationScreen.js
 * React Native — exact design & logic match to web preview
 *
 * Screens:  SELECT  →  FORM (4 steps)  →  SUCCESS
 *
 * Status logic:
 *   null          → select directly
 *   "1" Initiated → InProcess modal (cannot reinitiate)
 *   "2","3","4","5","6" → ConfirmReinitiate modal → proceed on Yes
 *
 * Validation:
 *   All fields required | email must end with @exponetia.in
 *
 * API payload matches valuation_create.txt structure.
 * Replace MOCK_API with route.params.apiData in production.
 * Submit endpoint: https://testapp.example.com/createvaluation
 */

import React, { useState, useEffect, useRef,useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  KeyboardAvoidingView,
  StyleSheet
} from 'react-native';
import { InitialLoader, SubmitLoader } from './ValuationLoaders';
import Api from "../Utilities/apiService"
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/theme';
 

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  primary:      '#1A56DB',
  primaryLight: '#EBF1FF',
  primaryDark:  '#1240A8',
  accent:       '#3B82F6',
  white:        '#FFFFFF',
  bg:           '#EEF3FF',
  border:       '#D1DCF8',
  inputBg:      '#F8FAFF',
  text:         '#1E2A4A',
  textMuted:    '#6B7A99',
  grey:         '#E8EDF8',
  greyDark:     '#B0BCDA',
  success:      '#10B981',
  successLight: '#ECFDF5',
  error:        '#EF4444',
  errorLight:   '#FEF2F2',
  warn:         '#F59E0B',
  warnLight:    '#FFFBEB',
  info:         '#3B82F6',
  infoLight:    '#EFF6FF',
};

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  '1': 'Initiated',
  '2': 'Rejected',
  '3': 'Cancelled at Initiation Stage',
  '4': 'Completed',
  '5': 'Cancelled at Draft Stage',
  '6': 'Cancelled at Request Stage',
};
const CAN_REINITIATE = ['2', '3', '4', '5', '6'];
const IN_PROCESS     = ['1'];

const getStatusStyle = (status) => {
  if (!status)                   return { bg: '#ECFDF5', border: '#6EE7B7', color: '#10B981', label: 'AVAILABLE' };
  if (IN_PROCESS.includes(status)) return { bg: '#EFF6FF', border: '#93C5FD', color: '#3B82F6', label: STATUS_MAP[status] };
  if (status === '2')            return { bg: '#FEF2F2', border: '#FCA5A5', color: '#EF4444', label: STATUS_MAP[status] };
  if (status === '4')            return { bg: '#F0FDF4', border: '#86EFAC', color: '#16A34A', label: STATUS_MAP[status] };
  return { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', label: STATUS_MAP[status] };
};

// ─── MOCK API (replace with route.params.apiData) ─────────────────────────────
const MOCK_API = {
  result: [
    {
      lms_last_status: 'Yes', construction_status: null, negative_factor_freetext: null,
      positive_factor_freetext: null, priority_status: null, structural_soundness: null,
      positive_factor: null, negative_factor: null, valuation_for: null, tvpstatus: null,
      date_of_visit: null, valuation_type: null, is_trash: null, contact_number: null,
      contact_person_email: null, contact_person_name: null, account_qnq_id: '85441',
      customername: 'Aarti Agrawal', accountno: '00800012367', status: null,
      assetcodes: 'H77_162902_MLMP_3/4',
      collateraladdress: 'FLAT NO. 202, PLOT NO. B-19 S.S. ENCLAVE, BLOCK-A, SECOND FLOOR SAMARTHA PARK COLONY, MHOW, INDORE-453441',
      trust: 'EARC Trust SC 477', trust_code: 'H77',
    },
    {
      lms_last_status: 'Yes', construction_status: 'Complete', negative_factor_freetext: null,
      positive_factor_freetext: null, priority_status: 'Priority1', structural_soundness: 'Average',
      positive_factor: ['Structural soundness or Infrastructure Development'],
      negative_factor: ['Narrow approach road or Kaccha Road or high voltage line passing'],
      valuation_for: 'Settlement', tvpstatus: null, date_of_visit: '2024-06-27',
      valuation_type: 'Desktop Valuation', is_trash: null, contact_number: '9078675656',
      contact_person_email: 'test@exponetia.in', contact_person_name: 'test',
      account_qnq_id: '85441', customername: 'Aarti Agrawal', accountno: '00800012367',
      status: '1',
      assetcodes: 'H77_162902_MLMP_2/3',
      collateraladdress: 'SHOP NO. 3, GROUND FLOOR, COMMERCIAL COMPLEX, ANNA NAGAR, CHENNAI – 600040',
      trust: 'EARC Trust SC 477', trust_code: 'H77',
    },
    {
      lms_last_status: 'Yes', construction_status: 'Complete', negative_factor_freetext: null,
      positive_factor_freetext: null, priority_status: 'Priority2', structural_soundness: 'Poor',
      positive_factor: ['Posh area or Market Demand or Retail Trends and Growth Potential'],
      negative_factor: ['Vastu related issues'],
      valuation_for: 'Auction', tvpstatus: null, date_of_visit: '2024-03-10',
      valuation_type: 'Internal', is_trash: null, contact_number: '9900112233',
      contact_person_email: 'narendra@exponetia.in', contact_person_name: 'Narendra',
      account_qnq_id: '85441', customername: 'Aarti Agrawal', accountno: '00800012367',
      status: '4',
      assetcodes: 'H77_162902_MLMP_1/1',
      collateraladdress: 'PLOT NO. 14, SECTOR 7, PORUR, CHENNAI – 600116',
      trust: 'EARC Trust SC 477', trust_code: 'H77',
    },
    {
      lms_last_status: 'Yes', construction_status: null, negative_factor_freetext: null,
      positive_factor_freetext: null, priority_status: null, structural_soundness: null,
      positive_factor: null, negative_factor: null, valuation_for: null, tvpstatus: null,
      date_of_visit: null, valuation_type: null, is_trash: null, contact_number: null,
      contact_person_email: null, contact_person_name: null,
      account_qnq_id: '85441', customername: 'Aarti Agrawal', accountno: '00800012367',
      status: '2',
      assetcodes: 'H77_162902_MLMP_5/5',
      collateraladdress: 'HOUSE NO. 88, WEST PATEL NAGAR, NEW DELHI – 110008',
      trust: 'EARC Trust SC 477', trust_code: 'H77',
    },
  ],
  valuationcommon: {
    valuation_type: [
      { name: 'Internal',          value: 'Internal' },
      { name: 'External',          value: 'External' },
      { name: 'Desktop Valuation', value: 'Desktop Valuation' },
    ],
    valuation_for:   ['Settlement', 'Auction', 'Re-Valuation'],
    priority_status: ['Priority1', 'Priority2', 'Priority3'],
    structural_soundness: [
      { name: 'Average',   value: 'Average' },
      { name: 'Very good', value: 'Very good' },
      { name: 'Poor',      value: 'Poor' },
    ],
    construction_status: [
      { name: 'Incomplete Construction - On hold',   value: 'Incomplete Construction - On hold from long and no scope of construction in the near future' },
      { name: 'Incomplete Construction - Ongoing',   value: 'Incomplete Construction - Construction work is ongoing' },
      { name: 'Complete',       value: 'Complete' },
      { name: 'No Construction', value: 'No Construction' },
    ],
    positive_factors: [
      { name: 'Proximity to basic amenities, Market, School, hospital, bus stop, Local transportation', value: 'Proximity to basic amenities, Market, School, hospital, bus stop, Local transportation' },
      { name: 'Structural soundness or Infrastructure Development',                                      value: 'Structural soundness or Infrastructure Development' },
      { name: 'Posh area or Market Demand or Retail Trends and Growth Potential',                        value: 'Posh area or Market Demand or Retail Trends and Growth Potential' },
    ],
    negative_factors: [
      { name: 'Narrow approach road or Kaccha Road or high voltage line passing',                             value: 'Narrow approach road or Kaccha Road or high voltage line passing' },
      { name: 'Average structural soundness or Leakage or Repairs required or Improper Drainage system',     value: 'Average structural soundness or Leakage or Repairs required or Improper Drainage system' },
      { name: 'Negative area/Community dominated area or religious area',                                     value: 'Negative area/Community dominated area or religious area' },
      { name: 'Basic amenities not available such as parking, lift, securities etc',                          value: 'Basic amenities not available such as parking, lift, securities etc' },
      { name: 'Scarcity of water or electricity supply',                                                      value: 'Scarcity of water or electricity supply' },
      { name: 'Near Graveyard or Sewage Canals or Liquor Shop or Red light area',                            value: 'Near Graveyard or Sewage Canals or Liquor Shop or Red light area' },
      { name: 'Vastu related issues',                                                                         value: 'Vastu related issues' },
      { name: 'No direct access to property or Less occupancy or Weak Market Demand',                        value: 'No direct access to property or Less occupancy or Weak Market Demand' },
      { name: 'Water Logging / Low lying area / Situated at below road level',                               value: 'Water Logging / Low lying area / Situated at below road level' },
      { name: 'Encumbrance if any (Challenges in registration of property)',                                  value: 'Encumbrance if any (Challenges in registration of property)' },
    ],
  },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STEPS      = ['Contact', 'Valuation', 'Assessment', 'Factors'];
const DOMAIN     = '@exponetia.in';

const STEP_FIELDS = [
  ['contact_person_name', 'contact_person_email', 'contact_number', 'date_of_visit'],
  ['valuation_type', 'valuation_for', 'priority_status'],
  ['structural_soundness', 'construction_status'],
  ['positive_factor', 'negative_factor'],
];

// ─── VALIDATORS ───────────────────────────────────────────────────────────────
const VALIDATORS = {
  contact_person_name:  (v) => (!v || !v.trim() ? 'Contact person name is required' : null),
  contact_person_email: (v) => {
    if (!v || !v.trim()) return 'Email is required';
    if (!v.endsWith(DOMAIN)) return `Only ${DOMAIN} email addresses are allowed`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
    return null;
  },
  contact_number: (v) => {
    if (!v || !v.trim()) return 'Contact number is required';
    if (!/^\d{10}$/.test(v.trim())) return 'Enter a valid 10-digit number';
    return null;
  },
  date_of_visit:        (v) => (!v ? 'Date of visit is required' : null),
  valuation_type:       (v) => (!v ? 'Valuation type is required' : null),
  valuation_for:        (v) => (!v ? 'Valuation for is required' : null),
  priority_status:      (v) => (!v ? 'Priority status is required' : null),
  structural_soundness: (v) => (!v ? 'Structural soundness is required' : null),
  construction_status:  (v) => (!v ? 'Construction status is required' : null),
  positive_factor:      (v) => (!v || v.length === 0 ? 'Select at least one positive factor' : null),
  negative_factor:      (v) => (!v || v.length === 0 ? 'Select at least one negative factor' : null),
};

const normalize = (opts) => opts.map((o) => (typeof o === 'string' ? { name: o, value: o } : o));

// ═══════════════════════════════════════════════════════════════════════════════
//  BOTTOM SHEET — SINGLE SELECT
// ═══════════════════════════════════════════════════════════════════════════════
const SingleSelectSheet = ({ visible, label, options, value, onSelect, onClose }) => {
  const slideY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : 500,
      tension: 65, friction: 11, useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;
  const items = normalize(options);

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[st.sheet, { transform: [{ translateY: slideY }] }]}>
          <TouchableOpacity activeOpacity={1}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <Text style={st.sheetTitle}>{label}</Text>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const sel = item.value === value;
                return (
                  <TouchableOpacity
                    style={[st.optionRow, sel && { backgroundColor: C.primaryLight }]}
                    onPress={() => { onSelect(item.value); onClose(); }}
                    activeOpacity={0.7}
                  >
                    <View style={[st.radioCircle, sel && { borderColor: C.primary, backgroundColor: C.primary }]}>
                      {sel && <View style={st.radioDot} />}
                    </View>
                    <Text style={[st.optionText, sel && { color: C.primary, fontWeight: '600' }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <View style={{ height: 20 }} />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  BOTTOM SHEET — MULTI SELECT
// ═══════════════════════════════════════════════════════════════════════════════
const MultiSelectSheet = ({ visible, label, options, values, onToggle, onClose }) => {
  const slideY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : 500,
      tension: 65, friction: 11, useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;
  const items = normalize(options);

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[st.sheet, { transform: [{ translateY: slideY }] }]}>
          <TouchableOpacity activeOpacity={1}>
            <View style={st.sheetHandle} />
            <View style={st.sheetHeader}>
              <Text style={[st.sheetTitle, { flex: 1 }]}>{label}</Text>
              {values.length > 0 && (
                <View style={st.countBadge}>
                  <Text style={st.countBadgeText}>{values.length} selected</Text>
                </View>
              )}
              <TouchableOpacity style={st.doneBtn} onPress={onClose}>
                <Text style={st.doneBtnText}>Done ✓</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const sel = values.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[st.optionRow, sel && { backgroundColor: C.primaryLight }, { borderBottomWidth: 1, borderBottomColor: C.grey }]}
                    onPress={() => onToggle(item.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[st.checkBox, sel && { borderColor: C.primary, backgroundColor: C.primary }]}>
                      {sel && <Text style={{ color: C.white, fontSize: 11, fontWeight: '800' }}>✓</Text>}
                    </View>
                    <Text style={[st.optionText, sel && { color: C.primary, fontWeight: '600' }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <View style={{ height: 20 }} />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MODAL — IN PROCESS
// ═══════════════════════════════════════════════════════════════════════════════
const InProcessModal = ({ visible, asset, onClose }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [visible]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={st.dialogOverlay}>
        <View style={st.dialogBox}>
          {/* Spinner ring + icon */}
          <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <View style={[st.dialogIconCircle, { backgroundColor: C.infoLight, borderColor: '#93C5FD' }]} />
            <Animated.View style={[st.spinRing, { transform: [{ rotate: spin }] }]} />
            <Text style={st.dialogIconEmoji}>⏳</Text>
          </View>

          <Text style={st.dialogTitle}>Valuation In Process</Text>

          <View style={st.assetChip}>
            <Text style={st.assetChipText}>{asset?.assetcodes}</Text>
          </View>

          <Text style={st.dialogBody}>
            Valuation for this asset is currently{' '}
            <Text style={{ color: C.info, fontWeight: '700' }}>In Process</Text>.
          </Text>
          <Text style={[st.dialogBody, { fontWeight: '700', color: C.info, marginBottom: 14 }]}>
            Please wait...
          </Text>

          <View style={[st.infoNote, { backgroundColor: C.infoLight, borderColor: '#BFDBFE' }]}>
            <Text style={[st.infoNoteText, { color: C.info }]}>
              A new valuation cannot be initiated until the existing one is resolved.
            </Text>
          </View>

          <TouchableOpacity style={[st.btnOutline, { width: '100%', marginTop: 4 }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={st.btnOutlineText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MODAL — CONFIRM REINITIATE
// ═══════════════════════════════════════════════════════════════════════════════
const ConfirmModal = ({ visible, asset, onYes, onCancel }) => {
  if (!asset) return null;
  const s           = asset.status;
  const statusLabel = STATUS_MAP[s];
  const isCompleted = s === '4';
  const isRejected  = s === '2';
  const emoji       = isCompleted ? '✅' : isRejected ? '❌' : '🚫';
  const iconBg      = isCompleted ? '#F0FDF4' : isRejected ? '#FEF2F2' : '#FFFBEB';
  const iconBorder  = isCompleted ? '#86EFAC' : isRejected ? '#FCA5A5' : '#FCD34D';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={st.dialogOverlay}>
        <View style={st.dialogBox}>
          <View style={[st.dialogIconCircle, { backgroundColor: iconBg, borderColor: iconBorder, marginBottom: 18 }]}>
            <Text style={st.dialogIconEmoji}>{emoji}</Text>
          </View>

          <Text style={st.dialogTitle}>Valuation {statusLabel}</Text>

          <View style={st.assetChip}>
            <Text style={st.assetChipText}>{asset.assetcodes}</Text>
          </View>

          <Text style={st.dialogBody}>
            Valuation for this asset is already marked as{'\n'}
            <Text style={{ fontWeight: '700', color: C.text }}>"{statusLabel}"</Text>.{'\n'}
            Do you want to re-initiate a new valuation?
          </Text>

          <View style={st.dialogBtnRow}>
            <TouchableOpacity style={[st.btnOutline, { flex: 1 }]} onPress={onCancel} activeOpacity={0.8}>
              <Text style={st.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.btnPrimary, { flex: 1 }]} onPress={onYes} activeOpacity={0.85}>
              <Text style={st.btnPrimaryText}>Yes, Initiate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  REUSABLE FIELD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const FieldLabel = ({ text, required }) => (
  <Text style={st.fieldLabel}>
    {text.toUpperCase()}
    {required ? <Text style={{ color: C.error }}> *</Text> : null}
  </Text>
);

const ErrText = ({ msg }) =>
  msg ? <Text style={st.errText}>⚠  {msg}</Text> : null;

const ReadOnlyField = ({ label, value, icon }) => (
  <View style={st.fieldWrap}>
    <FieldLabel text={label} />
    <View style={[st.inputBox, { backgroundColor: C.grey }]}>
      {icon ? <Text style={st.fieldIcon}>{icon}</Text> : null}
      <Text style={[st.inputText, { flex: 1 }]} numberOfLines={3}>{value || '—'}</Text>
    </View>
  </View>
);

const InputField = ({
  label, value, onChange, keyboardType = 'default',
  icon, placeholder, required, error, touched, hint,
}) => {
  const [focused, setFocused] = useState(false);
  const hasErr = touched && error;
  return (
    <View style={st.fieldWrap}>
      <FieldLabel text={label} required={required} />
      <View style={[
        st.inputBox,
        hasErr   && st.inputBoxError,
        focused && !hasErr && st.inputBoxFocus,
      ]}>
        {icon ? <Text style={st.fieldIcon}>{icon}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || label}
          placeholderTextColor={C.greyDark}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          style={st.textInput}
        />
      </View>
      {hint && !hasErr && <Text style={st.hintText}>💡  {hint}</Text>}
      <ErrText msg={hasErr ? error : null} />
    </View>
  );
};

const SelectField = ({ label, value, options, onChange, icon, required, error, touched }) => {
  const [open, setOpen] = useState(false);
  const items      = normalize(options);
  const displayName = items.find((o) => o.value === value)?.name || null;
  const hasErr     = touched && error;
  return (
    <>
      <View style={st.fieldWrap}>
        <FieldLabel text={label} required={required} />
        <TouchableOpacity
          style={[st.inputBox, hasErr && st.inputBoxError, !hasErr && value && st.inputBoxFocus]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {icon ? <Text style={st.fieldIcon}>{icon}</Text> : null}
            <Text style={[st.inputText, !displayName && { color: C.greyDark }]} numberOfLines={1}>
              {displayName || `Select ${label}`}
            </Text>
          </View>
          <Text style={{ color: hasErr ? C.error : C.primary, fontSize: 16 }}>▾</Text>
        </TouchableOpacity>
        <ErrText msg={hasErr ? error : null} />
      </View>
      <SingleSelectSheet
        visible={open} label={label} options={options}
        value={value} onSelect={onChange} onClose={() => setOpen(false)}
      />
    </>
  );
};

const MultiField = ({ label, values, options, onToggle, icon, required, error, touched }) => {
  const [open, setOpen] = useState(false);
  const items  = normalize(options);
  const hasErr = touched && error;
  return (
    <>
      <View style={st.fieldWrap}>
        <FieldLabel text={label} required={required} />
        <TouchableOpacity
          style={[
            st.inputBox,
            { minHeight: 50, alignItems: 'flex-start', paddingVertical: 11 },
            hasErr && st.inputBoxError,
            !hasErr && values.length > 0 && st.inputBoxFocus,
          ]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          {values.length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {icon ? <Text style={st.fieldIcon}>{icon}</Text> : null}
              <Text style={[st.inputText, { color: C.greyDark, flex: 1 }]}>Select {label}</Text>
              <Text style={{ color: hasErr ? C.error : C.primary, fontSize: 16 }}>▾</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                {values.map((v) => {
                  const opt       = items.find((o) => o.value === v);
                  const shortName = opt?.name?.split(' ').slice(0, 4).join(' ') + '…';
                  return (
                    <View key={v} style={st.multiChip}>
                      <Text style={st.multiChipText}>{shortName}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={{ fontSize: 11, color: C.primary, fontWeight: '600' }}>
                Tap to edit ({values.length} selected)  ▾
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <ErrText msg={hasErr ? error : null} />
      </View>
      <MultiSelectSheet
        visible={open} label={label} options={options}
        values={values} onToggle={onToggle} onClose={() => setOpen(false)}
      />
    </>
  );
};

const SectionHead = ({ title, subtitle }) => (
  <View style={{ marginBottom: 16, marginTop: 4 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
      <View style={st.sectionBar} />
      <Text style={st.sectionTitle}>{title}</Text>
    </View>
    {subtitle ? <Text style={st.sectionSub}>{subtitle}</Text> : null}
  </View>
);

const HR = () => <View style={st.hr} />;

// ═══════════════════════════════════════════════════════════════════════════════
//  SCREEN 1 — ASSET SELECTION
// ═══════════════════════════════════════════════════════════════════════════════
const AssetSelectionScreen = ({ apiData, onProceed }) => {
  const { result } = apiData;
  const [selected,     setSelected]     = useState(null);
  const [confirmAsset, setConfirmAsset] = useState(null);
  const [inProcAsset,  setInProcAsset]  = useState(null);

  const firstAsset = result[0];

  const handleTap = (asset) => {
    const s = asset.status;
    if (!s) {
      setSelected(selected === asset.assetcodes ? null : asset.assetcodes);
      return;
    }
    if (IN_PROCESS.includes(s)) { setInProcAsset(asset);  return; }
    if (CAN_REINITIATE.includes(s)) { setConfirmAsset(asset); return; }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      {/* Account summary */}
      <View style={st.accountCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
          <View style={st.pillBlue}>
            <Text style={st.pillBlueText}>ACCOUNT</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.primaryDark, marginLeft: 8 }}>
            {firstAsset.accountno}
          </Text>
          <View style={[st.pillBlue, { marginLeft: 'auto', backgroundColor: C.white, borderWidth: 1, borderColor: C.border }]}>
            <Text style={[st.pillBlueText, { color: C.textMuted }]}>{firstAsset.trust_code}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 }}>
          👤 {firstAsset.customername}
        </Text>
        <Text style={{ fontSize: 11, color: C.textMuted }}>🏛  {firstAsset.trust}</Text>
      </View>

      {/* List header */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Select a Property</Text>
        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
          {result.length} collateral{result.length > 1 ? 's' : ''} found for this loan
        </Text>
      </View>

      {/* Asset cards */}
      <FlatList
        data={result}
        keyExtractor={(item,index) => item.assetcodes+index}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const s        = item.status;
          const style    = getStatusStyle(s);
          const isSel    = selected === item.assetcodes;
          const inProc   = IN_PROCESS.includes(s);
          const canReinit = CAN_REINITIATE.includes(s);

          return (
            <TouchableOpacity
              style={[
                st.assetCard,
                isSel     && { borderColor: C.primary, elevation: 6, shadowOpacity: 0.18 },
                inProc    && { borderColor: '#93C5FD' },
                canReinit && !isSel && { borderColor: style.border },
              ]}
              onPress={() => handleTap(item)}
              activeOpacity={0.85}
            >
              {/* Left accent */}
              {isSel && <View style={st.accentBar} />}

              {/* Top row: radio + code + status */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={[st.radioCircle, isSel && { borderColor: C.primary, backgroundColor: C.primary }]}>
                    {isSel && <View style={st.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 12, fontWeight: '700', color: isSel ? C.primary : C.text }]}>
                      {item.assetcodes}
                    </Text>
                    <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                      {item.trust_code} · {item.accountno}
                    </Text>
                  </View>
                </View>
                <View style={[st.statusChip, { backgroundColor: style.bg, borderColor: style.border }]}>
                  <Text style={[st.statusChipText, { color: style.color }]} numberOfLines={1}>
                    {style.label}
                  </Text>
                </View>
              </View>

              {/* Address */}
              <View style={st.addressBox}>
                <Text style={st.addressText}>📍  {item.collateraladdress}</Text>
              </View>

              {/* Hint row */}
              {inProc && (
                <View style={[st.hintRow, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', marginTop: 7 }]}>
                  <Text style={{ fontSize: 11, color: C.info, fontWeight: '600' }}>
                    ⏳  Tap to view status · Valuation in process
                  </Text>
                </View>
              )}
              {canReinit && (
                <View style={[st.hintRow, { backgroundColor: style.bg, borderColor: style.border, borderStyle: 'dashed', marginTop: 7 }]}>
                  <Text style={{ fontSize: 11, color: style.color, fontWeight: '600' }}>
                    🔄  Tap to re-initiate valuation
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* CTA footer */}
      <View style={st.footer}>
        <TouchableOpacity
          style={[st.btnPrimary, !selected && st.btnDisabled]}
          onPress={() => selected && onProceed(selected)}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={[st.btnPrimaryText, !selected && { color: C.greyDark }]}>
            {selected ? `Continue with ${selected}  →` : 'Select a property to continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <InProcessModal
        visible={!!inProcAsset}
        asset={inProcAsset}
        onClose={() => setInProcAsset(null)}
      />
      <ConfirmModal
        visible={!!confirmAsset}
        asset={confirmAsset}
        onYes={() => { setSelected(confirmAsset.assetcodes); setConfirmAsset(null); }}
        onCancel={() => setConfirmAsset(null)}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SCREEN 2 — VALUATION FORM  (4 steps)
// ═══════════════════════════════════════════════════════════════════════════════
const ValuationFormScreen = ({ apiData, selectedCode, onBack, onSubmit }) => {
  const { result, valuationcommon } = apiData;
  const asset = result.find((a) => a.assetcodes === selectedCode);

  const [step,    setStep]    = useState(0);
  const [touched, setTouched] = useState({});
  const [form,    setForm]    = useState({
    contact_person_name:  asset.contact_person_name  || '',
    contact_person_email: asset.contact_person_email || '',
    contact_number:       asset.contact_number       || '',
    date_of_visit:        asset.date_of_visit        || '',
    valuation_type:       asset.valuation_type       || '',
    valuation_for:        asset.valuation_for        || '',
    priority_status:      asset.priority_status      || '',
    structural_soundness: asset.structural_soundness || '',
    construction_status:  asset.construction_status  || '',
    positive_factor:      asset.positive_factor      || [],
    negative_factor:      asset.negative_factor      || [],
    positive_factor_freetext: asset.positive_factor_freetext || '',
    negative_factor_freetext: asset.negative_factor_freetext || '',
  });

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };
  const toggleMulti = (k) => (v) => {
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));
    setTouched((t) => ({ ...t, [k]: true }));
  };

  // compute errors for all validators
  const getErrors = () => {
    const errs = {};
    Object.keys(VALIDATORS).forEach((k) => {
      const e = VALIDATORS[k](form[k]);
      if (e) errs[k] = e;
    });
    return errs;
  };

  const errors      = getErrors();
  const curFields   = STEP_FIELDS[step];
  const stepHasErr  = curFields.some((f) => errors[f]);
  const isLast      = step === STEPS.length - 1;

  const touchCurrentStep = () => {
    const t = {};
    curFields.forEach((f) => { t[f] = true; });
    setTouched((prev) => ({ ...prev, ...t }));
  };

  const handleNext = () => {
    touchCurrentStep();
    if (!stepHasErr) setStep((s) => s + 1);
  };

  const handleBack = () => (step === 0 ? onBack() : setStep((s) => s - 1));

  const handleSubmit = () => {
    const allT = {};
    Object.keys(VALIDATORS).forEach((k) => { allT[k] = true; });
    setTouched(allT);
    if (Object.keys(errors).length === 0) {
      onSubmit({
        propertylist: [{
          account_qnq_id:           asset.account_qnq_id,
          accountno:                asset.accountno,
          assetcodes:               asset.assetcodes,
          checked:                  true,
          collateraladdress:        asset.collateraladdress,
          construction_status:      form.construction_status,
          contact_number:           form.contact_number,
          contact_person_email:     form.contact_person_email,
          contact_person_name:      form.contact_person_name,
          customername:             asset.customername,
          date_of_visit:            form.date_of_visit,
          email_created_by:         'user@exponetia.in', // replace with auth user
          is_trash:                 null,
          lms_last_status:          asset.lms_last_status,
          negative_factor:          form.negative_factor,
          negative_factor_freetext: form.negative_factor_freetext || null,
          positive_factor:          form.positive_factor,
          positive_factor_freetext: form.positive_factor_freetext || null,
          priority_status:          form.priority_status,
          status:                   null,
          structural_soundness:     form.structural_soundness,
          trust:                    asset.trust,
          trust_code:               asset.trust_code,
          tvpstatus:                null,
          valuation_for:            form.valuation_for,
          valuation_type:           form.valuation_type,
        }],
      });
    }
  };

  // helper shorthands
  const fp = (k) => ({ value: form[k], onChange: set(k), error: errors[k], touched: touched[k], required: true });
  const mp = (k) => ({ values: form[k], onToggle: toggleMulti(k), error: errors[k], touched: touched[k], required: true });
  const stepHasVisibleErr = curFields.some((f) => errors[f] && touched[f]);

  // ── render each step's content ──
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <SectionHead title="Contact Information" subtitle="All fields are required" />
            <ReadOnlyField label="Asset Code"          value={asset.assetcodes}          icon="🏷️" />
            <ReadOnlyField label="Collateral Address"  value={asset.collateraladdress}   icon="📍" />
            <HR />
            <InputField
              label="Contact Person Name" {...fp('contact_person_name')}
              icon="👤" placeholder="Full name"
            />
            <InputField
              label="Contact Email" {...fp('contact_person_email')}
              keyboardType="email-address" icon="✉️"
              placeholder={`name${DOMAIN}`}
              hint={`Must be a ${DOMAIN} address`}
            />
            <InputField
              label="Contact Number" {...fp('contact_number')}
              keyboardType="phone-pad" icon="📞" placeholder="10-digit number"
            />
            <InputField
              label="Date of Visit" {...fp('date_of_visit')}
              icon="📅" placeholder="YYYY-MM-DD"
            />
          </View>
        );

      case 1:
        return (
          <View>
            <SectionHead title="Valuation Details" subtitle="All fields are required" />
            <SelectField label="Valuation Type"   {...fp('valuation_type')}   options={valuationcommon.valuation_type}   icon="📋" />
            <SelectField label="Valuation For"    {...fp('valuation_for')}    options={valuationcommon.valuation_for}    icon="🎯" />
            <SelectField label="Priority Status"  {...fp('priority_status')}  options={valuationcommon.priority_status}  icon="⚡" />
          </View>
        );

      case 2:
        return (
          <View>
            <SectionHead title="Property Assessment" subtitle="All fields are required" />
            <SelectField label="Structural Soundness" {...fp('structural_soundness')} options={valuationcommon.structural_soundness} icon="🏗️" />
            <SelectField label="Construction Status"  {...fp('construction_status')}  options={valuationcommon.construction_status}  icon="🔨" />
            {form.structural_soundness ? (
              <View style={st.soundnessCard}>
                <Text style={{ fontSize: 22 }}>
                  {form.structural_soundness === 'Very good' ? '✅' :
                   form.structural_soundness === 'Average'   ? '⚠️' : '🔴'}
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.primary }}>
                    Soundness: {form.structural_soundness}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    {form.structural_soundness === 'Very good'
                      ? 'Excellent structural condition'
                      : form.structural_soundness === 'Average'
                        ? 'Minor repairs may be needed'
                        : 'Significant structural concerns found'}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        );

      case 3:
        return (
          <View>
            <SectionHead title="Market Factors" subtitle="Select at least one of each" />
            <MultiField label="Positive Factors" {...mp('positive_factor')} options={valuationcommon.positive_factors} icon="✅" />
            <InputField
              label="Positive Factor Notes" value={form.positive_factor_freetext}
              onChange={set('positive_factor_freetext')} icon="📝"
              placeholder="Additional notes (optional)" error={null} touched={false}
            />
            <MultiField label="Negative Factors" {...mp('negative_factor')} options={valuationcommon.negative_factors} icon="⚠️" />
            <InputField
              label="Negative Factor Notes" value={form.negative_factor_freetext}
              onChange={set('negative_factor_freetext')} icon="📝"
              placeholder="Additional notes (optional)" error={null} touched={false}
            />

            {/* Summary card */}
            <View style={st.summaryCard}>
              <Text style={st.summaryCardTitle}>SUBMISSION SUMMARY</Text>
              <View style={st.summaryAssetBox}>
                <Text style={st.summaryAssetLabel}>ASSET</Text>
                <Text style={st.summaryAssetCode}>🏠  {asset.assetcodes}</Text>
              </View>
              {[
                ['Type',      form.valuation_type],
                ['For',       form.valuation_for],
                ['Priority',  form.priority_status],
                ['Soundness', form.structural_soundness],
                ['Positive',  form.positive_factor.length > 0 ? `${form.positive_factor.length} selected` : null],
                ['Negative',  form.negative_factor.length > 0 ? `${form.negative_factor.length} selected` : null],
              ].map(([l, v]) => (
                <View key={l} style={st.summaryRow}>
                  <Text style={st.summaryRowLabel}>{l}</Text>
                  <Text style={st.summaryRowValue}>{v || '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Asset strip */}
      <View style={st.assetStrip}>
        <View style={{ flex: 1 }}>
          <Text style={st.assetStripLabel}>INITIATING FOR</Text>
          <Text style={st.assetStripCode}>{selectedCode}</Text>
        </View>
        {stepHasVisibleErr && (
          <View style={st.stepErrBadge}>
            <Text style={st.stepErrBadgeText}>⚠  Fill required fields</Text>
          </View>
        )}
      </View>

      {/* Step progress bar */}
      <View style={st.stepBar}>
        {STEPS.map((s, i) => {
          const done    = i < step;
          const active  = i === step;
          const hasErr  = STEP_FIELDS[i].some((f) => errors[f] && touched[f]);
          return (
            <View key={s} style={{ flex: 1, marginHorizontal: 3 }}>
              <View style={[
                st.stepLine,
                (done || active) && !hasErr && { backgroundColor: C.primary },
                hasErr && { backgroundColor: C.error },
              ]} />
              <Text style={[
                st.stepLabel,
                (done || active) && !hasErr && { color: C.primary, fontWeight: '700' },
                hasErr && { color: C.error },
              ]}>
                {done && !hasErr ? '✓ ' : ''}{s}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Form content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      {/* Footer buttons */}
      <View style={st.footer}>
        <TouchableOpacity
          style={[st.btnOutline, { flex: 1 }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Text style={st.btnOutlineText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.btnPrimary, { flex: 2 }]}
          onPress={isLast ? handleSubmit : handleNext}
          activeOpacity={0.85}
        >
          <Text style={st.btnPrimaryText}>
            {isLast ? '✓  Submit Valuation' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SCREEN 3 — SUCCESS
// ═══════════════════════════════════════════════════════════════════════════════
const SuccessScreen = ({ assetCode, onReset }) => (
  <ScrollView
    contentContainerStyle={{ alignItems: 'center', padding: 28, paddingTop: 40 }}
    showsVerticalScrollIndicator={false}
  >
    {/* Icon */}
    <View style={st.successIcon}>
      <Text style={{ fontSize: 34 }}>✅</Text>
    </View>

    {/* Badge */}
    <View style={st.successBadge}>
      <Text style={st.successBadgeText}>VALUATION INITIATED</Text>
    </View>

    <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 }}>
      Submitted Successfully!
    </Text>
    <Text style={{ fontSize: 13, color: C.textMuted, marginBottom: 22 }}>
      Valuation has been initiated for
    </Text>

    {/* Asset result card */}
    <View style={st.successAssetCard}>
      <View style={st.successCheck}>
        <Text style={{ color: C.white, fontWeight: '800', fontSize: 14 }}>✓</Text>
      </View>
      <View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.primaryDark }}>{assetCode}</Text>
        <Text style={{ fontSize: 11, color: C.success, marginTop: 2 }}>Status: Initiated</Text>
      </View>
    </View>

    <TouchableOpacity
      style={[st.btnPrimary, { width: '100%' }]}
      onPress={onReset}
      activeOpacity={0.85}
    >
      <Text style={st.btnPrimaryText}>← Back to Loan List</Text>
    </TouchableOpacity>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN (entry point)
// ═══════════════════════════════════════════════════════════════════════════════
const InitiateValuationFinalScreen = ({ navigation, route }) => {
  // In production replace MOCK_API with:
  // const apiData = route?.params?.apiData || MOCK_API;
  const apiData = MOCK_API;

  const [screen,       setScreen]       = useState('SELECT'); // SELECT | FORM | SUCCESS
  const [selectedCode, setSelectedCode] = useState(null);
const [pageLoading, setPageLoading] = useState(true);
const [submitting,  setSubmitting]  = useState(false);
  const first      = apiData.result[0];
  const screenBadge = screen === 'SELECT' ? '📋 Select' : screen === 'FORM' ? '📝 Form' : '✅ Done';
   useLayoutEffect(() => {
                navigation.setOptions({
                  headerShown: false,
                });
              }, [navigation ]);
              
    // useEffect(() => {
    // Simulate API loading delay
   // const timer = setTimeout(() => {
   //   setPageLoading(false);
   // }, 1500); // 1.5 seconds delay
   // return () => clearTimeout(timer);
   //  }, []); 
     
      useEffect(() => {
    // Fetch valuation data on mount
        getValuationData(route.params.account_no);
      },[]);

   const handleSubmit = async (params) => {
        try {
                setSubmitting(true);
            let result = await Api.send(params, '/valuation/add');
             setScreen('SUCCESS');
              setSubmitting(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to submit. Please try again.');
        }finally{
              setSubmitting(false);
        } 
    };

    const getValuationData = async (account_no) => {
        try {
                
                let result = await Api.send({account_no: account_no}, '/valuation/newsearch');
                console.log('Fetched valuation data:', JSON.stringify(result) );
                result.result.forEach((item, index) => {
                  item.positive_factor = item.positive_factor ? item.positive_factor.split('#,').map((f) => f.trim()) : [];
                  item.negative_factor = item.negative_factor ? item.negative_factor.split('#,').map((f) => f.trim()) : [];
                 });
                setPageLoading(false);
                 
        } catch (error) {
            Alert.alert('Error', 'Failed to submit. Please try again.');
             setPageLoading(false);
        }

    }  
     
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primaryDark }}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* ── HEADER ── */}
      <View style={st.header}>
        <View style={st.headerBubble1} />
        <View style={st.headerBubble2} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={st.headerIconBox}>
                <TouchableOpacity
                                             style={st.backBtn}
                                             onPress={() => navigation.goBack()}
                     
                                             activeOpacity={0.75}
                                         >
                                             <Icon name="arrow-left" size={20} color={COLORS.white} />
                                         </TouchableOpacity>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.headerSub}>EARC RETAIL</Text>
            <Text style={st.headerTitle}>Initiate Valuation</Text>
          </View>
          <View style={st.headerBadge}>
            <Text style={st.headerBadgeText}>{screenBadge}</Text>
          </View>
        </View>
      </View>

      {/* ── LOAN CHIP ── */}
      {screen !== 'SUCCESS' && (
        <View style={st.loanChip}>
          <View style={st.pillBlue}>
            <Text style={st.pillBlueText}>LOAN</Text>
          </View>
          <Text style={{ fontSize: 12, color: C.primary, fontWeight: '700', marginLeft: 7 }}>
            {first.accountno}
          </Text>
          <Text style={{ fontSize: 11, color: C.textMuted, marginLeft: 5 }}>
            · {first.customername}
          </Text>
          {screen === 'FORM' && selectedCode && (
            <View style={[st.pillBlue, { marginLeft: 'auto' }]}>
              <Text style={st.pillBlueText}>1 asset</Text>
            </View>
          )}
        </View>
      )}

      {/* ── SCREEN CONTENT ── */}
      <View style={{ flex: 1, backgroundColor: C.white }}>

           {pageLoading ? (
    <InitialLoader />                          // ← shows while API fetches
  ) : screen === 'SELECT' ? (
    <AssetSelectionScreen  
    apiData={apiData}
            onProceed={(code) => { setSelectedCode(code); setScreen('FORM'); }}
    />
  ) : screen === 'FORM' ? (
    <ValuationFormScreen
     apiData={apiData}
            selectedCode={selectedCode}
            onBack={() => setScreen('SELECT')}
      onSubmit={async (payload) => { 
        console.log('Submitting valuation...', payload);                   // ← show overlay
        try {
           await handleSubmit(payload); // ← API call
          // setTimeout(() => {
          //   setScreen('SUCCESS');
          //   setSubmitting(false);  
          // }, 10000); // Simulate API delay
        } catch (e) {
          Alert.alert('Error', 'Failed to submit. Please try again.');
        } finally {
                 setSubmitting(false);         
        }
      }}
    />
  ) : <SuccessScreen assetCode={selectedCode} onReset={() => { setScreen('SELECT'); setSelectedCode(null); }} />}
          <SubmitLoader visible={submitting} /> 
      </View>
    </SafeAreaView>
  );
};

export default InitiateValuationFinalScreen;

// ═══════════════════════════════════════════════════════════════════════════════
//  STYLESHEET
// ════════════════════
const elevate = (n) =>
  Platform.select({
    ios:     { shadowColor: C.primary, shadowOpacity: 0.15 + n * 0.02, shadowRadius: n * 3, shadowOffset: { width: 0, height: n } },
    android: { elevation: n },
  });

const st = StyleSheet.create({
  // ── Header ──
  header: {
    backgroundColor: C.primaryDark,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 6 : 14,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  headerBubble1: { position: 'absolute', top: -28, right: -18, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.07)' },
  headerBubble2: { position: 'absolute', bottom: -32, left: 48, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerSub:     { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 1.2, flex:1,justifyContent:'center',alignItems:'center'   },
  headerTitle:   { fontSize: 18, fontWeight: '800', color: C.white },
  headerBadge:   { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 4 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: C.white },

  // ── Loan chip ──  
  loanChip: { backgroundColor: C.primaryLight, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  pillBlue: { backgroundColor: C.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  pillBlueText: { fontSize: 9, fontWeight: '800', color: C.white, letterSpacing: 0.5 },

  // ── Account card ──
  accountCard: { margin: 14, marginBottom: 0, backgroundColor: C.primaryLight, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },

  // ── Asset card ──
  assetCard: {
    backgroundColor: C.white, borderWidth: 2, borderColor: C.border, borderRadius: 16, padding: 14,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  accentBar:    { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 2, backgroundColor: C.primary },
  radioCircle:  { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.greyDark, alignItems: 'center', justifyContent: 'center' },
  radioDot:     { width: 9, height: 9, borderRadius: 5, backgroundColor: C.white },
  statusChip:   { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, marginLeft: 6, flexShrink: 0, maxWidth: 130 },
  statusChipText: { fontSize: 9, fontWeight: '700' },
  addressBox:   { backgroundColor: C.grey, borderRadius: 10, padding: 9 },
  addressText:  { fontSize: 11, color: C.textMuted, lineHeight: 16 },
  hintRow:      { borderRadius: 8, padding: 8, borderWidth: 1 },

  // ── Form: asset strip ──
  assetStrip:      { backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  assetStripLabel: { fontSize: 9, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8 },
  assetStripCode:  { fontSize: 13, fontWeight: '700', color: C.primaryDark, marginTop: 1 },
  stepErrBadge:    { backgroundColor: C.errorLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FCA5A5' },
  stepErrBadgeText: { fontSize: 11, fontWeight: '700', color: C.error },

  // ── Step bar ──
  stepBar:   { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, backgroundColor: C.white },
  stepLine:  { height: 3, borderRadius: 2, marginBottom: 4, backgroundColor: C.border },
  stepLabel: { fontSize: 9, fontWeight: '500', textAlign: 'center', color: C.greyDark },

  // ── Field components ──
  fieldWrap:    { marginBottom: 14 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.9, marginBottom: 6 },
  inputBox:     { backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  inputBoxFocus: { borderColor: C.primary, ...Platform.select({ ios: { shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) },
  inputBoxError: { borderColor: C.error,   ...Platform.select({ ios: { shadowColor: C.error,   shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  fieldIcon:    { fontSize: 15, opacity: 0.7, marginRight: 10 },
  inputText:    { fontSize: 13, color: C.text, fontWeight: '500' },
  textInput:    { flex: 1, fontSize: 13, color: C.text, paddingVertical: 0 },
  multiChip:    { backgroundColor: C.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  multiChipText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  errText:      { fontSize: 11, color: C.error, marginTop: 4 },
  hintText:     { fontSize: 11, color: C.textMuted, marginTop: 4 },

  // ── Section head ──
  sectionBar:   { width: 4, height: 20, borderRadius: 2, backgroundColor: C.primary, marginRight: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  sectionSub:   { fontSize: 11, color: C.textMuted, marginTop: 2, marginLeft: 14 },
  hr:           { height: 1, backgroundColor: C.border, marginVertical: 14 },

  // ── Soundness info ──
  soundnessCard: { backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },

  // ── Summary card ──
  summaryCard:       { backgroundColor: C.primaryDark, borderRadius: 16, padding: 18, marginTop: 8 },
  summaryCardTitle:  { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, marginBottom: 10 },
  summaryAssetBox:   { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, marginBottom: 12 },
  summaryAssetLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginBottom: 3 },
  summaryAssetCode:  { fontSize: 13, color: C.white, fontWeight: '700' },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  summaryRowLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  summaryRowValue:   { fontSize: 11, fontWeight: '600', color: C.white },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 22 : 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.white,
  },

  // ── Buttons ──
  btnPrimary: {
    paddingVertical: 18, borderRadius: 14,
    backgroundColor: C.primaryDark,
    paddingHorizontal: 30,margin:'auto',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }),
  },
  btnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  btnDisabled:    { backgroundColor: C.grey, ...Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0 } }) },
  btnOutline:     { paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { color: C.text, fontSize: 14, fontWeight: '700' },

  // ── Bottom sheet ──
  overlay:    { flex: 1, backgroundColor: 'rgba(10,20,60,0.52)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 32 : 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }, android: { elevation: 20 } }) },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.greyDark, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 4 },
  sheetTitle:  { fontSize: 15, fontWeight: '700', color: C.text },
  optionRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 13 },
  optionText:  { fontSize: 13, color: C.text, flex: 1, lineHeight: 18 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.greyDark, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  checkBox:    { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: C.greyDark, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  countBadge:  { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: C.white },
  doneBtn:     { backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  doneBtnText: { fontSize: 12, fontWeight: '700', color: C.primary },

  // ── Dialogs ──
  dialogOverlay: { flex: 1, backgroundColor: 'rgba(10,20,60,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogBox: {
    backgroundColor: C.white, borderRadius: 24, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 10 } }, android: { elevation: 20 } }),
  },
  dialogIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dialogIconEmoji:  { fontSize: 28, position: 'absolute' },
  spinRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: 'transparent', borderTopColor: C.info },
  dialogTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 10, textAlign: 'center', marginTop: 2 },
  assetChip:   { backgroundColor: C.grey, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 7, marginBottom: 12 },
  assetChipText: { fontSize: 13, fontWeight: '700', color: C.primaryDark },
  dialogBody:  { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  infoNote:    { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 20, width: '100%' },
  infoNoteText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  dialogBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 14 },

  // ── Success ──
  successIcon:      { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', borderWidth: 3, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successBadge:     { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5, marginBottom: 12 },
  successBadgeText: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1 },
  successAssetCard: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 16, marginBottom: 24, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  successCheck:     { width: 32, height: 32, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
});
