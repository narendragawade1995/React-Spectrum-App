/**
 * AllocatedAccountsScreen.js
 *
 * Modern redesign of the loan recovery field officer screen.
 * Features:
 *  - Server-side pagination (20 per page)
 *  - Search with 3+ char debounced auto-suggest
 *  - Filter popup (borrower name, bank, trust, virtual no., disposition, zone, resolution type)
 *  - Account card with 8 quick-action buttons
 *  - Tap card → AccountDetailsPopup
 *  - useFocusEffect: show cached data immediately, silently refresh in background
 *  - Skeleton loaders on initial load and pagination
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Animated,
  BackHandler,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { CommonActions } from '@react-navigation/native';

import Api from '../Utilities/apiService';
import commonfun from '../Utilities/CommonFun';
import { setSecure, setSecureFilter } from '../Redux/Slicer/UserSlice';
import AccountDeatilsPopup from './account_deatils_popup';
import FilterPopup from './FilterPopupNew';
import { COLORS } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_SIZE = 20;

// ─── Debounce helper ────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ─── Skeleton card ───────────────────────────────────────────────────────────
const SkeletonCard = () => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.card, { opacity: anim }]}>
      <View style={sk.row}>
        <View style={sk.badge} />
        <View style={sk.lineShort} />
      </View>
      <View style={sk.lineLong} />
      <View style={sk.lineMed} />
      <View style={[sk.row, { marginTop: 12 }]}>
        {[...Array(4)].map((_, i) => <View key={i} style={sk.dot} />)}
      </View>
    </Animated.View>
  );
};

const sk = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 7,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  badge: { width: 70, height: 20, borderRadius: 10, backgroundColor: '#E8EEF9' },
  lineShort: { width: 100, height: 12, borderRadius: 6, backgroundColor: '#E8EEF9' },
  lineLong: { width: '90%', height: 14, borderRadius: 6, backgroundColor: '#EAEAEA', marginBottom: 8 },
  lineMed: { width: '60%', height: 12, borderRadius: 6, backgroundColor: '#EAEAEA' },
  dot: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8EEF9' },
});

// ─── Action button config ─────────────────────────────────────────────────────
const ACTIONS = [
  { key: 'disposition', label: 'Disposition', icon: 'clipboard-edit-outline', color: '#E53935', route: 'DispositionNew' },
  { key: 'account_details', label: 'Acc. Details', icon: 'file-document-outline', color: '#1565C0', route: 'AccDetails' },
  { key: 'view_360', label: '360° View', icon: 'rotate-360', color: '#6A1B9A', route: 'Account360' },
  { key: 'contact', label: 'Contact', icon: 'phone-outline', color: '#00838F', route: 'Contacts' },
  { key: 'address', label: 'Address', icon: 'map-marker-outline', color: '#EF6C00', route: 'Address' },
  { key: 'customer_list', label: 'Customers', icon: 'account-group-outline', color: '#2E7D32', route: 'CustomerList' },
  { key: 'liveliness', label: 'Liveliness', icon: 'pulse', color: '#C62828', route: 'Liveliness' },
  { key: 'resolution', label: 'Resolution', icon: 'lightbulb-on-outline', color: '#F9A825', route: 'Resolution' },
];

// ─── Status badge color map ───────────────────────────────────────────────────
const dispositionColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('paid') || s.includes('settled')) return { bg: '#E8F5E9', text: '#2E7D32' };
  if (s.includes('dispute')) return { bg: '#FFF3E0', text: '#E65100' };
  if (s.includes('ptp') || s.includes('promise')) return { bg: '#E3F2FD', text: '#1565C0' };
  if (s.includes('rnr') || s.includes('no response')) return { bg: '#FCE4EC', text: '#AD1457' };
  return { bg: '#F3E5F5', text: '#6A1B9A' };
};

// ─── Account Card ─────────────────────────────────────────────────────────────
const AccountCard = React.memo(({ item, onPress, onAction }) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const dColor = dispositionColor(item.disposition);

  const formatCurrency = (amt) => {
    if (!amt) return '₹0';
    const n = parseFloat(amt);
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <View style={card.wrapper}>
      {/* Accent left bar */}
      <View style={[card.accentBar, { backgroundColor: dColor.text }]} />

      <View style={card.body}>
        {/* Top Row: Account No + Status badge */}
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={card.topRow}>
          <View style={card.acctRow}>
            <View style={card.acctIconWrap}>
              <Icon name="card-account-details-outline" size={14} color="#1565C0" />
            </View>
            <View>
              <Text style={card.acctLabel}>Account No.</Text>
              <Text style={card.acctValue}>{item.account_no || '—'}</Text>
            </View>
          </View>
          {item.disposition ? (
            <View style={[card.badge, { backgroundColor: dColor.bg }]}>
              <Text style={[card.badgeText, { color: dColor.text }]}>
                {item.disposition.length > 12 ? item.disposition.slice(0, 12) + '…' : item.disposition}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Borrower Name */}
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
          <Text style={card.borrowerName} numberOfLines={1}>{item.customer_name || 'Unknown Borrower'}</Text>
        </TouchableOpacity>

        {/* Info Grid */}
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
          <View style={card.infoGrid}>
            <InfoCell icon="bank-outline" label="Bank" value={item.bank_name} />
            <InfoCell icon="shield-key-outline" label="Trust" value={item.trust} />
            <InfoCell icon="currency-inr" label="EMI Overdue" value={formatCurrency(item.over_dues)} highlight />
            <InfoCell icon="calendar-clock" label="Alloc. Date" value={commonfun.formatDate(item.allocation_date)} />
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={card.divider} />

        {/* Action Row */}
        <View style={card.actionSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={card.actionScroll}>
            {ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={card.actionBtn}
                onPress={() => onAction(action.route, item)}
                activeOpacity={0.7}
              >
                <View style={[card.actionIconWrap, { backgroundColor: action.color + '18' }]}>
                  <Icon name={action.icon} size={17} color={action.color} />
                </View>
                <Text style={[card.actionLabel, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
});

const InfoCell = ({ icon, label, value, highlight = false }) => (
  <View style={card.infoCell}>
    <Icon name={icon} size={12} color={highlight ? '#1565C0' : '#999'} />
    <Text style={card.infoLabel}>{label}</Text>
    <Text style={[card.infoValue, highlight && card.infoValueHighlight]} numberOfLines={1}>
      {value || '—'}
    </Text>
  </View>
);

const card = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 7,
    elevation: 3,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  accentBar: { width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  body: { flex: 1, padding: 14 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  acctRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acctIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8EEF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acctLabel: { fontSize: 10, color: '#999', fontWeight: '500' },
  acctValue: { fontSize: 13, color: '#1A1A2E', fontWeight: '700', marginTop: 1 },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 120,
  },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  borrowerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  infoCell: {
    flexBasis: '47%',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    padding: 8,
    gap: 2,
  },
  infoLabel: { fontSize: 10, color: '#aaa', fontWeight: '500', marginTop: 2 },
  infoValue: { fontSize: 12, color: '#333', fontWeight: '600' },
  infoValueHighlight: { color: '#1565C0' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  actionSection: {},
  actionScroll: { gap: 8, paddingRight: 4 },
  actionBtn: { alignItems: 'center', gap: 5, minWidth: 54 },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 },
});

// ─── Active Filter Chips ──────────────────────────────────────────────────────
const FilterChips = ({ filters, onRemove, onClearAll }) => {
  const entries = Object.entries(filters).filter(([_, v]) => v);
  if (!entries.length) return null;
  return (
    <View style={chips.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chips.scroll}>
        {entries.map(([key, value]) => (
          <View key={key} style={chips.chip}>
            <Text style={chips.chipText} numberOfLines={1}>{value}</Text>
            <TouchableOpacity onPress={() => onRemove(key)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
              <Icon name="close" size={12} color="#1565C0" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={chips.clearAll} onPress={onClearAll}>
          <Text style={chips.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const chips = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 4 },
  scroll: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8EEF9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  chipText: { fontSize: 11, color: '#1565C0', fontWeight: '600', maxWidth: 90 },
  clearAll: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF3F3',
  },
  clearAllText: { fontSize: 11, color: '#E53935', fontWeight: '600' },
});

// ─── Search Suggestion Item ───────────────────────────────────────────────────
const SuggestionItem = ({ item, onPress }) => (
  <TouchableOpacity style={sug.item} onPress={() => onPress(item)} activeOpacity={0.7}>
    <Icon name="magnify" size={14} color="#aaa" />
    <View style={{ flex: 1 }}>
      <Text style={sug.accountNo}>{item.account_no}</Text>
      {item.customer_name ? <Text style={sug.name} numberOfLines={1}>{item.customer_name}</Text> : null}
    </View>
    <Icon name="arrow-top-left" size={14} color="#ccc" />
  </TouchableOpacity>
);

const sug = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  accountNo: { fontSize: 14, color: '#1A1A2E', fontWeight: '600' },
  name: { fontSize: 12, color: '#888', marginTop: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AllocatedAccountsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const nav = useNavigation();
  const { secure: { borrowerdetails = [], filterborrowerlist = [] } } = useSelector(state => state.USER);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initial load state
  const [initialLoading, setInitialLoading] = useState(true);
  const [silentRefreshing, setSilentRefreshing] = useState(false);

  // Search
  const [query, setQuery] = useState('');
  const [suggestVisible, setSuggestVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filter
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [isFiltered, setIsFiltered] = useState(false);

  // Details popup
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Navigation actions ──────────────────────────────────────────────────
  const handleNavigate = (route, item) => {
    navigation.navigate(route, item);
  };

  const handleBack = () => {
    Alert.alert('Exit App', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  };

  // ── API Calls ───────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async (page, params = {}, silent = false) => {
    try {
      if (!silent) {
        page === 0 ? setInitialLoading(true) : setIsLoadingMore(true);
      } else {
        setSilentRefreshing(true);
      }

      const body = {
        pageIndex: page,
        pageSize: PAGE_SIZE,
        isfromCovex: false,
        ...params,
      };

      const res = await Api.sendRequest(body, 'secure_borrowerdetails/secure_borrowerdetailsData');
      if (!res.ok) {
        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'HomeDrawer', state: { routes: [{ name: 'Login' }] } }],
        }));
        return;
      }
      const data = await res.json();
      const records = data.ArrayOfResponse || [];

      if (page === 0 || silent) {
        dispatch(setSecure(records));
      } else {
        dispatch(setSecure([...borrowerdetails, ...records]));
      }
      setCurrentPage(page);
      setHasMore(records.length >= PAGE_SIZE);
    } catch (e) {
      console.error('fetchAccounts error:', e);
    } finally {
      setInitialLoading(false);
      setIsLoadingMore(false);
      setSilentRefreshing(false);
    }
  }, [borrowerdetails, dispatch, navigation]);

  // ── Focus effect: show cache, silently refresh ──────────────────────────
  useFocusEffect(useCallback(() => {
    const hasCachedData = borrowerdetails.length > 0;
    if (!hasCachedData) {
      // First time: full load
      setInitialLoading(true);
      fetchAccounts(0);
    } else {
      // Already have data: show immediately, refresh silently in background
      setInitialLoading(false);
      fetchAccounts(0, {}, true);
    }

    setQuery('');
    setSuggestVisible(false);
    setIsFiltered(false);
    dispatch(setSecureFilter([]));

    BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBack);
    };
  }, []));

  // ── Search debounced ────────────────────────────────────────────────────
  const debouncedSearch = useRef(debounce(async (text) => {
    if (text.length < 3) {
      dispatch(setSecureFilter([]));
      setSuggestVisible(false);
      setSearchLoading(false);
      return;
    }
    try {
      const res = await Api.sendRequest(
        { accountno: text, from: 'search' },
        'secure_borrowerdetails/secure_borrowerdetailsData'
      );
      if (!res.ok) return;
      const data = await res.json();
      const records = data.ArrayOfResponse || [];
      dispatch(setSecureFilter(records));
      setSuggestVisible(records.length > 0);
    } catch (e) {
      console.error('search error:', e);
    } finally {
      setSearchLoading(false);
    }
  }, 500)).current;

  const handleSearchChange = (text) => {
    setQuery(text);
    if (text.length >= 3) {
      setSearchLoading(true);
      debouncedSearch(text);
    } else {
      setSearchLoading(false);
      setSuggestVisible(false);
      dispatch(setSecureFilter([]));
    }
  };

  const handleSuggestionSelect = (item) => {
    setIsFiltered(true);
    dispatch(setSecureFilter([item]));
    setQuery(item.account_no);
    setSuggestVisible(false);
  };

  const handleSearchClear = () => {
    setQuery('');
    setSuggestVisible(false);
    setIsFiltered(false);
    dispatch(setSecureFilter([]));
  };

  // ── Filter ──────────────────────────────────────────────────────────────
  const handleApplyFilter = async (params) => {
    setActiveFilters(params);
    setFilterVisible(false);
    if (!Object.keys(params).length) {
      setIsFiltered(false);
      fetchAccounts(0);
      return;
    }
    try {
      setInitialLoading(true);
      const res = await Api.sendRequest(
        { pageIndex: 0, pageSize: PAGE_SIZE, ...params },
        'secure_borrowerdetails/secure_borrowerdetailsData'
      );
      if (!res.ok) return;
      const data = await res.json();
      const records = data.ArrayOfResponse || [];
      dispatch(setSecureFilter(records));
      setIsFiltered(true);
    } catch (e) {
      console.error('filter error:', e);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleRemoveFilterChip = (key) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    if (!Object.keys(newFilters).length) {
      setIsFiltered(false);
      fetchAccounts(0);
    } else {
      handleApplyFilter(newFilters);
    }
  };

  const handleClearAllFilters = () => {
    setActiveFilters({});
    setIsFiltered(false);
    fetchAccounts(0);
  };

  // ── Pagination ──────────────────────────────────────────────────────────
  const handleEndReached = () => {
    if (hasMore && !isLoadingMore && !isFiltered) {
      fetchAccounts(currentPage + 1);
    }
  };

  // ── Displayed data ──────────────────────────────────────────────────────
  const displayData = isFiltered ? filterborrowerlist : borrowerdetails;
  const activeFilterCount = Object.keys(activeFilters).length;

 
  return (
    <SafeAreaView style={sc.safe} edges={['top']}>
      {/* ── Top Header ─────────────────────────────────────── */}
      {/* ── Search Bar ─────────────────────────────────────── */}
      <View style={sc.searchSection}>
        <View style={sc.searchBox}>
          <Icon name="magnify" size={20} color={query.length > 0 ? '#1565C0' : '#aaa'} />
          <TextInput
            style={sc.searchInput}
            placeholder="Search by loan / account number..."
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchLoading && (
            <View style={sc.searchSpinner}>
              <Icon name="loading" size={16} color="#1565C0" />
            </View>
          )}
          {query.length > 0 && !searchLoading && (
            <TouchableOpacity onPress={handleSearchClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[sc.filterBtn, activeFilterCount > 0 && sc.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="filter-variant" size={20} color={activeFilterCount > 0 ? '#fff' : '#1565C0'} />
          {activeFilterCount > 0 && (
            <View style={sc.filterBadge}>
              <Text style={sc.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Autocomplete Dropdown ──────────────────────────── */}
      {suggestVisible && filterborrowerlist.length > 0 && (
        <View style={sc.suggestBox}>
          <FlatList
            data={filterborrowerlist.slice(0, 8)}
            keyExtractor={(item, i) => item?.account_id?.toString() + i.toString()}
            renderItem={({ item }) => (
              <SuggestionItem item={item} onPress={handleSuggestionSelect} />
            )}
            keyboardShouldPersistTaps="always"
            scrollEnabled={filterborrowerlist.length > 4}
            style={{ maxHeight: 260 }}
          />
        </View>
      )}

      {/* ── Active Filter Chips ────────────────────────────── */}
      {activeFilterCount > 0 && (
        <FilterChips
          filters={activeFilters}
          onRemove={handleRemoveFilterChip}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* ── Account List ───────────────────────────────────── */}
      {initialLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => i.toString()}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : displayData.length === 0 ? (
        <View style={sc.empty}>
          <Icon name="inbox-outline" size={64} color="#ddd" />
          <Text style={sc.emptyTitle}>No Accounts Found</Text>
          <Text style={sc.emptyText}>
            {isFiltered || query ? 'Try clearing your filters or search.' : 'No accounts are allocated to you.'}
          </Text>
          {(isFiltered || query) && (
            <TouchableOpacity style={sc.clearBtn} onPress={() => { handleClearAllFilters(); handleSearchClear(); }}>
              <Text style={sc.clearBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, idx) => item?.account_id?.toString() || idx.toString()}
          renderItem={({ item }) => (
            <AccountCard
              item={item}
              onPress={() => { setSelectedItem(item); setDetailsVisible(true); }}
              onAction={handleNavigate}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : !hasMore && displayData.length > 0 ? (
              <View style={sc.endRow}>
                <View style={sc.endLine} />
                <Text style={sc.endText}>All accounts loaded</Text>
                <View style={sc.endLine} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          // Performance
          removeClippedSubviews
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          windowSize={10}
        />
      )}

      {/* ── Account Details Popup ──────────────────────────── */}
      {detailsVisible && (
        <AccountDeatilsPopup
          visible={detailsVisible}
          borrowerData={selectedItem}
          onClose={() => setDetailsVisible(false)}
          navigation={navigation}
        />
      )}

      {/* ── Filter Popup ───────────────────────────────────── */}
      <FilterPopup
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

// ─── Screen Styles ─────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D47A1',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  refreshingText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  headerStats: {},
  statBubble: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  // Search
  searchSection: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
    height: '100%',
  },
  searchSpinner: {},
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E3EAF2',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F4F8',
  },
  filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  // Autocomplete
  suggestBox: {
    marginHorizontal: 16,
    marginTop: -4,
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    zIndex: 999,
    borderWidth: 1,
    borderColor: '#E8EEF9',
    overflow: 'hidden',
    marginBottom: 8,
  },

  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#aaa', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 20 },
  clearBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8EEF9',
  },
  clearBtnText: { color: '#1565C0', fontWeight: '700', fontSize: 14 },

  // End of list
  endRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 20 },
  endLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  endText: { fontSize: 12, color: '#aaa', fontWeight: '500' },
});

export default AllocatedAccountsScreen;
