/**
 * ReceiptListScreen.js
 *
 * Receipting list screen for Edelweiss ARC.
 * Mirrors Angular receipting-list.component.ts exactly.
 *
 * Navigation:
 *   navigation.navigate('ReceiptList');
 *
 * Features:
 *   - Paginated receipt list (20 per page)
 *   - Collapsible filter panel (account number, borrower name, payment type, UTR, payment for, status)
 *   - View receipt images
 *   - View receipt details (bottom sheet)
 *   - Edit button for "Hold" status receipts
 */

import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';

import {getReceiptList, getReceiptImages} from './receiptApi';
import {SectionTitle, FieldLabel, ReceiptStatusBadge, FetchingIndicator} from './Paymentindex';
import BottomSheetModal from './BottomSheetModal';
import {
  PAYMENT_TYPE_OPTIONS,
  PAYMENT_FOR_OPTIONS_NEW,
  LOAN_STATUS_OPTIONS,
  formatDateDisplay,
  formatCurrency,
} from './receiptConstants';

const PAGE_SIZE = 20;

// ─── Receipt Detail Modal ──────────────────────────────────────────────────────
const ReceiptDetailModal = ({visible, receipt, onClose}) => {
  if (!receipt) return null;
  const rows = [
    {label: 'Account Number', value: receipt.loan_number},
    {label: 'Customer Name', value: receipt.customer_name},
    {label: 'Payment Type', value: receipt.payment_type},
    {label: 'Payment For', value: receipt.payment_for},
    {label: 'Amount Deposited', value: receipt.amount_deposited ? `₹${formatCurrency(receipt.amount_deposited)}` : '—'},
    {label: 'Deposit Date', value: formatDateDisplay(receipt.deposit_date)},
    {label: 'UTR / Reference', value: receipt.ref_utr_no || '—'},
    {label: 'Trust Code', value: receipt.trust_code || '—'},
    {label: 'Receipt Date', value: formatDateDisplay(receipt.created_at)},
    {label: 'Status', value: receipt.lms_stage_status || '—'},
    {label: 'Status Detail', value: receipt.lms_stage_details || '—'},
    {label: 'Username', value: receipt.username || '—'},
    {label: 'Remarks', value: receipt.remarks || '—'},
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={detailStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={detailStyles.sheet}>
              <View style={detailStyles.handle} />
              <Text style={detailStyles.title}>Receipt Details</Text>
              <Text style={detailStyles.accountNo}>{receipt.loan_number}</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {rows.map((row, idx) => (
                  <View key={idx} style={[detailStyles.row, idx % 2 === 0 ? detailStyles.rowEven : null]}>
                    <Text style={detailStyles.rowLabel}>{row.label}</Text>
                    <Text style={detailStyles.rowValue}>{row.value}</Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
                <Text style={detailStyles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ─── Images Modal ─────────────────────────────────────────────────────────────
const ReceiptImagesModal = ({visible, images, loading, onClose}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={imgStyles.overlay}>
        <TouchableWithoutFeedback>
          <View style={imgStyles.sheet}>
            <View style={imgStyles.handle} />
            <Text style={imgStyles.title}>Receipt Attachments</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#001a6e" style={{marginVertical: 30}} />
            ) : images.length === 0 ? (
              <Text style={imgStyles.empty}>No attachments found.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {images.map((img, idx) => (
                  <View key={idx} style={imgStyles.imgCard}>
                    <Image
                      source={{uri: img.image_path || img.file_path}}
                      style={imgStyles.img}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={imgStyles.closeBtn} onPress={onClose}>
              <Text style={imgStyles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const FilterPanel = ({filters, onFilterChange, onApply, onClear, paymentTypeSheet, paymentForSheet, statusSheet}) => (
  <View style={filterStyles.container}>
    <View style={filterStyles.row}>
      <View style={filterStyles.half}>
        <FieldLabel text="Account Number" />
        <TextInput
          style={filterStyles.input}
          value={filters.loan_number || ''}
          onChangeText={val => onFilterChange('loan_number', val)}
          placeholder="Account No."
          placeholderTextColor="#94a3b8"
        />
      </View>
      <View style={filterStyles.half}>
        <FieldLabel text="Borrower Name" />
        <TextInput
          style={filterStyles.input}
          value={filters.customer_name || ''}
          onChangeText={val => onFilterChange('customer_name', val)}
          placeholder="Customer name"
          placeholderTextColor="#94a3b8"
        />
      </View>
    </View>
    <View style={filterStyles.row}>
      <View style={filterStyles.half}>
        <FieldLabel text="Payment Type" />
        <TouchableOpacity style={filterStyles.selector} onPress={paymentTypeSheet}>
          <Text style={[filterStyles.selectorText, !filters.payment_type && {color: '#94a3b8'}]}>
            {filters.payment_type || 'All Types'}
          </Text>
          <Text style={filterStyles.chevron}>▾</Text>
        </TouchableOpacity>
      </View>
      <View style={filterStyles.half}>
        <FieldLabel text="Payment For" />
        <TouchableOpacity style={filterStyles.selector} onPress={paymentForSheet}>
          <Text style={[filterStyles.selectorText, !filters.payment_for && {color: '#94a3b8'}]}>
            {filters.payment_for || 'All'}
          </Text>
          <Text style={filterStyles.chevron}>▾</Text>
        </TouchableOpacity>
      </View>
    </View>
    <View style={filterStyles.row}>
      <View style={filterStyles.half}>
        <FieldLabel text="UTR / Reference" />
        <TextInput
          style={filterStyles.input}
          value={filters.ref_utr_no || ''}
          onChangeText={val => onFilterChange('ref_utr_no', val)}
          placeholder="UTR number"
          placeholderTextColor="#94a3b8"
        />
      </View>
      <View style={filterStyles.half}>
        <FieldLabel text="Receipt Status" />
        <TouchableOpacity style={filterStyles.selector} onPress={statusSheet}>
          <Text style={[filterStyles.selectorText, !filters.loan_status && {color: '#94a3b8'}]}>
            {filters.loan_status || 'All Statuses'}
          </Text>
          <Text style={filterStyles.chevron}>▾</Text>
        </TouchableOpacity>
      </View>
    </View>
    <View style={filterStyles.btnRow}>
      <TouchableOpacity style={filterStyles.clearBtn} onPress={onClear}>
        <Text style={filterStyles.clearBtnText}>Clear</Text>
      </TouchableOpacity>
      <TouchableOpacity style={filterStyles.applyBtn} onPress={onApply}>
        <Text style={filterStyles.applyBtnText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Receipt Card ─────────────────────────────────────────────────────────────
const ReceiptCard = ({item, onViewDetails, onViewImages, onEdit}) => (
  <View style={cardStyles.card}>
    {/* Account + Status Row */}
    <View style={cardStyles.cardHeader}>
      <TouchableOpacity onPress={() => onViewDetails(item)}>
        <Text style={cardStyles.accountNo}>{item.loan_number}</Text>
      </TouchableOpacity>
      <ReceiptStatusBadge status={item.lms_stage_status} />
    </View>

    {/* Customer Name */}
    <Text style={cardStyles.customerName}>{item.customer_name || '—'}</Text>

    {/* Key Fields */}
    <View style={cardStyles.fieldsGrid}>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>Payment Type</Text>
        <Text style={cardStyles.fieldValue}>{item.payment_type || '—'}</Text>
      </View>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>Amount</Text>
        <Text style={[cardStyles.fieldValue, cardStyles.amountValue]}>
          {item.amount_deposited ? `₹${formatCurrency(item.amount_deposited)}` : '—'}
        </Text>
      </View>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>Deposit Date</Text>
        <Text style={cardStyles.fieldValue}>{formatDateDisplay(item.deposit_date)}</Text>
      </View>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>Payment For</Text>
        <Text style={cardStyles.fieldValue}>{item.payment_for || '—'}</Text>
      </View>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>UTR / Reference</Text>
        <Text style={cardStyles.fieldValue}>{item.ref_utr_no || '—'}</Text>
      </View>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>Trust Code</Text>
        <Text style={cardStyles.fieldValue}>{item.trust_code || '—'}</Text>
      </View>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>Receipt Date</Text>
        <Text style={cardStyles.fieldValue}>{formatDateDisplay(item.created_at)}</Text>
      </View>
      <View style={cardStyles.fieldItem}>
        <Text style={cardStyles.fieldLabel}>Username</Text>
        <Text style={cardStyles.fieldValue}>{item.username || '—'}</Text>
      </View>
    </View>

    {/* Status Detail */}
    {item.lms_stage_details ? (
      <View style={cardStyles.statusDetail}>
        <Text style={cardStyles.statusDetailText}>📋 {item.lms_stage_details}</Text>
      </View>
    ) : null}

    {/* Action Buttons */}
    <View style={cardStyles.actionsRow}>
      <TouchableOpacity style={cardStyles.actionBtn} onPress={() => onViewDetails(item)}>
        <Text style={cardStyles.actionBtnText}>👁 View Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={cardStyles.actionBtn} onPress={() => onViewImages(item)}>
        <Text style={cardStyles.actionBtnText}>🖼 Images</Text>
      </TouchableOpacity>
      {/* Angular: edit only for 'Hold' status */}
      {item.lms_stage_status?.toLowerCase() === 'hold' && (
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.editBtn]}
          onPress={() => onEdit(item)}>
          <Text style={[cardStyles.actionBtnText, {color: '#fff'}]}>✏️ Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReceiptListScreen = ({navigation}) => {
  // ── List State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Filter State ────────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({});
  const [pendingFilters, setPendingFilters] = useState({});

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [detailItem, setDetailItem] = useState(null);
  const [imagesVisible, setImagesVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // ── Filter Sheet State ──────────────────────────────────────────────────────
  const [showPaymentTypeSheet, setShowPaymentTypeSheet] = useState(false);
  const [showPaymentForSheet, setShowPaymentForSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);

  // ── Hide header ──────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    navigation.setOptions({headerShown: false});
  }, [navigation]);

  // ─── Fetch Receipt List ────────────────────────────────────────────────────
  // Angular: getReportsData()
  const fetchReceipts = useCallback(async (page = 0, currentFilters = filters, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {
        ...currentFilters,
        pageIndex: page,
        pageSize: PAGE_SIZE,
        sortcolumn: 'id',
        receipting_type: 'secure',
      };
      const result = await getReceiptList(params);
      const newData = result.ArrayOfResponse || [];
      const total = result.TotalRecords || 0;

      if (page === 0 || isRefresh) {
        setData(newData);
      } else {
        setData(prev => [...prev, ...newData]);
      }
      setTotalRecords(total);
      setPageIndex(page);
    } catch {
      Alert.alert('Error', 'Failed to load receipts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // On mount: fetch first page
  useEffect(() => {
    fetchReceipts(0, {});
  }, []);

  // ─── Pull-to-Refresh ───────────────────────────────────────────────────────
  const handleRefresh = () => {
    setPageIndex(0);
    fetchReceipts(0, filters, true);
  };

  // ─── Load More (pagination) ────────────────────────────────────────────────
  // Angular: getNext(ev) + handlePageChange(e)
  const handleLoadMore = () => {
    if (loading || data.length >= totalRecords) return;
    fetchReceipts(pageIndex + 1, filters);
  };

  // ─── Apply Filters ─────────────────────────────────────────────────────────
  // Angular: getreceiptDetails(true) after filter changes
  const applyFilters = () => {
    setFilters(pendingFilters);
    setFilterVisible(false);
    setData([]);
    setPageIndex(0);
    fetchReceipts(0, pendingFilters);
  };

  // ─── Clear Filters ─────────────────────────────────────────────────────────
  // Angular: clearfilter()
  const clearFilters = () => {
    const empty = {};
    setPendingFilters(empty);
    setFilters(empty);
    setFilterVisible(false);
    setData([]);
    setPageIndex(0);
    fetchReceipts(0, empty);
  };

  // ─── View Images ───────────────────────────────────────────────────────────
  // Angular: showmimagges(element)
  const handleViewImages = async item => {
    setImages([]);
    setImagesLoading(true);
    setImagesVisible(true);
    try {
      const result = await getReceiptImages(item);
      setImages(result || []);
    } catch {
      Alert.alert('Error', 'Failed to load images.');
    } finally {
      setImagesLoading(false);
    }
  };

  // ─── Edit Receipt ──────────────────────────────────────────────────────────
  // Angular: editReceipt(element) → navigate to edit screen
  const handleEdit = item => {
    navigation.navigate('EditReceipt', {unique_trans_id: item.unique_trans_id});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const hasMore = data.length < totalRecords;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#001a6e" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Receipting Report</Text>
          <Text style={styles.headerSub}>
            {totalRecords > 0 ? `${totalRecords} total records` : 'Payment receipts'}
          </Text>
        </View>

        {/* Filter Toggle */}
        <TouchableOpacity
          style={[styles.filterBtn, filterVisible && styles.filterBtnActive]}
          onPress={() => {
            setPendingFilters(filters);
            setFilterVisible(v => !v);
          }}>
          <Text style={styles.filterBtnText}>
            {filterVisible ? '✕' : '⚙️'}{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Refresh */}
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter Panel ── */}
      {filterVisible && (
        <FilterPanel
          filters={pendingFilters}
          onFilterChange={(key, val) => setPendingFilters(prev => ({...prev, [key]: val}))}
          onApply={applyFilters}
          onClear={clearFilters}
          paymentTypeSheet={() => setShowPaymentTypeSheet(true)}
          paymentForSheet={() => setShowPaymentForSheet(true)}
          statusSheet={() => setShowStatusSheet(true)}
        />
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && !filterVisible && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            🔍 {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersLink}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      {loading && data.length === 0 ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#001a6e" />
          <Text style={styles.loadingText}>Loading receipts…</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, idx) => item.unique_trans_id?.toString() ?? String(idx)}
          renderItem={({item}) => (
            <ReceiptCard
              item={item}
              onViewDetails={setDetailItem}
              onViewImages={handleViewImages}
              onEdit={handleEdit}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#001a6e']}
              tintColor="#001a6e"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptyText}>
                {activeFiltersCount > 0
                  ? 'No receipts match your filters. Try clearing filters.'
                  : 'No payment receipts have been submitted yet.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore && data.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#001a6e" />
                <Text style={styles.footerLoaderText}>Loading more…</Text>
              </View>
            ) : data.length > 0 ? (
              <Text style={styles.endText}>— End of results —</Text>
            ) : null
          }
        />
      )}

      {/* ── Receipt Detail Modal ── */}
      <ReceiptDetailModal
        visible={!!detailItem}
        receipt={detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* ── Images Modal ── */}
      <ReceiptImagesModal
        visible={imagesVisible}
        images={images}
        loading={imagesLoading}
        onClose={() => setImagesVisible(false)}
      />

      {/* ── Filter: Payment Type Sheet ── */}
      <BottomSheetModal
        visible={showPaymentTypeSheet}
        title="Filter by Payment Type"
        options={[{label: 'All Types'}, ...PAYMENT_TYPE_OPTIONS]}
        selectedValue={pendingFilters.payment_type || 'All Types'}
        onSelect={val => {
          setPendingFilters(prev => ({...prev, payment_type: val === 'All Types' ? '' : val}));
          setShowPaymentTypeSheet(false);
        }}
        onClose={() => setShowPaymentTypeSheet(false)}
      />

      {/* ── Filter: Payment For Sheet ── */}
      <BottomSheetModal
        visible={showPaymentForSheet}
        title="Filter by Payment For"
        options={[{label: 'All'}, ...PAYMENT_FOR_OPTIONS_NEW]}
        selectedValue={pendingFilters.payment_for || 'All'}
        onSelect={val => {
          setPendingFilters(prev => ({...prev, payment_for: val === 'All' ? '' : val}));
          setShowPaymentForSheet(false);
        }}
        onClose={() => setShowPaymentForSheet(false)}
      />

      {/* ── Filter: Status Sheet ── */}
      <BottomSheetModal
        visible={showStatusSheet}
        title="Filter by Status"
        options={[{label: 'All Statuses'}, ...LOAN_STATUS_OPTIONS]}
        selectedValue={pendingFilters.loan_status || 'All Statuses'}
        onSelect={val => {
          setPendingFilters(prev => ({...prev, loan_status: val === 'All Statuses' ? '' : val}));
          setShowStatusSheet(false);
        }}
        onClose={() => setShowStatusSheet(false)}
      />
    </SafeAreaView>
  );
};

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#001a6e'},

  // Header
  header: {
    backgroundColor: '#001a6e',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 34, height: 34,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backIcon: {color: '#fff', fontSize: 18, fontWeight: '600'},
  headerText: {flex: 1},
  headerTitle: {color: '#fff', fontSize: 17, fontWeight: '700'},
  headerSub: {color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1},
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterBtnActive: {backgroundColor: 'rgba(255,255,255,0.25)'},
  filterBtnText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  refreshBtn: {
    width: 34, height: 34,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  refreshBtnText: {color: '#fff', fontSize: 18, fontWeight: '600'},

  // Active filters
  activeFiltersBar: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  activeFiltersText: {fontSize: 12, color: '#1d4ed8', fontWeight: '500'},
  clearFiltersLink: {fontSize: 12, color: '#dc2626', fontWeight: '600'},

  // List
  listContent: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    paddingBottom: 40,
  },
  centerLoader: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {fontSize: 13, color: '#64748b'},
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {fontSize: 48},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 12},
  emptyText: {fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 20},
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerLoaderText: {fontSize: 12, color: '#64748b'},
  endText: {textAlign: 'center', fontSize: 12, color: '#94a3b8', paddingVertical: 20},
});

// ─── Receipt Card Styles ──────────────────────────────────────────────────────
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  accountNo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#001a6e',
    textDecorationLine: 'underline',
  },
  customerName: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  fieldItem: {
    width: '50%',
    paddingVertical: 5,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
    marginTop: 1,
  },
  amountValue: {
    color: '#001a6e',
    fontWeight: '700',
    fontSize: 13,
  },
  statusDetail: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDetailText: {fontSize: 11, color: '#475569'},
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editBtn: {
    backgroundColor: '#001a6e',
    borderColor: '#001a6e',
  },
  actionBtnText: {fontSize: 11, fontWeight: '600', color: '#475569'},
});

// ─── Detail Modal Styles ──────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '80%',
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4},
  accountNo: {fontSize: 13, color: '#001a6e', fontWeight: '600', marginBottom: 14},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4},
  rowEven: {backgroundColor: '#f8fafc', borderRadius: 8},
  rowLabel: {fontSize: 12, color: '#64748b', flex: 1},
  rowValue: {fontSize: 12, color: '#1e293b', fontWeight: '600', flex: 1, textAlign: 'right'},
  closeBtn: {
    backgroundColor: '#001a6e',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBtnText: {color: '#fff', fontSize: 14, fontWeight: '700'},
});

// ─── Images Modal Styles ──────────────────────────────────────────────────────
const imgStyles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '60%',
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16},
  empty: {fontSize: 13, color: '#94a3b8', textAlign: 'center', marginVertical: 24},
  imgCard: {
    width: 160,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#f1f5f9',
  },
  img: {width: '100%', height: '100%'},
  closeBtn: {
    backgroundColor: '#001a6e',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBtnText: {color: '#fff', fontSize: 14, fontWeight: '700'},
});

// ─── Filter Panel Styles ──────────────────────────────────────────────────────
const filterStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {flexDirection: 'row', gap: 10, marginBottom: 10},
  half: {flex: 1},
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#f8fafc',
  },
  selectorText: {fontSize: 12, color: '#1e293b', flex: 1},
  chevron: {color: '#94a3b8', fontSize: 11},
  btnRow: {flexDirection: 'row', gap: 10, marginTop: 4},
  clearBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearBtnText: {fontSize: 13, color: '#475569', fontWeight: '600'},
  applyBtn: {
    flex: 2,
    backgroundColor: '#001a6e',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  applyBtnText: {fontSize: 13, color: '#fff', fontWeight: '700'},
});

export default ReceiptListScreen;
