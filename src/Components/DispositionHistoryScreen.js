/**
 * DispositionHistoryScreen.js
 * ─────────────────────────────────────────────────────────────
 * Features:
 *  • Shows ALL dispositions on load (no account required)
 *  • Server-side pagination → 20 records per page, infinite scroll
 *  • Skeleton loader on initial load + on loading next page
 *  • Account search (autocomplete after 3 chars, API debounced)
 *  • Filter bottom sheet: Trust Name, Disposition, Virtual Acc, Customer Name
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
  useMemo,useLayoutEffect
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

const { width: SW } = Dimensions.get('window');

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const PAGE_SIZE = 20;

const DISPOSITIONS = [
  'Willing to discuss',
  'Promise to pay',
  'Dispute',
  'Not contactable',
  'Broken promise',
  'Paid',
];

const TRUST_NAMES = ['H89', 'H90', 'H91', 'H92', 'H93'];

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
   MOCK API  — replace these with your real API calls
   All functions return Promises that resolve { data, totalCount }
───────────────────────────────────────────────────────────── */

// Huge mock dataset (60 records) to demonstrate pagination
const _generateMockRecords = () => {
  const accounts = [
    { accountNo: 'HL/0045/H/19/100024', borrowerName: 'ASHA DEVI',     virtual: 'EARH89ASHA1035942',   trustName: 'H89', sellingBank: 'Poonawalla Housing Finance Ltd' },
    { accountNo: 'HL/0045/H/19/100025', borrowerName: 'RAMESH KUMAR',  virtual: 'EARH89RAMESH103600',  trustName: 'H90', sellingBank: 'Poonawalla Housing Finance Ltd' },
    { accountNo: 'HL/0045/H/19/100026', borrowerName: 'PRIYA SHARMA',  virtual: 'EARH89PRIYA1036100',  trustName: 'H91', sellingBank: 'Poonawalla Housing Finance Ltd' },
    { accountNo: 'HL/0032/H/20/200010', borrowerName: 'SURESH PATEL',  virtual: 'EARH89SURESH200010',  trustName: 'H92', sellingBank: 'Poonawalla Housing Finance Ltd' },
    { accountNo: 'HL/0032/H/20/200011', borrowerName: 'NEHA GUPTA',    virtual: 'EARH89NEHA2000115',   trustName: 'H92', sellingBank: 'Poonawalla Housing Finance Ltd' },
    { accountNo: 'HL/0019/H/21/300001', borrowerName: 'VIKRAM SINGH',  virtual: 'EARH89VIKRAM300001',  trustName: 'H93', sellingBank: 'Poonawalla Housing Finance Ltd' },
  ];
  const subDisps = ['Need some time to pay','Will arrange funds','Will pay by month end','Phone switched off','Salary credit pending','Account mismatch','Full payment received','Did not pay as promised'];
  const defaultReasons = ['Intentional defaulter','Financial difficulty','Temporary cashflow','Unknown','Salary delay','Dispute','Resolved','Broke promise'];
  const types = ['Field Visit', 'Phone Call'];
  const persons = ['Borrower', 'Co-borrower', 'None'];
  const days = ['28 Sep 2024','01 Oct 2024','03 Oct 2024','05 Oct 2024','08 Oct 2024','10 Oct 2024','12 Oct 2024','14 Oct 2024','15 Oct 2024','16 Oct 2024'];
  const times = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','14:00','14:30','15:00','15:45','16:00','16:20'];

  const records = [];
  for (let i = 0; i < 60; i++) {
    const acc = accounts[i % accounts.length];
    const disp = DISPOSITIONS[i % DISPOSITIONS.length];
    records.push({
      id: i + 1,
      ...acc,
      disposition: disp,
      subDisposition: subDisps[i % subDisps.length],
      date: days[i % days.length],
      time: times[i % times.length],
      userName: i % 3 === 0 ? 'fielduser' : 'appuser',
      defaultReason: defaultReasons[i % defaultReasons.length],
      type: types[i % types.length],
      personContacted: persons[i % persons.length],
      callBackDate: i % 7 === 0 ? '—' : days[(i + 3) % days.length],
    });
  }
  return records;
};

const MOCK_DB = _generateMockRecords();

/**
 * fetchDispositions — server-side paginated list
 * @param {object} params  { page, pageSize, accountNo, disposition, trustName, virtual, customerName }
 * @returns {Promise<{ data: array, totalCount: number }>}
 */
const fetchDispositions = (params) =>
  new Promise(resolve => {
    setTimeout(() => {
      let filtered = [...MOCK_DB];
      if (params.accountNo)    filtered = filtered.filter(r => r.accountNo === params.accountNo);
      if (params.disposition)  filtered = filtered.filter(r => r.disposition === params.disposition);
      if (params.trustName)    filtered = filtered.filter(r => r.trustName === params.trustName);
      if (params.virtual)      filtered = filtered.filter(r => r.virtual.toLowerCase().includes(params.virtual.toLowerCase()));
      if (params.customerName) filtered = filtered.filter(r => r.borrowerName.toLowerCase().includes(params.customerName.toLowerCase()));

      const start = (params.page - 1) * params.pageSize;
      const data  = filtered.slice(start, start + params.pageSize);
      resolve({ data, totalCount: filtered.length });
    }, 1200); // simulate network delay
  });

/**
 * searchAccounts — autocomplete search
 * @param {string} query
 * @returns {Promise<array>}
 */
const searchAccounts = (query) =>
  new Promise(resolve => {
    setTimeout(() => {
      const q = query.toLowerCase();
      const unique = [];
      const seen   = new Set();
      MOCK_DB.forEach(r => {
        if (!seen.has(r.accountNo) && (r.accountNo.toLowerCase().includes(q) || r.borrowerName.toLowerCase().includes(q))) {
          seen.add(r.accountNo);
          unique.push({ id: r.accountNo, name: r.borrowerName });
        }
      });
      resolve(unique);
    }, 400);
  });

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
        <View style={[styles.skLine, { width: 90,  height: 26, borderRadius: 22, marginLeft: 8 }]} />
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
  const insets      = useSafeAreaInsets();
  const slideAnim   = useRef(new Animated.Value(800)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;

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
    ['Sub Disposition',  record.subDisposition],
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
───────────────────────────────────────────────────────────── */
function FilterSheet({ filters, onApply, onClose }) {
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

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, maxHeight: '82%', transform: [{ translateY: slideAnim }] },
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
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Trust Name</Text>
              <View style={styles.chipWrap}>
                {['All', ...TRUST_NAMES].map(t => {
                  const val = t === 'All' ? '' : t;
                  return (
                    <ChipButton
                      key={t}
                      label={t}
                      active={lf.trustName === val}
                      onPress={() => s('trustName', val)}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Disposition</Text>
              <View style={styles.chipWrap}>
                {DISPOSITIONS.map(d => {
                  const active = lf.disposition === d;
                  const c = getChip(d);
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
              onPress={() => setLf({ trustName: '', disposition: '', virtual: '', customerName: '' })}
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
export default function DispositionHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // ── Search state
  const [query,       setQuery]       = useState('');
  const [ddResults,   setDdResults]   = useState([]);
  const [ddVisible,   setDdVisible]   = useState(false);
  const [selAcc,      setSelAcc]      = useState(null); // { id, name }
  const searchTimer                   = useRef(null);

  // ── Filter state
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [activeF,     setActiveF]     = useState({ trustName: '', disposition: '', virtual: '', customerName: '' });

  // ── List state
  const [records,     setRecords]     = useState([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [initLoading, setInitLoading] = useState(true);  // first page skeleton
  const [moreLoading, setMoreLoading] = useState(false); // subsequent pages
  const [hasMore,     setHasMore]     = useState(true);
useLayoutEffect(() => {
              navigation.setOptions({
                headerShown: false,
              });
            }, [navigation]);
  // ── Detail state
  const [selRecord,   setSelRecord]   = useState(null);

  // ── Build API params from current filter + account
  const buildParams = useCallback((pg) => ({
    page:         pg,
    pageSize:     PAGE_SIZE,
    accountNo:    selAcc?.id      || '',
    disposition:  activeF.disposition,
    trustName:    activeF.trustName,
    virtual:      activeF.virtual,
    customerName: activeF.customerName,
  }), [selAcc, activeF]);

  // ── Load first page (reset list)
  const loadFirstPage = useCallback(async () => {
    setInitLoading(true);
    setRecords([]);
    setPage(1);
    setHasMore(true);
    try {
      const { data, totalCount: total } = await fetchDispositions(buildParams(1));
      setRecords(data);
      setTotalCount(total);
      setHasMore(data.length === PAGE_SIZE && total > PAGE_SIZE);
    } catch (e) {
      console.error('fetchDispositions error', e);
    } finally {
      setInitLoading(false);
    }
  }, [buildParams]);

  // ── Load next page (append to list)
  const loadNextPage = useCallback(async () => {
    if (moreLoading || !hasMore || initLoading) return;
    const nextPage = page + 1;
    setMoreLoading(true);
    try {
      const { data, totalCount: total } = await fetchDispositions(buildParams(nextPage));
      setRecords(prev => [...prev, ...data]);
      setTotalCount(total);
      setPage(nextPage);
      setHasMore(records.length + data.length < total);
    } catch (e) {
      console.error('loadNextPage error', e);
    } finally {
      setMoreLoading(false);
    }
  }, [moreLoading, hasMore, initLoading, page, buildParams, records.length]);

  // ── Reload whenever filters or account changes
  useEffect(() => { loadFirstPage(); }, [selAcc, activeF]);

  // ── Account search autocomplete
  useEffect(() => {
    if (query.length < 3) { setDdResults([]); setDdVisible(false); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      const results = await searchAccounts(query);
      setDdResults(results);
      setDdVisible(results.length > 0);
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

  const activeCnt = Object.values(activeF).filter(Boolean).length + (selAcc ? 1 : 0);

  // ── Summary counts for header strip
  const dispSummary = useMemo(() => {
    const counts = {};
    DISPOSITIONS.forEach(d => { counts[d] = 0; });
    MOCK_DB.forEach(r => { if (counts[r.disposition] !== undefined) counts[r.disposition]++; });
    return Object.entries(counts).slice(0, 4);
  }, []);

  // ── Render footer (pagination loader or end message)
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

  // ── Render list header (skeletons on init OR actual count bar)
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
        <Text style={styles.resultMetaDate}>15 Oct 2024</Text>
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
            <Text style={styles.headerSub}>Recovery App</Text>
            <Text style={styles.headerTitle}>Disposition History</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerTotalLabel}>TOTAL</Text>
            <Text style={styles.headerTotalNum}>{MOCK_DB.length}</Text>
          </View>
        </View>

        {/* Summary strip */}
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

        {/* List */}
        <FlatList
          data={initLoading ? [] : records}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <DispositionCard item={item} onPress={setSelRecord} />
          )}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
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
   STYLES
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
    // paddingVertical: 10,
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
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  filterBtnIcon: { color: '#fff', fontSize: 20, fontWeight: '800' },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  /* ── Dropdown ── */
  dropdown: {
    position: 'absolute',
    top: 74,
    left: 14,
    right: 72,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 100,
    overflow: 'hidden',
  },
  ddHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMute,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  ddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  ddItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ddIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ddItemIcon: { fontSize: 15 },
  ddAccNo: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blue,
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  ddAccName: { fontSize: 12, color: C.textMid, fontWeight: '600' },
  ddChevron: { color: C.border, fontSize: 18, fontWeight: '600' },

  /* ── Active filter chips ── */
  activeChipsRow: {
    gap: 7,
    paddingBottom: 10,
    paddingRight: 4,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 22,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 4,
    maxWidth: 180,
  },
  activeChipText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  activeChipX: { fontSize: 14, fontWeight: '800', color: '#1D4ED8', lineHeight: 16 },

  /* ── Result meta ── */
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultMetaDate: { fontSize: 11, color: C.textMute, fontWeight: '600' },

  /* ── Card ── */
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
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
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  cardAccNo: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blue,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cardBorrower: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.2,
  },
  cardDate: { fontSize: 12, fontWeight: '600', color: C.textMid },
  cardTime: { fontSize: 11, color: C.textMute, marginTop: 2, textAlign: 'right' },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  dispChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 22,
    gap: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  dispChipText: { fontSize: 12, fontWeight: '700' },
  typeChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipText: { fontSize: 11, fontWeight: '600', color: C.textSub },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 11 },
  metaText: { fontSize: 11, color: C.textMute, fontWeight: '500' },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 2,
  },
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
