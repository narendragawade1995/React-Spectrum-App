/**
 * DispositionHistoryScreen.js
 *
 * Unsecured Disposition History — React Native equivalent of
 * agency-disposition.component (Angular).
 *
 * API parity:
 *  • List    : POST agency/getdisposition  { pageIndex, pageSize:20, ...filters }
 *  • Dropdown: GET  admin-agency/dropdownoption
 *  • Search  : GET  agency/customer?customername=xxx  (min 3 chars)
 *
 * Features:
 *  • Infinite scroll (page-based, 20 records per page)
 *  • Filter popup (DispositionFilterPopup)
 *  • Tap card → detail bottom-sheet popup (same screen, no navigation)
 */

import React, {
  useState, useRef, useCallback, useEffect, useLayoutEffect,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  StatusBar, Dimensions, Animated, PanResponder,
  Modal, ScrollView, BackHandler, Alert,Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import Api from '../../Utilities/apiService';
import { COLORS } from '../../theme/theme';
import DispositionFilterPopup from './DispositionFilterPopup';

const { height: SH, width: SW } = Dimensions.get('window');
const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.replace('Z', '');
    return new Date(clean).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.replace('Z', '');
    return new Date(clean).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

// Mirrors Angular's opendialog() data transformation exactly
const buildDetailData = (element) => {
  const el = { ...element };
  const data = {
    account_number: el.account_number,
    customer_name:  el.customer_name,
    virtual_number: el.virtual_number,
    selling_bank:   el.selling_bank,
    trust_name:     el.trustname,
    iscustomername: true,
    isfromdetail:   true,
  };

  if (el.source === 'Call') {
    el.call_date = formatDateShort(el.activity_date);
    el.call_time = el.activity_time;
  } else {
    el.Visit_date = formatDateShort(el.activity_date);
    el.Visit_time = el.activity_time;
  }

  delete el.activity_date;
  delete el.activity_time;
  delete el.createdat;
  delete el.updatedat;
  delete el.trustname;
  delete el.disposition_id;
  delete el.sub_disposition_id;
  delete el.virtual_number;
  delete el.selling_bank;

  const merged = { ...data, ...el };
  delete merged.disposition_date;
  delete merged.disposition_time;
  delete merged.creation_date;
  return merged;
};

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR HELPERS
// ─────────────────────────────────────────────────────────────────────────────
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

const getSourceStyle = (source) => {
  const s = (source || '').toLowerCase();
  if (s === 'call')
    return { bg: '#E3F2FD', col: '#1565C0', icon: 'phone' };
  if (s.includes('field') || s.includes('visit'))
    return { bg: '#E8F5E9', col: '#2E7D32', icon: 'map-marker' };
  return { bg: '#ECEFF1', col: '#546E7A', icon: 'lightning-bolt' };
};

// ═════════════════════════════════════════════════════════════════════════════
//  DETAIL ROW  (used inside the popup)
// ═════════════════════════════════════════════════════════════════════════════
const DetailRow = ({ icon, label, value, highlight = false }) => {
  if (!value && value !== 0) return null;
  return (
    <View style={det.row}>
      <View style={det.rowLeft}>
        <View style={[det.rowIcon, highlight && det.rowIconBlue]}>
          <Icon name={icon} size={13} color={highlight ? '#1565C0' : '#999'} />
        </View>
        <Text style={det.rowLabel}>{label}</Text>
      </View>
      <Text style={[det.rowValue, highlight && det.rowValueBlue]} numberOfLines={2}>
        {String(value)}
      </Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  DETAIL POPUP  (animated bottom-sheet Modal on the same screen)
// ═════════════════════════════════════════════════════════════════════════════
const DispositionDetailPopup = ({ visible, item, onClose }) => {
  const translateY      = useRef(new Animated.Value(SH)).current;
  const overlayOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && item) {
      translateY.setValue(SH);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1, duration: 280, useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, item]);

  const close = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0, duration: 220, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SH, duration: 260, useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 6,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.8) close();
        else
          Animated.spring(translateY, {
            toValue: 0, tension: 80, friction: 10, useNativeDriver: true,
          }).start();
      },
    })
  ).current;

  if (!visible || !item) return null;

  const data   = buildDetailData(item);
  const ds     = getDispStyle(data.disposition);
  const ss     = getSourceStyle(data.source);
  const isCall = !!(data.call_date || data.call_time);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      {/* Semi-transparent backdrop */}
      <Animated.View style={[det.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View style={[det.sheet, { transform: [{ translateY }] }]}>

        {/* ── Drag handle ── */}
        <View style={det.handleArea} {...panResponder.panHandlers}>
          <View style={det.handle} />
        </View>

        {/* ── Identity header card (blue, mirrors Angular dialog header) ── */}
        <View style={det.identCard}>
          <View style={det.identAvatar}>
            <Icon name="account" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={det.identName} numberOfLines={1}>
              {data.customer_name || 'Unknown Customer'}
            </Text>
            <View style={det.identMeta}>
              <Text style={det.identAcc}>{data.account_number || '—'}</Text>
              {data.disposition ? (
                <View style={[det.identDispPill, { backgroundColor: ds.bg }]}>
                  <View style={[det.identDispDot, { backgroundColor: ds.col }]} />
                  <Text style={[det.identDispText, { color: ds.col }]}>
                    {data.disposition}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          {/* Close button */}
          <TouchableOpacity style={det.closeBtn} onPress={close}>
            <Icon name="close" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        {/* ── Scrollable detail sections ── */}
        <ScrollView
          style={det.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
        >

          {/* ACCOUNT INFORMATION */}
          <View style={det.section}>
            <View style={[det.sectionHeader, { borderLeftColor: '#1565C0' }]}>
              <Icon name="card-account-details-outline" size={13} color="#1565C0" />
              <Text style={[det.sectionTitle, { color: '#1565C0' }]}>
                ACCOUNT INFORMATION
              </Text>
            </View>
            <DetailRow
              icon="identifier"
              label="Account No."
              value={data.account_number}
              highlight
            />
            <DetailRow
              icon="account-outline"
              label="Customer Name"
              value={data.customer_name}
              highlight
            />
            <DetailRow
              icon="phone-outline"
              label="Virtual Number"
              value={data.virtual_number}
            />
            <DetailRow
              icon="bank-outline"
              label="Selling Bank"
              value={data.selling_bank}
            />
            <DetailRow
              icon="shield-key-outline"
              label="Trust Name"
              value={data.trust_name}
            />
          </View>

          {/* DISPOSITION INFO */}
          <View style={det.section}>
            <View style={[det.sectionHeader, { borderLeftColor: ds.col }]}>
              <Icon name="clipboard-text-outline" size={13} color={ds.col} />
              <Text style={[det.sectionTitle, { color: ds.col }]}>
                DISPOSITION INFO
              </Text>
            </View>
            <DetailRow
              icon="clipboard-edit-outline"
              label="Disposition"
              value={data.disposition}
              highlight
            />
            <DetailRow
              icon="comment-text-outline"
              label="Sub Disposition"
              value={data.sub_disposition}
            />
            <DetailRow
              icon="text-long"
              label="Remarks"
              value={data.remarks}
            />
            <DetailRow
              icon="cash-multiple"
              label="PTP Amount"
              value={data.ptp_amount}
            />
            <DetailRow
              icon="calendar-check"
              label="PTP Date"
              value={data.ptp_date}
            />
          </View>

          {/* CALL / FIELD VISIT DETAILS */}
          <View style={det.section}>
            <View style={[det.sectionHeader, { borderLeftColor: ss.col }]}>
              <Icon name={ss.icon} size={13} color={ss.col} />
              <Text style={[det.sectionTitle, { color: ss.col }]}>
                {isCall ? 'CALL DETAILS' : 'FIELD VISIT DETAILS'}
              </Text>
            </View>
            {isCall ? (
              <>
                <DetailRow icon="calendar-outline" label="Call Date" value={data.call_date} />
                <DetailRow icon="clock-outline"    label="Call Time" value={data.call_time} />
              </>
            ) : (
              <>
                <DetailRow icon="calendar-outline" label="Visit Date" value={data.Visit_date} />
                <DetailRow icon="clock-outline"    label="Visit Time" value={data.Visit_time} />
              </>
            )}
            <DetailRow icon="lightning-bolt-outline" label="Type"   value={data.type} />
            <DetailRow icon="source-branch"          label="Source" value={data.source} />
          </View>

          {/* OFFICER DETAILS */}
          <View style={det.section}>
            <View style={[det.sectionHeader, { borderLeftColor: '#546E7A' }]}>
              <Icon name="account-tie-outline" size={13} color="#546E7A" />
              <Text style={[det.sectionTitle, { color: '#546E7A' }]}>
                OFFICER DETAILS
              </Text>
            </View>
            <DetailRow icon="account-circle-outline"    label="Officer Name" value={data.username} />
            <DetailRow icon="badge-account-outline"     label="User ID"      value={data.user_id} />
            <DetailRow icon="office-building-outline"   label="Zone"         value={data.zone} />
            <DetailRow icon="map-marker-radius-outline" label="Branch"       value={data.branch} />
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  DISPOSITION CARD
// ═════════════════════════════════════════════════════════════════════════════
const InfoCell = ({ icon, label, value }) => (
  <View style={dc.infoCell}>
    <View style={dc.infoCellTop}>
      <Icon name={icon} size={10} color="#AAA" />
      <Text style={dc.infoCellLabel}>{label}</Text>
    </View>
    <Text style={dc.infoCellValue} numberOfLines={1}>{value || '—'}</Text>
  </View>
);

const DispositionCard = React.memo(({ item, onPress }) => {
  const ds = getDispStyle(item.disposition);
  const ss = getSourceStyle(item.source);

  return (
    <TouchableOpacity style={dc.wrapper} onPress={onPress} activeOpacity={0.85}>
      <View style={[dc.accentBar, { backgroundColor: ds.bar }]} />
      <View style={dc.body}>

        {/* Row 1: Account No + Date */}
        <View style={dc.topRow}>
          <View style={dc.accRef}>
            <View style={dc.accIconWrap}>
              <Icon name="card-account-details-outline" size={13} color="#1565C0" />
            </View>
            <View>
              <Text style={dc.accLabel}>Account No.</Text>
              <Text style={dc.accValue}>{item.account_number || '—'}</Text>
            </View>
          </View>
          <View style={dc.dateChip}>
            <Icon name="calendar-outline" size={11} color="#888" />
            <Text style={dc.dateText}>{formatDate(item.activity_date)}</Text>
          </View>
        </View>

        {/* Customer name */}
        <Text style={dc.customerName} numberOfLines={1}>
          {item.customer_name || 'Unknown Customer'}
        </Text>

        {/* Disposition badge */}
        {item.disposition ? (
          <View style={[dc.dispBadge, { backgroundColor: ds.bg }]}>
            <View style={[dc.dispDot, { backgroundColor: ds.col }]} />
            <Text style={[dc.dispText, { color: ds.col }]}>{item.disposition}</Text>
          </View>
        ) : null}

        {/* Info grid */}
        <View style={dc.infoGrid}>
          <InfoCell icon="shield-key-outline"     label="Trust"        value={item.trustname} />
          <InfoCell icon="bank-outline"           label="Selling Bank" value={item.selling_bank} />
          <InfoCell icon="lightning-bolt-outline" label="Type"         value={item.type || 'Spectrum'} />
          <InfoCell icon="account-outline"        label="Officer"      value={item.username} />
        </View>

        {/* Footer */}
        <View style={dc.footer}>
          <View style={[dc.sourcePill, { backgroundColor: ss.bg }]}>
            <Icon name={ss.icon} size={10} color={ss.col} />
            <Text style={[dc.sourceText, { color: ss.col }]}>{item.source || '—'}</Text>
          </View>
          <View style={dc.timeRow}>
            <Icon name="clock-outline" size={11} color="#888" />
            <Text style={dc.timeText}>{item.activity_time || '—'}</Text>
          </View>
          <View style={dc.tapHint}>
            <Icon name="gesture-tap" size={11} color="#CCC" />
            <Text style={dc.tapHintText}>Tap for details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <View style={sc.skeletonCard}>
    <View style={[sc.skel, { width: '40%', height: 11, marginBottom: 10 }]} />
    <View style={[sc.skel, { width: '70%', height: 15, marginBottom: 12 }]} />
    <View style={[sc.skel, { width: '30%', height: 22, borderRadius: 10, marginBottom: 12 }]} />
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[sc.skel, { flex: 1, height: 46, borderRadius: 10 }]} />
      ))}
    </View>
  </View>
);

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
const DispositionHistoryScreenUnsecured = ({ navigation }) => {
  const nav = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // ── Data ──────────────────────────────────────────────────────────────
  const [records, setRecords]           = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── Pagination ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]       = useState(0);
  const [hasMore, setHasMore]               = useState(true);
  const [isLoadingMore, setIsLoadingMore]   = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [silentRefreshing, setSilentRefreshing] = useState(false);

  // ── Filter ────────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible]   = useState(false);
  const [activeFilters, setActiveFilters]   = useState({});
  const [isFiltered, setIsFiltered]         = useState(false);
  const [dropdownOption, setDropdownOption] = useState({});

  // ── Detail popup ──────────────────────────────────────────────────────
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem]   = useState(null);

  const handleBack = () => {
    if (detailVisible) { setDetailVisible(false); return true; }
    navigation.goBack();
    return true;
  };

  // ── API: fetch records ────────────────────────────────────────────────
  const fetchRecords = useCallback(async (page, filters = {}, silent = false) => {
    try {
      if (!silent) {
        page === 0 ? setInitialLoading(true) : setIsLoadingMore(true);
      } else {
        setSilentRefreshing(true);
      }

      const params = { ...filters };
      if (params.status === 'All') delete params.status;

      const body = { pageIndex: page, pageSize: PAGE_SIZE, ...params };
      const res  = await Api.sendRequest(body, 'agency/getdisposition');
      if (!res.ok) return;

      const data       = await res.json();
      const newRecords = data.ArrayOfResponse || [];
      setTotalRecords(data.TotalRecords || 0);

      setRecords(prev => page === 0 ? newRecords : [...prev, ...newRecords]);
      setCurrentPage(page);
      setHasMore(newRecords.length >= PAGE_SIZE);
    } catch (e) {
      console.error('fetchRecords error:', e);
    } finally {
      setInitialLoading(false);
      setIsLoadingMore(false);
      setSilentRefreshing(false);
    }
  }, []);

  // ── API: load dropdown options ────────────────────────────────────────
  const loadDropdowns = useCallback(async () => {
    try {
      const res = await Api.get('admin-agency/dropdownoption');
      setDropdownOption(res || {});
    } catch (e) {
      console.error('loadDropdowns error:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRecords(0);
    loadDropdowns();
    BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => BackHandler.removeEventListener('hardwareBackPress', handleBack);
  }, []));

  // ── Filter handlers ───────────────────────────────────────────────────
  const handleApplyFilter = useCallback(async (params) => {
    setActiveFilters(params);
    setFilterVisible(false);
    setIsFiltered(Object.keys(params).length > 0);
    await fetchRecords(0, params);
  }, [fetchRecords]);

  const handleClearAll = useCallback(() => {
    setActiveFilters({});
    setIsFiltered(false);
    fetchRecords(0);
  }, [fetchRecords]);

  const handleRemoveChip = useCallback((key) => {
    const next = { ...activeFilters };
    delete next[key];
    setActiveFilters(next);
    setIsFiltered(Object.keys(next).length > 0);
    fetchRecords(0, next);
  }, [activeFilters, fetchRecords]);

  // ── Infinite scroll ───────────────────────────────────────────────────
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && !initialLoading) {
      fetchRecords(currentPage + 1, activeFilters);
    }
  }, [hasMore, isLoadingMore, initialLoading, currentPage, activeFilters, fetchRecords]);

  // ── Card tap ──────────────────────────────────────────────────────────
  const handleCardPress = useCallback((item) => {
    setSelectedItem(item);
    setDetailVisible(true);
  }, []);

  const activeFilterCount = Object.keys(activeFilters).length;

  const chipLabel = (key, val) => {
    if (key === 'startDate' || key === 'EndDate') return formatDate(val);
    if (Array.isArray(val)) return val.join(', ');
    return val;
  };

  // ═════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <View style={sc.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* ── Header ──────────────────────────────────── */}
      <View style={sc.header}>
        <View style={sc.headerTop}>
          <View style={sc.headerLeft}>
            <TouchableOpacity onPress={() => nav.goBack()} style={sc.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={sc.headerTitle}>Disposition History</Text>
              <Text style={sc.headerSub}>
                {totalRecords} records
                {silentRefreshing
                  ? <Text style={sc.refreshText}> · Refreshing…</Text>
                  : null}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[sc.filterBtn, activeFilterCount > 0 && sc.filterBtnActive]}
            onPress={() => setFilterVisible(true)}
          >
            <Icon
              name="filter-variant"
              size={20}
              color={activeFilterCount > 0 ? '#1565C0' : '#fff'}
            />
            {activeFilterCount > 0 && (
              <View style={sc.filterBadge}>
                <Text style={sc.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={sc.statsRow}>
          <View style={sc.statChip}>
            <Text style={sc.statVal}>{totalRecords}</Text>
            <Text style={sc.statLbl}>Total Records</Text>
          </View>
          <View style={sc.statChip}>
            <Text style={sc.statVal}>{records.length}</Text>
            <Text style={sc.statLbl}>Loaded</Text>
          </View>
          <View style={sc.statChip}>
            <Text style={sc.statVal}>{activeFilterCount}</Text>
            <Text style={sc.statLbl}>Active Filters</Text>
          </View>
        </View>
      </View>

      {/* ── Active Filter Chips ──────────────────────── */}
      {activeFilterCount > 0 && (
        <View style={sc.chipsWrap}>
          <FlatList
            data={Object.entries(activeFilters).filter(([_, v]) => v)}
            keyExtractor={([k]) => k}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sc.chipsContent}
            renderItem={({ item: [key, val] }) => (
              <View style={sc.chip}>
                <Text style={sc.chipText} numberOfLines={1}>
                  {chipLabel(key, val)}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveChip(key)}>
                  <Icon name="close" size={12} color="#1565C0" />
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              <TouchableOpacity style={sc.clearAllChip} onPress={handleClearAll}>
                <Text style={sc.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* ── Record List ─────────────────────────────── */}
      {initialLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          renderItem={() => <SkeletonCard />}
          showsVerticalScrollIndicator={false}
        />
      ) : records.length === 0 ? (
        <View style={sc.empty}>
          <Icon name="clipboard-text-outline" size={64} color="#ddd" />
          <Text style={sc.emptyTitle}>No Dispositions Found</Text>
          <Text style={sc.emptyText}>
            {isFiltered ? 'Try clearing filters.' : 'No disposition records available.'}
          </Text>
          {isFiltered && (
            <TouchableOpacity style={sc.clearBtn} onPress={handleClearAll}>
              <Text style={sc.clearBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, idx) =>
            (item?.id || item?.disposition_id || idx).toString()
          }
          renderItem={({ item }) => (
            <DispositionCard item={item} onPress={() => handleCardPress(item)} />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          windowSize={10}
          ListFooterComponent={
            isLoadingMore ? (
              <SkeletonCard />
            ) : !hasMore && records.length > 0 ? (
              <View style={sc.endRow}>
                <View style={sc.endLine} />
                <Text style={sc.endText}>All records loaded</Text>
                <View style={sc.endLine} />
              </View>
            ) : null
          }
        />
      )}

      {/* ── Detail Popup (bottom sheet, same screen) ── */}
      <DispositionDetailPopup
        visible={detailVisible}
        item={selectedItem}
        onClose={() => setDetailVisible(false)}
      />

      {/* ── Filter Popup ───────────────────────────── */}
      <DispositionFilterPopup
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
        initialFilters={activeFilters}
        dropdownOption={dropdownOption}
      />
    </View>
  );
};

// ─── Detail popup styles ────────────────────────────────────────────────────
const det = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#F4F6FB',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: SH * 0.90,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  handleArea: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D0D4E0' },

  // Identity card
  identCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#0D47A1',
    elevation: 4,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  identAvatar: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  identName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  identMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  identAcc:  { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  identDispPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7,
  },
  identDispDot: { width: 5, height: 5, borderRadius: 3 },
  identDispText: {
    fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  scroll: { flex: 1 },

  // Section card
  section: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingBottom: 4,
    paddingTop: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4FF',
    borderLeftWidth: 3,
    paddingLeft: 8,
  },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },

  // Detail row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FB',
    gap: 8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rowIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowIconBlue: { backgroundColor: '#E8EEF9' },
  rowLabel: { fontSize: 12, color: '#999', fontWeight: '500', flex: 1 },
  rowValue: {
    fontSize: 12, color: '#1A1A2E', fontWeight: '600',
    textAlign: 'right', maxWidth: SW * 0.48, flexShrink: 0,
  },
  rowValueBlue: { color: '#1565C0' },
});

// ─── Card styles ─────────────────────────────────────────────────────────────
const dc = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16, marginVertical: 7,
    elevation: 3,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8,
    overflow: 'hidden',
  },
  accentBar: { width: 4, flexShrink: 0 },
  body: { flex: 1, padding: 14 },

  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 6,
  },
  accRef: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#E8EEF9',
    justifyContent: 'center', alignItems: 'center',
  },
  accLabel: { fontSize: 10, color: '#AAA', fontWeight: '500' },
  accValue: { fontSize: 13, color: '#1A1A2E', fontWeight: '700', marginTop: 1 },

  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F7FB', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  dateText: { fontSize: 10, color: '#666', fontWeight: '500' },

  customerName: {
    fontSize: 15, fontWeight: '700', color: '#1A1A2E',
    marginBottom: 7, letterSpacing: 0.1,
  },
  dispBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 10, marginBottom: 10,
  },
  dispDot: { width: 5, height: 5, borderRadius: 3 },
  dispText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  infoCell: { width: '47.5%', backgroundColor: '#F7F9FC', borderRadius: 10, padding: 8 },
  infoCellTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  infoCellLabel: { fontSize: 9, color: '#AAA', fontWeight: '500' },
  infoCellValue: { fontSize: 11, color: '#333', fontWeight: '600' },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F2F7',
  },
  sourcePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  sourceText: { fontSize: 10, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  timeText: { fontSize: 10, color: '#888', fontWeight: '500' },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapHintText: { fontSize: 9, color: '#CCC', fontWeight: '500' },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 20,
    paddingTop: 20, paddingBottom: 16,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  refreshText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },

  filterBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  filterBtnActive: { backgroundColor: '#fff' },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: '#E53935',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0D47A1',
  },
  filterBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statVal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  chipsWrap: { paddingVertical: 8 },
  chipsContent: { paddingHorizontal: 16, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E8EEF9',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginRight: 8,
    borderWidth: 1, borderColor: '#BBDEFB',
    maxWidth: 140,
  },
  chipText: { fontSize: 11, color: '#1565C0', fontWeight: '600' },
  clearAllChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: '#FFCDD2', backgroundColor: '#FFF3F3',
  },
  clearAllText: { fontSize: 11, color: '#E53935', fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#aaa', marginTop: 16, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 20 },
  clearBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, backgroundColor: '#1565C0',
  },
  clearBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  skeletonCard: {
    backgroundColor: '#fff', borderRadius: 18,
    marginHorizontal: 16, marginVertical: 7,
    padding: 16, elevation: 2,
  },
  skel: { backgroundColor: '#EAECF4', borderRadius: 6 },

  endRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 24, paddingHorizontal: 20,
  },
  endLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  endText: { fontSize: 12, color: '#aaa', fontWeight: '500' },
});

export default DispositionHistoryScreenUnsecured;
