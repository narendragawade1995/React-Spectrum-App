/**
 * DispositionHistoryScreen.js
 * ─────────────────────────────────────────────────────────────
 * Features:
 *  • Shows ALL dispositions on load (no account required)
 *  • Server-side pagination → 20 records per page, infinite scroll
 *  • Skeleton loader on initial load + on loading next page
 *  • Account search (autocomplete after 3 chars, API debounced)
 *  • Filter bottom sheet: Trust, Disposition, Source, Zone,
 *    Selling Bank, Date range, UserType, Username
 *  • Active filter chips (removable)
 *  • Tap card → Detail bottom sheet
 *
 * ─── Dependencies ────────────────────────────────────────────
 *  npm install @react-navigation/native react-native-safe-area-context
 *
 * ─── Usage ───────────────────────────────────────────────────
 *  import DispositionHistoryScreen from './DispositionHistoryScreen';
 *  // Add to your navigator stack
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  Animated,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Api from "../Utilities/apiService";

const { width: SW } = Dimensions.get('window');

/* ─────────────────────────────────────────────────────────────
   CONFIG — set your real API base URL here
───────────────────────────────────────────────────────────── */
const BASE_URL = 'https://testappapi.edelweissarc.in/api/v3/'; // ← replace with actual base URL

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const PAGE_SIZE = 20;

const USER_TYPES = ['All', 'Telecaller', 'Fos'];

const CHIP_COLORS = {
  'Willing to discuss': { bg: '#DBEAFE', text: '#1D4ED8', dot: '#2563EB' },
  'Promise to pay':     { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  'Dispute':            { bg: '#FEF3C7', text: '#B45309', dot: '#D97706' },
  'Not contactable':    { bg: '#F3E8FF', text: '#7C3AED', dot: '#8B5CF6' },
  'Broken promise':     { bg: '#FEE2E2', text: '#B91C1C', dot: '#DC2626' },
  'Paid':               { bg: '#CCFBF1', text: '#0F766E', dot: '#14B8A6' },
};

const getChip = d =>
  CHIP_COLORS[d] || { bg: '#E2E8F0', text: '#475569', dot: '#64748B' };

const typeIcon = t =>
  t === 'Field Visit' ? '🏠' : t === 'Phone Call' ? '📞' : '📋';

/* ─────────────────────────────────────────────────────────────
   FIELD MAPPER — maps Angular API response fields → RN card fields
───────────────────────────────────────────────────────────── */
const mapRecord = item => ({
  id:              item.id || item.dis_id || Math.random().toString(),
  accountNo:       item.account_number   || '—',
  borrowerName:    item.customer_name    || '—',
  virtual:         item.virtual_number   || '—',
  sellingBank:     item.selling_bank     || '—',
  trustName:       item.trustname        || '—',
  disposition:     item.disposition      || '—',
  subDisposition:  item.reason || item.sub_disposition || '—',
  type:            item.type             || '—',
  personContacted: item.person_contacted || '—',
  defaultReason:   item.default_reason   || '—',
  callBackDate:    item.call_back_date   || '—',
  date:            item.activity_date    || '—',
  time:            item.activity_time || item.disposition_time || '—',
  userName:        item.username         || '—',
  source:          item.source           || '—',
  hasSiteVisitImage: item.site_visit_image === 1,
});

/* ─────────────────────────────────────────────────────────────
   REAL API FUNCTIONS
   (mirrors Angular's diposition/getdisposition + helpers)
───────────────────────────────────────────────────────────── */

/**
 * fetchDispositions — server-side paginated list
 * Angular endpoint: POST diposition/getdisposition
 * Angular params:   pageIndex (0-based), pageSize 20, sortcolumn "id", type "Field Visit"
 */
const fetchDispositions = async params => {
  const body = {
    pageIndex:              params.page - 1, // Angular uses 0-based index
    pageSize:               params.pageSize,
    sortcolumn:             'id',
    type:                   'Field Visit',
    totalRecords:           params.totalRecords || 0,
    // Filters
    account_number:         params.accountNo    || undefined,
    customer_name:          params.customerName || undefined,
    trustname:              params.trustName    || undefined,
    selling_bank:           params.sellingBank  || undefined,
    disposition:            params.disposition  || undefined,
    source:                 params.source       || undefined,
    zone:                   params.zone         || undefined,
    start_disposition_date: params.startDate    || undefined,
    end_disposition_date:   params.endDate      || undefined,
    username:               params.username     || undefined,
  };

  // const response = await fetch(`${BASE_URL}diposition/getdisposition`, {
  //   method:  'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body:    JSON.stringify(body),
  // });

       const response =  await Api.sendRequest( body, 'diposition/getdisposition')

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();

  return {
    data:       (data.ArrayOfResponse || []).map(mapRecord),
    totalCount: data.TotalRecords || 0,
  };
};

/**
 * searchAccounts — autocomplete search (account number + borrower name)
 * Angular endpoint: POST secure_borrowerdetails/secure_borrowerdetailsData
 */
const searchAccounts = async query => {
  const response = await fetch(
    `${BASE_URL}secure_borrowerdetails/secure_borrowerdetailsData`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ accountno: query, from: 'search' }),
    },
  );

  if (!response.ok) return [];
  const data = await response.json();
  const items = data.ArrayOfResponse || [];

  // Deduplicate by account_no
  const seen   = new Set();
  const unique = [];
  items.forEach(r => {
    if (!seen.has(r.account_no)) {
      seen.add(r.account_no);
      unique.push({ id: r.account_no, name: r.customer_name });
    }
  });
  return unique;
};

/**
 * fetchDropdownData — master dropdown lists
 * Angular endpoint: GET secure_borrowerdetails/dropdowndata
 * Returns: trustList, dispositionList, sourceList, zoneList, sellingBankList
 */
const fetchDropdownData = async () => {
  try {
    // const response = await fetch(`${BASE_URL}secure_borrowerdetails/dropdowndata`);
        const data = await Api.get('secure_borrowerdetails/dropdowndata',{})
    // if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // const data = await response.json();

    const trustList = (data.trustlist || []).map(t => ({
      label: t.trust_code,
      value: t.trust_name,
    }));

    const dispositionList = (data.disposition_master || [])
      .filter(d => d.disposition_name !== 'Site Visit')
      .map(d => d.disposition_name);
    dispositionList.push('Others');

    const sourceList  = (data.source       || []).map(s => s.source_name);
    const zoneList    = (data.zone_master  || []).map(z => z.zone_name);
    const sellingBankList = [
      ...new Set((data.trustlist || []).map(t => t.selling_bank).filter(Boolean)),
    ];

    return { trustList, dispositionList, sourceList, zoneList, sellingBankList };
  } catch (e) {
    console.error('fetchDropdownData error', e);
    return {
      trustList: [], dispositionList: [], sourceList: [],
      zoneList: [], sellingBankList: [],
    };
  }
};

/**
 * fetchUserList — combined user list (spetrumUser + LmsUser + SecureUser)
 * Angular endpoint: POST user/getUserListLms
 */
const fetchUserList = async () => {
  try {
    // const response = await fetch(`${BASE_URL}user/getUserListLms`, {
    //   method:  'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body:    JSON.stringify({}),
    // });
    const response = await Api.sendRequest({}, 'user/getUserListLms')
    if (!response.ok) return [];
    const data    = await response.json();
    const combined = [
      ...(data.spetrumUser || []),
      ...(data.LmsUser     || []),
      ...(data.SecureUser  || []),
    ];
    // Deduplicate by user_name
    const seen   = new Set();
    const unique = [];
    combined.forEach(u => {
      if (!seen.has(u.user_name)) {
        seen.add(u.user_name);
        unique.push(u.user_name);
      }
    });
    return unique;
  } catch (e) {
    console.error('fetchUserList error', e);
    return [];
  }
};

/* ─────────────────────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────────────────────── */
function SkeletonCard() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.skTopBar} />
      <View style={styles.skRow}>
        <View style={{ flex: 1 }}>
          <View style={[styles.skLine, { width: '60%', height: 11, marginBottom: 6 }]} />
          <View style={[styles.skLine, { width: '45%', height: 15 }]} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.skLine, { width: 80, height: 11, marginBottom: 6 }]} />
          <View style={[styles.skLine, { width: 50, height: 10 }]} />
        </View>
      </View>
      <View style={styles.skChipRow}>
        <View style={[styles.skLine, { width: 120, height: 26, borderRadius: 22 }]} />
        <View style={[styles.skLine, { width: 90, height: 26, borderRadius: 22, marginLeft: 8 }]} />
      </View>
      <View style={styles.skFooterRow}>
        <View style={[styles.skLine, { width: 80, height: 11 }]} />
        <View style={[styles.skLine, { width: 70, height: 11 }]} />
      </View>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────
   DISPOSITION CARD
───────────────────────────────────────────────────────────── */
function DispositionCard({ item, onPress }) {
  const chip = getChip(item.disposition);
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => onPress(item)} style={styles.card}>
      {/* Top color strip */}
      <View style={[styles.cardStrip, { backgroundColor: chip.dot }]} />

      {/* Header row */}
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.cardAccNo} numberOfLines={1}>{item.accountNo}</Text>
          <Text style={styles.cardBorrower}>{item.borrowerName}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardDate}>{item.date}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
      </View>

      {/* Chips row */}
      <View style={styles.chipsRow}>
        <View style={[styles.dispChip, { backgroundColor: chip.bg }]}>
          <View style={[styles.dot, { backgroundColor: chip.dot }]} />
          <Text style={[styles.dispChipText, { color: chip.text }]}>{item.disposition}</Text>
        </View>
        <View style={styles.typeChip}>
          <Text style={styles.typeChipText}>{typeIcon(item.type)} {item.type}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>👤</Text>
          <Text style={styles.metaText}>{item.personContacted}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⏱</Text>
          <Text style={styles.metaText}>{item.userName}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.trustBadge}>{item.trustName}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────────────────────
   DETAIL BOTTOM SHEET
───────────────────────────────────────────────────────────── */
function DetailSheet({ record, onClose }) {
  const insets    = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(800)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(onClose);
  };

  if (!record) return null;
  const chip = getChip(record.disposition);

  const rows = [
    ['Account No',       record.accountNo],
    ['Customer Name',    record.borrowerName],
    ['Virtual Number',   record.virtual],
    ['Selling Bank',     record.sellingBank],
    ['Trust Name',       record.trustName],
    ['Disposition',      record.disposition],
    ['Sub Disposition',  record.subDisposition],
    ['Source',           record.source],
    ['Type',             record.type],
    ['Person Contacted', record.personContacted],
    ['Default Reason',   record.defaultReason],
    ['Call Back Date',   record.callBackDate],
    ['Date & Time',      `${record.date} · ${record.time}`],
    ['User Name',        record.userName],
  ];

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Colored banner */}
          <View style={[styles.detailBanner, { backgroundColor: chip.dot }]}>
            <View>
              <Text style={styles.detailBannerLabel}>DISPOSITION</Text>
              <Text style={styles.detailBannerValue}>{record.disposition}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Account pill */}
          <View style={styles.detailAccPill}>
            <Text style={styles.detailAccNo}>{record.accountNo}</Text>
            <Text style={styles.detailAccName}>{record.borrowerName}</Text>
          </View>

          {/* Rows */}
          <ScrollView
            style={styles.detailScroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {rows.map(([label, val], i) => (
              <View
                key={label}
                style={[
                  styles.detailRow,
                  i < rows.length - 1 && styles.detailRowBorder,
                ]}
              >
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{val || '—'}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   FILTER BOTTOM SHEET
   — includes all Angular filter fields:
     Trust, Disposition, Source, Zone, Selling Bank,
     Date range, User Type, Username, Virtual Acc, Customer Name
───────────────────────────────────────────────────────────── */
function FilterSheet({ filters, dropdownData, userList, onApply, onClose }) {
  const insets    = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(800)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [lf, setLf] = useState({ ...filters });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(onClose);
  };

  const handleApply = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => { onApply(lf); onClose(); });
  };

  const s = (k, v) => setLf(p => ({ ...p, [k]: v }));

  const ChipButton = ({ label, active, onPress, style: extraStyle }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.filterChipBtn, active && styles.filterChipBtnActive, extraStyle]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const {
    trustList      = [],
    dispositionList= [],
    sourceList     = [],
    zoneList       = [],
    sellingBankList= [],
  } = dropdownData || {};

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, maxHeight: '88%', transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.filterHeader}>
            <View>
              <Text style={styles.filterTitle}>More Filters</Text>
              <Text style={styles.filterSubtitle}>Refine your results</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: '#64748B' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false} bounces={false}>

            {/* ── Trust Name ── */}
            {trustList.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Trust Name</Text>
                <View style={styles.chipWrap}>
                  <ChipButton label="All" active={!lf.trustName} onPress={() => s('trustName', '')} />
                  {trustList.map(t => (
                    <ChipButton
                      key={t.label || t}
                      label={t.label || t}
                      active={lf.trustName === (t.value || t)}
                      onPress={() => s('trustName', lf.trustName === (t.value || t) ? '' : (t.value || t))}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── Disposition ── */}
            {dispositionList.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Disposition</Text>
                <View style={styles.chipWrap}>
                  {dispositionList.map(d => {
                    const active = lf.disposition === d;
                    const c      = getChip(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        activeOpacity={0.75}
                        onPress={() => s('disposition', active ? '' : d)}
                        style={[
                          styles.filterChipBtn,
                          active && { backgroundColor: c.bg, borderColor: c.dot },
                        ]}
                      >
                        <Text style={[styles.filterChipText, active && { color: c.text, fontWeight: '700' }]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Source ── */}
            {sourceList.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Source</Text>
                <View style={styles.chipWrap}>
                  <ChipButton label="All" active={!lf.source} onPress={() => s('source', '')} />
                  {sourceList.map(src => (
                    <ChipButton
                      key={src}
                      label={src}
                      active={lf.source === src}
                      onPress={() => s('source', lf.source === src ? '' : src)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── Zone ── */}
            {zoneList.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Zone</Text>
                <View style={styles.chipWrap}>
                  <ChipButton label="All" active={!lf.zone} onPress={() => s('zone', '')} />
                  {zoneList.map(z => (
                    <ChipButton
                      key={z}
                      label={z}
                      active={lf.zone === z}
                      onPress={() => s('zone', lf.zone === z ? '' : z)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── Selling Bank ── */}
            {sellingBankList.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Selling Bank</Text>
                <View style={styles.chipWrap}>
                  <ChipButton label="All" active={!lf.sellingBank} onPress={() => s('sellingBank', '')} />
                  {sellingBankList.map(bank => (
                    <ChipButton
                      key={bank}
                      label={bank}
                      active={lf.sellingBank === bank}
                      onPress={() => s('sellingBank', lf.sellingBank === bank ? '' : bank)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── User Type ── */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>User Type</Text>
              <View style={styles.chipWrap}>
                {USER_TYPES.map(ut => (
                  <ChipButton
                    key={ut}
                    label={ut}
                    active={lf.userType === ut || (ut === 'All' && !lf.userType)}
                    onPress={() => s('userType', ut === 'All' ? '' : ut)}
                  />
                ))}
              </View>
            </View>

            {/* ── Username ── */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Username</Text>
              <View style={styles.filterInputWrap}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Enter username…"
                  placeholderTextColor="#94A3B8"
                  value={lf.username}
                  onChangeText={v => s('username', v)}
                  autoCapitalize="none"
                />
              </View>
              {/* Quick-select from userList */}
              {userList.length > 0 && lf.username.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {userList
                    .filter(u => u.toLowerCase().includes(lf.username.toLowerCase()))
                    .slice(0, 8)
                    .map(u => (
                      <TouchableOpacity
                        key={u}
                        onPress={() => s('username', u)}
                        style={[styles.filterChipBtn, lf.username === u && styles.filterChipBtnActive]}
                      >
                        <Text style={[styles.filterChipText, lf.username === u && styles.filterChipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              )}
            </View>

            {/* ── Start Date ── */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Start Activity Date</Text>
              <View style={styles.filterInputWrap}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={lf.startDate}
                  onChangeText={v => s('startDate', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* ── End Date ── */}
            <View style={[styles.filterSection, { marginBottom: 8 }]}>
              <Text style={styles.filterSectionLabel}>End Activity Date</Text>
              <View style={[
                styles.filterInputWrap,
                !lf.startDate && { opacity: 0.45 },
              ]}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={lf.endDate}
                  onChangeText={v => s('endDate', v)}
                  keyboardType="numeric"
                  editable={!!lf.startDate}
                />
              </View>
            </View>

            {/* ── Virtual Account No ── */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Virtual Account No.</Text>
              <View style={styles.filterInputWrap}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Enter virtual number…"
                  placeholderTextColor="#94A3B8"
                  value={lf.virtual}
                  onChangeText={v => s('virtual', v)}
                />
              </View>
            </View>

            {/* ── Customer Name ── */}
            <View style={[styles.filterSection, { marginBottom: 8 }]}>
              <Text style={styles.filterSectionLabel}>Customer Name</Text>
              <View style={styles.filterInputWrap}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Enter customer name…"
                  placeholderTextColor="#94A3B8"
                  value={lf.customerName}
                  onChangeText={v => s('customerName', v)}
                />
              </View>
            </View>

          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                setLf({
                  trustName: '', disposition: '', virtual: '', customerName: '',
                  source: '', zone: '', sellingBank: '', startDate: '',
                  endDate: '', username: '', userType: '',
                })
              }
              style={styles.btnClear}
            >
              <Text style={styles.btnClearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={handleApply} style={styles.btnApply}>
              <Text style={styles.btnApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────────────────────── */
export default function DispositionHistoryScreenNew({ navigation }) {
  const insets = useSafeAreaInsets();

  // ── Search state
  const [query,     setQuery]     = useState('');
  const [ddResults, setDdResults] = useState([]);
  const [ddVisible, setDdVisible] = useState(false);
  const [selAcc,    setSelAcc]    = useState(null); // { id, name }
  const searchTimer               = useRef(null);

  // ── Filter state (extended to match Angular fields)
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeF,    setActiveF]    = useState({
    trustName:   '',
    disposition: '',
    virtual:     '',
    customerName:'',
    source:      '',
    zone:        '',
    sellingBank: '',
    startDate:   '',
    endDate:     '',
    username:    '',
    userType:    '',
  });

  // ── Master dropdown data (from API)
  const [dropdownData, setDropdownData] = useState({
    trustList:      [],
    dispositionList:[],
    sourceList:     [],
    zoneList:       [],
    sellingBankList:[],
  });
  const [userList, setUserList] = useState([]);

  // ── List state
  const [records,     setRecords]     = useState([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [initLoading, setInitLoading] = useState(true);  // first page skeleton
  const [moreLoading, setMoreLoading] = useState(false); // subsequent page skeleton
  const [hasMore,     setHasMore]     = useState(true);

  // ── Detail state
  const [selRecord, setSelRecord] = useState(null);

  // ── Hide navigation header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // ── Load master dropdown data once on mount
  useEffect(() => {
    fetchDropdownData().then(setDropdownData);
    fetchUserList().then(setUserList);
  }, []);

  // ── Build API params from current filter + account
  const buildParams = useCallback(
    (pg, currentTotalRecords = 0) => ({
      page:          pg,
      pageSize:      PAGE_SIZE,
      totalRecords:  currentTotalRecords,
      accountNo:     selAcc?.id            || '',
      customerName:  activeF.customerName,
      trustName:     activeF.trustName,
      sellingBank:   activeF.sellingBank,
      disposition:   activeF.disposition,
      source:        activeF.source,
      zone:          activeF.zone,
      startDate:     activeF.startDate,
      endDate:       activeF.endDate,
      username:      activeF.username,
      virtual:       activeF.virtual,
    }),
    [selAcc, activeF],
  );

  // ── Load first page (reset list)
  const loadFirstPage = useCallback(async () => {
    setInitLoading(true);
    setRecords([]);
    setPage(1);
    setHasMore(true);
    try {
      const { data, totalCount: total } = await fetchDispositions(buildParams(1, 0));
      setRecords(data);
      setTotalCount(total);
      setHasMore(data.length === PAGE_SIZE && total > PAGE_SIZE);
    } catch (e) {
      console.error('fetchDispositions first page error', e);
    } finally {
      setInitLoading(false);
    }
  }, [buildParams]);

  // ── Load next page (append — triggered by onEndReached)
  const loadNextPage = useCallback(async () => {
    if (moreLoading || !hasMore || initLoading) return;
    const nextPage = page + 1;
    setMoreLoading(true);
    try {
      const { data, totalCount: total } = await fetchDispositions(
        buildParams(nextPage, totalCount),
      );
      setRecords(prev => {
        const merged = [...prev, ...data];
        setHasMore(merged.length < total);
        return merged;
      });
      setTotalCount(total);
      setPage(nextPage);
    } catch (e) {
      console.error('fetchDispositions next page error', e);
    } finally {
      setMoreLoading(false);
    }
  }, [moreLoading, hasMore, initLoading, page, buildParams, totalCount]);

  // ── Reload whenever filters or account selection changes
  useEffect(() => {
    loadFirstPage();
  }, [selAcc, activeF]);

  // ── Account search autocomplete (debounced 400ms, min 3 chars)
  useEffect(() => {
    if (query.length < 3) {
      setDdResults([]);
      setDdVisible(false);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchAccounts(query);
        setDdResults(results);
        setDdVisible(results.length > 0);
      } catch (e) {
        console.error('searchAccounts error', e);
      }
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const selectAccount = acc => {
    setSelAcc(acc);
    setQuery('');
    setDdVisible(false);
  };

  const clearAccount = () => {
    setSelAcc(null);
    setQuery('');
    setDdVisible(false);
  };

  const removeFilter = key => {
    setActiveF(prev => ({ ...prev, [key]: '' }));
  };

  // Count of active filters (for badge on filter button)
  const activeCnt =
    Object.values(activeF).filter(Boolean).length + (selAcc ? 1 : 0);

  // ── Summary counts for header strip (computed from loaded records)
  const dispSummary = useMemo(() => {
    const counts = {};
    records.forEach(r => {
      if (r.disposition && r.disposition !== '—') {
        counts[r.disposition] = (counts[r.disposition] || 0) + 1;
      }
    });
    return Object.entries(counts).slice(0, 4);
  }, [records]);

  /* ── Render footer: skeleton cards while loading next page,
        or "all records loaded" end-of-list message ── */
  const renderFooter = () => {
    if (initLoading) return null;
    if (moreLoading) {
      return (
        <View style={styles.pageLoaderWrap}>
          {[1, 2].map(i => <SkeletonCard key={i} />)}
        </View>
      );
    }
    if (!hasMore && records.length > 0) {
      return (
        <View style={styles.endWrap}>
          <View style={styles.endLine} />
          <Text style={styles.endText}>All {totalCount} records loaded</Text>
          <View style={styles.endLine} />
        </View>
      );
    }
    return null;
  };

  /* ── Render list header: skeleton cards on first load, or count bar ── */
  const renderListHeader = () => {
    if (initLoading) {
      return (
        <View>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </View>
      );
    }
    return (
      <View style={styles.resultMeta}>
        <Text style={styles.resultMetaText}>
          {totalCount} Record{totalCount !== 1 ? 's' : ''}
          {selAcc ? `  ·  ${selAcc.name}` : '  ·  All Accounts'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B86" />

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Decorative circles */}
        <View style={styles.decCircleLarge} />
        <View style={styles.decCircleSmall} />

        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.backBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            {/* <Text style={styles.headerSub}>Recovery App</Text> */}
            <Text style={styles.headerTitle}>Disposition History</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerTotalLabel}>TOTAL</Text>
            <Text style={styles.headerTotalNum}>
              {initLoading ? '…' : totalCount}
            </Text>
          </View>
        </View>

        {/* Summary strip — disposition breakdown from loaded records */}
        {/* {dispSummary.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryStrip}
          >
            {dispSummary.map(([disp, cnt]) => (
              <View key={disp} style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel} numberOfLines={1}>
                  {disp.split(' ')[0]}
                </Text>
                <Text style={styles.summaryCardCount}>{cnt}</Text>
              </View>
            ))}
          </ScrollView>
        )} */}
      </View>

      {/* ── Body ── */}
      <View style={[styles.body, { paddingBottom: insets.bottom }]}>

        {/* Search + Filter row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            {selAcc ? (
              <View style={styles.selectedAccPill}>
                <Text style={styles.selectedAccNo} numberOfLines={1}>{selAcc.id}</Text>
                <Text style={styles.selectedAccName}>{selAcc.name}</Text>
              </View>
            ) : (
              <TextInput
                style={styles.searchInput}
                placeholder="Search account no. or name…"
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                onFocus={() => ddResults.length && setDdVisible(true)}
              />
            )}
            {(query.length > 0 || selAcc) && (
              <TouchableOpacity onPress={clearAccount} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setFilterOpen(true)}
            style={styles.filterBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.filterBtnIcon}>≡</Text>
            {activeCnt > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCnt}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Account search dropdown */}
        {ddVisible && ddResults.length > 0 && (
          <View style={styles.dropdown}>
            <Text style={styles.ddHeading}>Accounts Found</Text>
            {ddResults.map((acc, i) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => selectAccount(acc)}
                activeOpacity={0.7}
                style={[styles.ddItem, i > 0 && styles.ddItemBorder]}
              >
                <View style={styles.ddIconWrap}>
                  <Text style={styles.ddItemIcon}>📋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ddAccNo}>{acc.id}</Text>
                  <Text style={styles.ddAccName}>{acc.name}</Text>
                </View>
                <Text style={styles.ddChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active filter chips */}
        {activeCnt > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeChipsRow}
          >
            {selAcc && (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText} numberOfLines={1}>📋 {selAcc.name}</Text>
                <TouchableOpacity onPress={clearAccount} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.activeChipX}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {Object.entries(activeF).filter(([, v]) => v).map(([k, v]) => (
              <View key={k} style={styles.activeChip}>
                <Text style={styles.activeChipText} numberOfLines={1}>{v}</Text>
                <TouchableOpacity onPress={() => removeFilter(k)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.activeChipX}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Main list with infinite scroll */}
        <FlatList
          data={initLoading ? [] : records}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <DispositionCard item={item} onPress={setSelRecord} />
          )}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          /* ── Infinite scroll: fires when user is 30% from bottom ── */
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !initLoading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No Records Found</Text>
                <Text style={styles.emptySub}>
                  Try adjusting your filters or clearing the account selection
                </Text>
              </View>
            ) : null
          }
        />
      </View>

      {/* Modals */}
      {filterOpen && (
        <FilterSheet
          filters={activeF}
          dropdownData={dropdownData}
          userList={userList}
          onApply={lf => setActiveF({ ...lf })}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {selRecord && (
        <DetailSheet
          record={selRecord}
          onClose={() => setSelRecord(null)}
        />
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLES  (unchanged from original design)
───────────────────────────────────────────────────────────── */
const C = {
  navy:      '#0D3B86',
  blue:      '#1454B8',
  blueLight: '#1A6FE0',
  bg:        '#F0F4FB',
  white:     '#FFFFFF',
  border:    '#E2EAF6',
  text:      '#0F172A',
  textMid:   '#374151',
  textSub:   '#64748B',
  textMute:  '#94A3B8',
  gold:      '#F59E0B',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.navy,
  },

  /* ── Header ── */
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 18,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  decCircleLarge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -30,
    right: -20,
  },
  decCircleSmall: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: 20,
    right: 50,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    marginTop: -2,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerTotalLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTotalNum: {
    color: C.gold,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
  },
  summaryStrip: {
    gap: 8,
    paddingRight: 4,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 80,
  },
  summaryCardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  summaryCardCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  /* ── Body ── */
  body: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 14,
    marginTop: -14,
  },

  /* ── Search ── */
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    zIndex: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
  },
  selectedAccPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedAccNo: {
    fontSize: 10,
    fontWeight: '700',
    color: C.blue,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    maxWidth: 140,
  },
  selectedAccName: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '600',
    flex: 1,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { color: C.textMute, fontSize: 11, fontWeight: '700' },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  filterBtnIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  /* ── Dropdown ── */
  dropdown: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 10,
    zIndex: 10,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
  ddHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textMute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  ddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  ddItemBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  ddIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ddItemIcon: { fontSize: 15 },
  ddAccNo: { fontSize: 11, fontWeight: '700', color: C.blue },
  ddAccName: { fontSize: 12, color: C.textSub, fontWeight: '500', marginTop: 1 },
  ddChevron: { color: C.textMute, fontSize: 18 },

  /* ── Active filter chips ── */
  activeChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    maxWidth: 160,
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    flex: 1,
  },
  activeChipX: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93C5FD',
    lineHeight: 16,
  },

  /* ── Result meta bar ── */
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  resultMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  resultMetaDate: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMute,
  },

  /* ── Card ── */
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    padding: 14,
    paddingTop: 18,
  },
  cardStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardAccNo: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blue,
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  cardBorrower: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.2,
  },
  cardDate: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSub,
    textAlign: 'right',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textMute,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  dispChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 22,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dispChipText: { fontSize: 11, fontWeight: '700' },
  typeChip: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeChipText: { fontSize: 11, fontWeight: '600', color: C.textSub },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 9,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 11, fontWeight: '600', color: C.textSub },
  metaDivider: { width: 1, height: 12, backgroundColor: C.border },
  trustBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chevron: { color: '#CBD5E1', fontSize: 18, fontWeight: '600', marginLeft: 2 },

  /* ── Skeleton ── */
  skTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#E2EAF6',
  },
  skRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skLine: { backgroundColor: '#E2EAF6' },
  skChipRow: { flexDirection: 'row', marginBottom: 12 },
  skFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },

  /* ── Pagination footer ── */
  pageLoaderWrap: { paddingTop: 4 },
  endWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  endLine: { flex: 1, height: 1, backgroundColor: C.border },
  endText: { fontSize: 11, fontWeight: '700', color: C.textMute, letterSpacing: 0.3 },

  /* ── Empty state ── */
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 46, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.textMute, textAlign: 'center', lineHeight: 20, fontWeight: '500' },

  /* ── List content ── */
  listContent: { paddingBottom: 30 },

  /* ── Modal / Sheet ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,20,50,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F8FAFD',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  /* ── Detail sheet ── */
  detailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 14,
    borderRadius: 16,
    padding: 14,
  },
  detailBannerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  detailBannerValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  detailAccPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    marginHorizontal: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
    gap: 8,
  },
  detailAccNo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.2,
  },
  detailAccName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSub,
    marginLeft: 'auto',
  },
  detailScroll: { paddingHorizontal: 14 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    gap: 12,
  },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    width: 130,
    paddingTop: 1,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    textAlign: 'right',
    flex: 1,
    lineHeight: 18,
  },

  /* ── Filter sheet ── */
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EEF3FB',
  },
  filterTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  filterSubtitle: { fontSize: 11, color: C.textMute, fontWeight: '500', marginTop: 1 },
  filterSection: { paddingHorizontal: 20, marginTop: 18 },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: C.white,
  },
  filterChipBtnActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.textSub },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  filterInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: '#EEF3FB',
  },
  btnClear: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnClearText: { fontSize: 14, fontWeight: '700', color: C.textSub },
  btnApply: {
    flex: 2,
    backgroundColor: C.blue,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnApplyText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
