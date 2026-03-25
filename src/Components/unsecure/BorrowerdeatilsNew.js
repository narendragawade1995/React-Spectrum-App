/**
 * AllocatedAccountsScreen.js  (Redux-free version)
 *
 * Changes from previous version:
 *  1. Removed Redux entirely — useDispatch / useSelector / setSecure / setSecureFilter gone
 *  2. borrowerdetails and filterborrowerlist are now local useState arrays
 *  3. Pagination (infinite scroll) works via local state — page 0 replaces list, page N+ appends
 *  4. Search suggestions stored in local state
 *  5. Filter results stored in local state
 */

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  BackHandler,
  Alert,
  StatusBar,
  Modal,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation, DrawerActions } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';

import Api from '../../Utilities/apiService';
import commonfun from '../../Utilities/CommonFun';
import AccountDeatilsPopup from '../account_deatils_popup';
import FilterPopup from './FilterPopupNew';
import { COLORS } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { width: SW, height: SH } = Dimensions.get('window');
const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  const n = parseFloat(amount);
  if (isNaN(n)) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const formatDate = (date) => {
  if (!date) return '—';
  try { return new Date(date).toLocaleDateString('en-IN'); }
  catch { return '—'; }
};

// ─────────────────────────────────────────────────────────────────────────────
// DISPOSITION COLOUR MAP
// ─────────────────────────────────────────────────────────────────────────────
const getDispStyle = (disp) => {
  const s = (disp || '').toLowerCase();
  if (s.includes('paid') || s.includes('settled'))
    return { bar: '#2E7D32', bg: '#E8F5E9', col: '#2E7D32' };
  if (s.includes('ptp') || s.includes('promise'))
    return { bar: '#1565C0', bg: '#E3F2FD', col: '#1565C0' };
  if (s.includes('rnr') || s.includes('no response'))
    return { bar: '#AD1457', bg: '#FCE4EC', col: '#AD1457' };
  if (s.includes('dispute'))
    return { bar: '#E65100', bg: '#FFF3E0', col: '#E65100' };
  return { bar: '#6A1B9A', bg: '#F3E5F5', col: '#6A1B9A' };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTION MENU CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const ACTION_GROUPS = [
  {
    group: 'Recovery Actions',
    items: [
      {
        key: 'disposition',
        icon: 'clipboard-edit-outline',
        label: 'Disposition',
        desc: "Log today's contact outcome",
        iconBg: '#FFF3E0',
        iconColor: '#E65100',
        badge: 'NEW',
        badgeBg: '#E53935',
        route: 'DispositionNew',
      },
    ],
  },
  {
    group: 'Account Information',
    items: [
      {
        key: 'accDetails',
        icon: 'file-document-outline',
        label: 'Account Details',
        desc: 'Full loan & financial summary',
        iconBg: '#E8EEF9',
        iconColor: '#1565C0',
        badge: null,
        route: 'AccDetails',
      },
      {
        key: 'view360',
        icon: 'rotate-360',
        label: '360° View',
        desc: 'Complete borrower profile',
        iconBg: '#EDE7F6',
        iconColor: '#5E35B1',
        badge: null,
        route: 'Account360',
      },
      {
        key: 'customerList',
        icon: 'account-group-outline',
        label: 'Customer List',
        desc: 'Co-borrowers & guarantors',
        iconBg: '#E8F5E9',
        iconColor: '#2E7D32',
        badge: null,
        route: 'CustomerList',
      },
    ],
  },
  {
    group: 'Contact & Location',
    items: [
      {
        key: 'contact',
        icon: 'phone-outline',
        label: 'Contact',
        desc: 'Call or message borrower',
        iconBg: '#E0F7FA',
        iconColor: '#006064',
        badge: null,
        route: 'Contacts',
      },
      {
        key: 'address',
        icon: 'map-marker-outline',
        label: 'Address',
        desc: 'Residential & office address',
        iconBg: '#FFF8E1',
        iconColor: '#F57F17',
        badge: null,
        route: 'Address',
      },
      {
        key: 'liveliness',
        icon: 'pulse',
        label: 'Liveliness',
        desc: 'Verify borrower identity',
        iconBg: '#FCE4EC',
        iconColor: '#B71C1C',
        badge: null,
        route: 'Liveliness',
      },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════
const AllocatedAccountsScreenWithTracking_New = ({ navigation }) => {
  const nav = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // ── Local state (replaces Redux) ───────────────────────────────────────
  const [borrowerdetails, setBorrowerdetails] = useState([]);
  const [filterborrowerlist, setFilterborrowerlist] = useState([]);

  // ── Pagination & loading state ─────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [silentRefreshing, setSilentRefreshing] = useState(false);

  // ── Search state ───────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [suggestVisible, setSuggestVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Filter state ───────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [isFiltered, setIsFiltered] = useState(false);

  // ── Popup / menu state ─────────────────────────────────────────────────
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // ── Totals & filter dropdown data ─────────────────────────────────────
  const [total, setTotal] = useState(0);
  const [filterData, setFilterData] = useState({ first: {} });

  // ── Navigation ─────────────────────────────────────────────────────────
  const handleNavigate = (route, item) => navigation.navigate(route, item);

  const handleBack = () => {
    Alert.alert('Exit App', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  };

  // ── Fetch accounts (pagination) ────────────────────────────────────────
  const fetchAccounts = useCallback(async (page, params = {}, silent = false) => {
    try {
      if (!silent) {
        page === 0 ? setInitialLoading(true) : setIsLoadingMore(true);
      } else {
        setSilentRefreshing(true);
      }

      const body = { pageIndex: page, pageSize: PAGE_SIZE, isfromCovex: false, ...params };
      const res = await Api.sendRequest(body, 'unsecure_allocation/secure_borrowerdetailsData');

      if (!res.ok) {
        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'HomeDrawer', state: { routes: [{ name: 'Login' }] } }],
        }));
        return;
      }

      const data = await res.json();
      const records = data.ArrayOfResponse || [];
      setTotal(data.totalRecords || 0);

      if (page === 0) {
        // Fresh load — replace the list
        setBorrowerdetails(records);
      } else {
        // Append next page to existing list
        setBorrowerdetails(prev => [...prev, ...records]);
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
  }, [navigation]);

  // ── Focus effect — always fetch fresh on focus ─────────────────────────
  useFocusEffect(useCallback(() => {
    setInitialLoading(true);
    fetchAccounts(0);

    setQuery('');
    setSuggestVisible(false);
    setIsFiltered(false);
    setFilterborrowerlist([]);

    BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => BackHandler.removeEventListener('hardwareBackPress', handleBack);
  }, []));

  // ── Load filter dropdown data on mount ────────────────────────────────
  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const firstRes = await Api.get('unsecure_allocation/dropdownoption');
      setFilterData({ first: firstRes });
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  // ── Debounced search ───────────────────────────────────────────────────
  const debouncedSearch = useRef(debounce(async (text) => {
    if (text.length < 3) {
      setFilterborrowerlist([]);
      setSuggestVisible(false);
      setSearchLoading(false);
      return;
    }
    try {
      const res = await Api.sendRequest(
        { accountno: text, from: 'search' },
        'unsecure_allocation/secure_borrowerdetailsData'
      );
      if (!res.ok) return;
      const data = await res.json();
      const results = data.ArrayOfResponse || [];
      setFilterborrowerlist(results);
      setSuggestVisible(results.length > 0);
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
      setFilterborrowerlist([]);
    }
  };

  const handleSuggestionSelect = (item) => {
    setIsFiltered(true);
    setFilterborrowerlist([item]);
    setQuery(item.account_no);
    setSuggestVisible(false);
  };

  const handleSearchClear = () => {
    setQuery('');
    setSuggestVisible(false);
    setIsFiltered(false);
    setFilterborrowerlist([]);
  };

  // ── Filter apply ───────────────────────────────────────────────────────
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
        'unsecure_allocation/secure_borrowerdetailsData'
      );
      if (!res.ok) return;
      const data = await res.json();
      setFilterborrowerlist(data.ArrayOfResponse || []);
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

  // ── Infinite scroll ────────────────────────────────────────────────────
  const handleEndReached = () => {
    if (hasMore && !isLoadingMore && !isFiltered && !initialLoading) {
      fetchAccounts(currentPage + 1);
    }
  };

  const displayData = isFiltered ? filterborrowerlist : borrowerdetails;
  const activeFilterCount = Object.keys(activeFilters).length;

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <View style={sc.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* ── Header ─────────────────────────────────── */}
      <View style={sc.header}>
        <View style={sc.headerTop}>
          <View>
            <Icon
              name="menu"
              onPress={() => nav.dispatch(DrawerActions.openDrawer())}
              style={{ marginRight: 10 }}
              size={30}
              color={COLORS.white}
            />
            <Text style={sc.headerTitle}>My Unsecured Accounts</Text>
            <Text style={sc.headerSub}>
              {total} accounts allocated
              {silentRefreshing ? <Text style={sc.refreshingText}> · Refreshing…</Text> : null}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Search Bar ─────────────────────────────── */}
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
          {query.length > 0 && (
            <TouchableOpacity onPress={handleSearchClear}>
              <Icon name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[sc.filterBtn, activeFilterCount > 0 && sc.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Icon name="filter-variant" size={20} color={activeFilterCount > 0 ? '#fff' : '#1565C0'} />
          {activeFilterCount > 0 && (
            <View style={sc.filterBadge}>
              <Text style={sc.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Autocomplete suggestions ────────────────── */}
      {suggestVisible && filterborrowerlist.length > 0 && (
        <View style={sc.suggestBox}>
          <FlatList
            data={filterborrowerlist.slice(0, 8)}
            keyExtractor={(item, i) => item?.account_id?.toString() + i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={sc.suggestItem} onPress={() => handleSuggestionSelect(item)}>
                <Icon name="magnify" size={14} color="#aaa" />
                <View style={{ flex: 1 }}>
                  <Text style={sc.sugAccNo}>{item.account_no}</Text>
                  {item.customer_name ? <Text style={sc.sugName}>{item.customer_name}</Text> : null}
                </View>
                <Icon name="arrow-top-left" size={14} color="#ccc" />
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            style={{ maxHeight: 260 }}
          />
        </View>
      )}

      {/* ── Active Filter Chips ─────────────────────── */}
      {activeFilterCount > 0 && (
        <View style={sc.chipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            {Object.entries(activeFilters).filter(([_, v]) => v).map(([key, val]) => (
              <View key={key} style={sc.chip}>
                <Text style={sc.chipText} numberOfLines={1}>{val}</Text>
                <TouchableOpacity onPress={() => handleRemoveFilterChip(key)}>
                  <Icon name="close" size={12} color="#1565C0" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={sc.clearAllChip} onPress={handleClearAllFilters}>
              <Text style={sc.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── Account List / Skeleton / Empty ─────────── */}
      {initialLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i, idx) => idx.toString()}
          renderItem={() => (
            <View style={sc.skeletonCard}>
              <View style={[sc.skel, { width: '40%', height: 12, marginBottom: 10 }]} />
              <View style={[sc.skel, { width: '75%', height: 16, marginBottom: 12 }]} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[sc.skel, { flex: 1, height: 52, borderRadius: 10 }]} />
                <View style={[sc.skel, { flex: 1, height: 52, borderRadius: 10 }]} />
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : displayData.length === 0 ? (
        <View style={sc.empty}>
          <Icon name="inbox-outline" size={64} color="#ddd" />
          <Text style={sc.emptyTitle}>No Accounts Found</Text>
          <Text style={sc.emptyText}>
            {isFiltered || query ? 'Try clearing filters or search.' : 'No accounts allocated.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, idx) => item?.account_id?.toString() + idx.toString()}
          renderItem={({ item }) => (
            <AccountCard
              item={item}
              onPress={() => {
                setSelectedItem(item);
                setDetailsVisible(true);
              }}
              onMenuPress={() => {
                setMenuItem(item);
                setMenuVisible(true);
              }}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={sc.skeletonCard}>
                <View style={[sc.skel, { width: '60%', height: 14, marginBottom: 10 }]} />
                <View style={[sc.skel, { width: '40%', height: 52, borderRadius: 10 }]} />
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
          removeClippedSubviews
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          windowSize={10}
        />
      )}

      {/* ── Popups ─────────────────────────────────── */}
      {detailsVisible && (
        <AccountDeatilsPopup
          visible={detailsVisible}
          borrowerData={selectedItem}
          onClose={() => setDetailsVisible(false)}
          navigation={navigation}
        />
      )}

      <ActionSheet
        visible={menuVisible}
        item={menuItem}
        onClose={() => setMenuVisible(false)}
        onAction={handleNavigate}
      />

      <FilterPopup
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
        initialFilters={activeFilters}
        filterData={filterData}
      />
    </View>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  ACTION SHEET
// ════════════════════════════════════════════════════════════════════════════
const ActionSheet = ({ visible, item, onClose, onAction }) => {
  const translateY = useRef(new Animated.Value(SH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SH);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const close = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: SH, duration: 260, useNativeDriver: true }),
    ]).start(onClose);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 6,
      onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 90 || gs.vy > 0.8) close();
        else Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (!visible || !item) return null;
  const ds = getDispStyle(item.disposition);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[as.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
      </Animated.View>
      <Animated.View style={[as.sheet, { transform: [{ translateY }] }]}>
        <View style={as.handleArea} {...panResponder.panHandlers}>
          <View style={as.handle} />
        </View>
        <View style={as.borrowerCard}>
          <View style={as.borrowerAvatar}>
            <Icon name="account" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={as.borrowerName} numberOfLines={1}>{item.customer_name || 'Unknown Borrower'}</Text>
            <View style={as.borrowerMeta}>
              <Text style={as.borrowerAccNo}>{item.account_no}</Text>
              <View style={[as.dispPill, { backgroundColor: ds.bg }]}>
                <Text style={[as.dispPillText, { color: ds.col }]}>{item.disposition || '—'}</Text>
              </View>
            </View>
          </View>
          <View style={as.overdueBlock}>
            <Text style={as.overdueVal}>{formatCurrency(item.over_dues)}</Text>
            <Text style={as.overdueLbl}>EMI Overdue</Text>
          </View>
        </View>
        <ScrollView style={as.groupsScroll} showsVerticalScrollIndicator={false} bounces={false}>
          {ACTION_GROUPS.map((grp) => (
            <View key={grp.group} style={as.group}>
              <Text style={as.groupLabel}>{grp.group.toUpperCase()}</Text>
              <View style={as.groupItems}>
                {grp.items.map((action, idx) => (
                  <TouchableOpacity
                    key={action.key}
                    style={[as.actionItem, idx < grp.items.length - 1 && as.actionItemBorder]}
                    onPress={() => { close(); onAction(action.route, item); }}
                    activeOpacity={0.7}
                  >
                    <View style={[as.actionIconWrap, { backgroundColor: action.iconBg }]}>
                      <Icon name={action.icon} size={19} color={action.iconColor} />
                    </View>
                    <View style={as.actionText}>
                      <Text style={as.actionLabel}>{action.label}</Text>
                      <Text style={as.actionDesc}>{action.desc}</Text>
                    </View>
                    <View style={as.actionRight}>
                      {action.badge && (
                        <View style={[as.badge, { backgroundColor: action.badgeBg }]}>
                          <Text style={as.badgeText}>{action.badge}</Text>
                        </View>
                      )}
                      <Icon name="chevron-right" size={18} color="#C8CCE0" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  ACCOUNT CARD
// ════════════════════════════════════════════════════════════════════════════
const InfoCell = ({ icon, label, value, highlight = false }) => (
  <View style={card.infoCell}>
    <View style={card.infoCellTop}>
      <Icon name={icon} size={11} color={highlight ? '#1565C0' : '#AAA'} />
      <Text style={card.infoCellLabel}>{label}</Text>
    </View>
    <Text style={[card.infoCellValue, highlight && card.infoCellValueBlue]} numberOfLines={1}>
      {value || '—'}
    </Text>
  </View>
);

const AccountCard = React.memo(({ item, onPress, onMenuPress }) => {
  const ds = getDispStyle(item.disposition);
  return (
    <TouchableOpacity style={card.wrapper} onPress={onPress} activeOpacity={0.85}>
      <View style={[card.accentBar, { backgroundColor: ds.bar }]} />
      <View style={card.body}>
        <View style={card.topRow}>
          <View style={card.accRef}>
            <View style={card.accIconWrap}>
              <Icon name="card-account-details-outline" size={13} color="#1565C0" />
            </View>
            <View>
              <Text style={card.accLabel}>Account No.</Text>
              <Text style={card.accValue}>{item.account_no || '—'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={card.menuTrigger}
            onPress={onMenuPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={card.menuDots}>⋮</Text>
          </TouchableOpacity>
        </View>
        <Text style={card.borrowerName} numberOfLines={1}>
          {item.customer_name || 'Unknown Borrower'}
        </Text>
        {item.disposition ? (
          <View style={[card.dispBadge, { backgroundColor: ds.bg }]}>
            <View style={[card.dispDot, { backgroundColor: ds.col }]} />
            <Text style={[card.dispText, { color: ds.col }]}>{item.disposition}</Text>
          </View>
        ) : null}
        <View style={card.infoGrid}>
          <InfoCell icon="bank-outline" label="Bank" value={item.bank_name} />
          <InfoCell icon="shield-key-outline" label="Trust" value={item.trust} />
          <InfoCell icon="currency-inr" label="EMI Overdue" value={formatCurrency(item.over_dues)} highlight />
          <InfoCell icon="calendar-outline" label="Alloc. Date" value={formatDate(item.allocation_date)} />
        </View>
        <View style={card.footer}>
          <View style={card.followupPill}>
            <Icon name="clock-outline" size={11} color="#F57F17" />
            <Text style={card.followupText}>Follow-up: {formatDate(item.follow_up_date)}</Text>
          </View>
          <View style={card.tapHint}>
            <Icon name="gesture-tap" size={11} color="#CCC" />
            <Text style={card.tapHintText}>Tap for details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Card Styles ─────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18,
    marginHorizontal: 16, marginVertical: 7, elevation: 3,
    shadowColor: '#1A237E', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, overflow: 'hidden',
  },
  accentBar: { width: 4, flexShrink: 0 },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  accRef: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#E8EEF9', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  accLabel: { fontSize: 10, color: '#AAA', fontWeight: '500' },
  accValue: { fontSize: 13, color: '#1A1A2E', fontWeight: '700', marginTop: 1 },
  menuTrigger: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F7FB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EAEEF5', flexShrink: 0 },
  menuDots: { fontSize: 20, color: '#666', fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  borrowerName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 7, letterSpacing: 0.1 },
  dispBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  dispDot: { width: 5, height: 5, borderRadius: 3 },
  dispText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  infoCell: { width: '47.5%', backgroundColor: '#F7F9FC', borderRadius: 10, padding: 8 },
  infoCellTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  infoCellLabel: { fontSize: 9, color: '#AAA', fontWeight: '500' },
  infoCellValue: { fontSize: 11, color: '#333', fontWeight: '600' },
  infoCellValueBlue: { color: '#1565C0' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#F0F2F7' },
  followupPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  followupText: { fontSize: 10, color: '#F57F17', fontWeight: '600' },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapHintText: { fontSize: 9, color: '#CCC', fontWeight: '500' },
});

// ─── Action Sheet Styles ──────────────────────────────────────────────────────
const as = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#F4F6FB', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: SH * 0.88, elevation: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 14 },
  handleArea: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D8DCE8' },
  borrowerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 14, padding: 14, borderRadius: 18, backgroundColor: '#0D47A1', elevation: 4, shadowColor: '#0D47A1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  borrowerAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  borrowerName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  borrowerMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  borrowerAccNo: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  dispPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)' },
  dispPillText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  overdueBlock: { alignItems: 'flex-end', flexShrink: 0 },
  overdueVal: { fontSize: 15, fontWeight: '800', color: '#fff' },
  overdueLbl: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  groupsScroll: { flex: 1 },
  group: { marginHorizontal: 16, marginBottom: 10 },
  groupLabel: { fontSize: 10, fontWeight: '700', color: '#9EA8C0', letterSpacing: 1.2, marginBottom: 7, paddingLeft: 2 },
  groupItems: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EAECF5', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16 },
  actionItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F4FB' },
  actionIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A2E', letterSpacing: 0.1 },
  actionDesc: { fontSize: 11, color: '#AAB0C0', marginTop: 2 },
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.3 },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { backgroundColor: '#0D47A1', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  refreshingText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  searchSection: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48, gap: 10, elevation: 3, borderWidth: 1.5, borderColor: 'transparent' },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E', height: '100%' },
  filterBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3, borderWidth: 1.5, borderColor: '#E3EAF2', position: 'relative' },
  filterBtnActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F0F4F8' },
  filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  suggestBox: { marginHorizontal: 16, marginTop: -4, backgroundColor: '#fff', borderRadius: 14, elevation: 8, zIndex: 999, borderWidth: 1, borderColor: '#E8EEF9', overflow: 'hidden', marginBottom: 8 },
  suggestItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  sugAccNo: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  sugName: { fontSize: 11, color: '#888', marginTop: 1 },
  chipsRow: { paddingHorizontal: 16, marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e8eef9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#BBDEFB' },
  chipText: { fontSize: 11, color: '#1565C0', fontWeight: '600', maxWidth: 90 },
  clearAllChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#FFCDD2', backgroundColor: '#FFF3F3' },
  clearAllText: { fontSize: 11, color: '#E53935', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#aaa', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 20 },
  skeletonCard: { backgroundColor: '#fff', borderRadius: 18, margin: 10, marginHorizontal: 16, padding: 18, elevation: 2 },
  skel: { backgroundColor: '#EAECF4', borderRadius: 6 },
  endRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 20 },
  endLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  endText: { fontSize: 12, color: '#aaa', fontWeight: '500' },
});

export default AllocatedAccountsScreenWithTracking_New;
