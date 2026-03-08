/**
 * PaymentReceiptScreen.js
 *
 * Main screen for adding a payment receipt against a borrower.
 * Loans are fetched from the API — users cannot add/remove them.
 * Users fill: Payment Type, UTR, Amount + Payment For per loan.
 *
 * Navigate to this screen:
 *   navigation.navigate('PaymentReceipt', { borrowerId: 'B001' });
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';

import {fetchLoansByBorrower, submitPaymentReceipt} from './receiptApi';
import {
  SectionTitle,
  FieldLabel,
  ApiBanner,
  SkeletonRow,
  FetchingIndicator,
} from './Paymentindex';
import LoanCard from './LoanCard';
import BottomSheetModal from './BottomSheetModal';

// ─── Dropdown options ─────────────────────────────────────────────────────────
const PAYMENT_TYPE_OPTIONS = [
  {label: 'Digital Payment', icon: '📱'},
  {label: 'Cheque/DD', icon: '🏦'},
];

const PAYMENT_FOR_OPTIONS = [
  {label: 'EMI'},
  {label: 'Pre-closure'},
  {label: 'Part Payment'},
  {label: 'Foreclosure'},
  {label: 'Over Due'},
];

// ─── Screen ───────────────────────────────────────────────────────────────────
const PaymentReceiptScreen = ({navigation, route}) => {
  const borrowerId = route?.params?.borrowerId ?? 'B001';

  // ── Form state ──────────────────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState('Digital Payment');
  const [depositDate] = useState('03/03/2026'); // Replace with DateTimePicker value
  const [utrNumber, setUtrNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [fileName, setFileName] = useState(null);

  // ── Loan state (API-driven) ─────────────────────────────────────────────────
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [showPaymentTypeSheet, setShowPaymentTypeSheet] = useState(false);
  const [activePaymentForLoanId, setActivePaymentForLoanId] = useState(null);

  // ── Submit state ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch loans on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoadingLoans(true);
        const data = await fetchLoansByBorrower(borrowerId);
        setLoans(data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load loan accounts. Please try again.');
      } finally {
        setLoadingLoans(false);
      }
    };
    loadLoans();
  }, [borrowerId]);

  // ─── Update a loan field ───────────────────────────────────────────────────
  const updateLoan = useCallback((id, key, value) => {
    setLoans(prev =>
      prev.map(l => (l.id === id ? {...l, [key]: value} : l)),
    );
  }, []);

  // ─── Computed total ────────────────────────────────────────────────────────
  const totalDeposited = loans.reduce(
    (sum, l) => sum + (parseFloat(l.amount) || 0),
    0,
  );

  const formatCurrency = amount =>
    amount.toLocaleString('en-IN', {minimumFractionDigits: 2});

  const activeLoan = loans.find(l => l.id === activePaymentForLoanId);

  // ─── File Picker ───────────────────────────────────────────────────────────
  const handleFilePick = async () => {
    // Install: npm install react-native-document-picker
    // Then use:
    // try {
    //   const res = await DocumentPicker.pickSingle({
    //     type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
    //   });
    //   setFileName(res.name);
    // } catch (err) { /* cancelled */ }

    // Placeholder toggle for demo:
    setFileName(prev => (prev ? null : 'payment_proof.pdf'));
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!paymentType) {
      Alert.alert('Validation', 'Please select a Payment Type.');
      return false;
    }
    if (!utrNumber.trim()) {
      Alert.alert('Validation', 'Please enter the Instrument/UTR Number.');
      return false;
    }
    if (paymentType === 'Cheque/DD' && !ifscCode.trim()) {
      Alert.alert('Validation', 'Please enter the IFSC Code.');
      return false;
    }
    const unfilled = loans.filter(l => !l.amount || !l.paymentFor);
    if (unfilled.length > 0) {
      Alert.alert(
        'Validation',
        `Please fill Payment For and Amount for all ${unfilled.length} loan(s).`,
      );
      return false;
    }
    return true;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) {return;}
    try {
      setSubmitting(true);
      await submitPaymentReceipt({
        paymentType,
        depositDate,
        utrNumber,
        ifscCode: paymentType === 'Cheque/DD' ? ifscCode : undefined,
        bankName: paymentType === 'Cheque/DD' ? bankName : undefined,
        remarks,
        totalAmount: totalDeposited,
        loans: loans.map(l => ({
          accountNumber: l.accountNumber,
          paymentFor: l.paymentFor,
          amount: parseFloat(l.amount),
        })),
      });
      Alert.alert('Success', 'Payment receipt saved successfully!', [
        {text: 'OK', onPress: () => navigation?.goBack()},
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <Text style={styles.headerSub}>Edelweiss ARC · Ref: EW-2026-03</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ══════════════════════════════════════
              CARD 1 — Payment Details
          ══════════════════════════════════════ */}
          <View style={styles.card}>
            <SectionTitle label="Payment Details" />

            {/* Payment Type */}
            <View style={styles.fieldWrap}>
              <FieldLabel text="Payment Type" required />
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowPaymentTypeSheet(true)}
                activeOpacity={0.7}>
                <View style={styles.selectorLeft}>
                  <Text style={styles.selectorIcon}>
                    {paymentType === 'Digital Payment' ? '📱' : '🏦'}
                  </Text>
                  <Text style={styles.selectorValue}>{paymentType}</Text>
                </View>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
            </View>

            {/* Deposit Date + Total Amount */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FieldLabel text="Deposit Date" required />
                {/* Replace inner View with DateTimePicker */}
                <View style={styles.dateBox}>
                  <Text style={styles.dateText}>{depositDate}</Text>
                  <Text>📅</Text>
                </View>
              </View>
              <View style={styles.halfField}>
                <FieldLabel text="Total Deposited" />
                <View style={styles.totalBox}>
                  <Text style={styles.totalValue}>
                    ₹{totalDeposited > 0 ? formatCurrency(totalDeposited) : '0'}
                  </Text>
                </View>
              </View>
            </View>

            {/* UTR Number */}
            <View
              style={[
                styles.fieldWrap,
                paymentType !== 'Cheque/DD' && styles.noMarginBottom,
              ]}>
              <FieldLabel text="Instrument / UTR Number" required />
              <TextInput
                style={styles.input}
                value={utrNumber}
                onChangeText={setUtrNumber}
                placeholder="Enter UTR / Cheque No."
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Cheque/DD extra fields */}
            {paymentType === 'Cheque/DD' && (
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FieldLabel text="IFSC Code" />
                  <TextInput
                    style={styles.input}
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    placeholder="IFSC Code"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.halfField}>
                  <FieldLabel text="Bank Name" />
                  <TextInput
                    style={styles.input}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Bank Name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            )}
          </View>

          {/* ══════════════════════════════════════
              CARD 2 — Remarks
          ══════════════════════════════════════ */}
          <View style={styles.card}>
            <FieldLabel text="Remarks (Optional)" />
            <TextInput
              style={[styles.input, styles.textarea]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Add any remarks..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ══════════════════════════════════════
              CARD 3 — Loan Accounts (from API)
          ══════════════════════════════════════ */}
          <View style={styles.card}>
            {/* Header row */}
            <View style={styles.loanHeaderRow}>
              <SectionTitle label="Loan Accounts" />
              {!loadingLoans && (
                <View style={styles.loanCountBadge}>
                  <Text style={styles.loanCountText}>{loans.length} Loans</Text>
                </View>
              )}
            </View>

            {/* Loading state */}
            {loadingLoans ? (
              <>
                <FetchingIndicator />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              <>
                {/* API source banner */}
                <ApiBanner />

                {/* Table column header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, {flex: 0.08}]}>#</Text>
                  <Text style={[styles.tableHeaderText, {flex: 1}]}>
                    Account Details
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      {textAlign: 'right', flex: 0.5},
                    ]}>
                    Amount (₹)
                  </Text>
                </View>

                {/* Loan rows */}
                {loans.map((loan, idx) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    index={idx}
                    onAmountChange={updateLoan}
                    onPaymentForPress={id => setActivePaymentForLoanId(id)}
                  />
                ))}

                {/* Total footer */}
                <View style={styles.totalFooter}>
                  <View>
                    <Text style={styles.totalFooterLabel}>TOTAL AMOUNT</Text>
                    <Text style={styles.totalFooterSub}>
                      {loans.filter(l => l.amount).length} of {loans.length}{' '}
                      loans filled
                    </Text>
                  </View>
                  <Text style={styles.totalFooterValue}>
                    ₹{totalDeposited > 0 ? formatCurrency(totalDeposited) : '0'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* ══════════════════════════════════════
              CARD 4 — Upload File
          ══════════════════════════════════════ */}
          <View style={styles.card}>
            <FieldLabel text="Upload Files" />
            <TouchableOpacity
              style={[
                styles.uploadBox,
                fileName ? styles.uploadBoxFilled : styles.uploadBoxEmpty,
              ]}
              onPress={handleFilePick}
              activeOpacity={0.7}>
              <Text style={styles.uploadIcon}>{fileName ? '📄' : '⬆️'}</Text>
              <Text
                style={[
                  styles.uploadLabel,
                  {color: fileName ? '#16a34a' : '#001a6e'},
                ]}>
                {fileName ?? 'Upload Payment Proof'}
              </Text>
              <Text style={styles.uploadSub}>
                {fileName ? 'Tap to remove' : 'PDF, JPG, PNG · Max 5MB'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{height: 20}} />
        </ScrollView>

        {/* ── Fixed Save Button ── */}
        <View style={styles.saveBar}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (loadingLoans || submitting) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={loadingLoans || submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {loadingLoans
                  ? '⏳  Loading Loans…'
                  : '💾  Save Payment Receipt'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Payment Type Bottom Sheet ── */}
      <BottomSheetModal
        visible={showPaymentTypeSheet}
        title="Select Payment Type"
        options={PAYMENT_TYPE_OPTIONS}
        selectedValue={paymentType}
        onSelect={val => {
          setPaymentType(val);
          setShowPaymentTypeSheet(false);
        }}
        onClose={() => setShowPaymentTypeSheet(false)}
      />

      {/* ── Payment For Bottom Sheet ── */}
      <BottomSheetModal
        visible={activePaymentForLoanId !== null}
        title="Payment For"
        subtitle={`Account: ${activeLoan?.accountNumber ?? ''}`}
        options={PAYMENT_FOR_OPTIONS}
        selectedValue={activeLoan?.paymentFor}
        onSelect={val => {
          if (activePaymentForLoanId !== null) {
            updateLoan(activePaymentForLoanId, 'paymentFor', val);
          }
          setActivePaymentForLoanId(null);
        }}
        onClose={() => setActivePaymentForLoanId(null)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#001a6e',
  },
  flex: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // ── Header
  header: {
    backgroundColor: '#001a6e',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  backBtn: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerText: {flex: 1},
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },

  // ── Layout
  scroll: {flex: 1},
  scrollContent: {padding: 14, paddingBottom: 90},

  // ── Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 11,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Fields
  fieldWrap: {marginBottom: 13},
  noMarginBottom: {marginBottom: 0},
  row: {flexDirection: 'row', gap: 10, marginBottom: 0},
  halfField: {flex: 1},
  input: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  textarea: {
    height: 72,
    paddingTop: 10,
    marginTop: 5,
  },

  // ── Payment type selector
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorIcon: {fontSize: 17},
  selectorValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  chevron: {color: '#94a3b8', fontSize: 14},

  // ── Date & Total boxes
  dateBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  dateText: {fontSize: 13, color: '#1e293b'},
  totalBox: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#001a6e',
  },

  // ── Loan section
  loanHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanCountBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
  },
  loanCountText: {
    fontSize: 11,
    color: '#001a6e',
    fontWeight: '700',
  },
  tableHeader: {
    backgroundColor: '#001a6e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Total footer
  totalFooter: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  totalFooterLabel: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  totalFooterSub: {fontSize: 11, color: '#64748b', marginTop: 1},
  totalFooterValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#001a6e',
  },

  // ── Upload
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  uploadBoxFilled: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  uploadBoxEmpty: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  uploadIcon: {fontSize: 26},
  uploadLabel: {fontSize: 13, fontWeight: '600'},
  uploadSub: {fontSize: 11, color: '#94a3b8'},

  // ── Save bar
  saveBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  saveBtn: {
    backgroundColor: '#001a6e',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#001a6e',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PaymentReceiptScreen;
