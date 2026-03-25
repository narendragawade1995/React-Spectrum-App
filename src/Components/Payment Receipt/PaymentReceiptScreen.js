/**
 * PaymentReceiptScreen.js
 *
 * Payment Receipt form screen for Edelweiss ARC.
 *
 * UI/Design: Follows the existing React Native design.
 * Business Logic: Mirrors Angular receipting.component.ts exactly.
 *
 * Navigation:
 *   navigation.navigate('PaymentReceipt', {
 *     receiptDetails: {
 *       customer_name: 'Rajesh Kumar',
 *       cif: 'CIF001',
 *       account_no: '01000005702',
 *       'resolution type': 'Normal',
 *       receipting_type: 'secure',
 *     }
 *   });
 *
 * Requires:
 *   npm install @react-native-documents/picker
 *   npm install @react-native-community/datetimepicker
 *   npm install @react-native-community/geolocation
 */

import React, {useState, useEffect, useCallback, useLayoutEffect, useRef} from 'react';
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
  Image,
} from 'react-native';
import {pick, isCancel, types as DocumentTypes} from '@react-native-documents/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Geolocation from '@react-native-community/geolocation';

import {
  getAccountDetails,
  getBankDetails,
  checkDuplicateUtr,
  submitPaymentReceipt,
} from './receiptApi';
import {
  SectionTitle,
  FieldLabel,
  ErrorText,
  ApiBanner,
  SkeletonRow,
  FetchingIndicator,
  AlertBanner,
  ImagePreviewModal,
} from './Paymentindex';
import LoanCard from './LoanCard';
import BottomSheetModal from './BottomSheetModal';
import {
  PAYMENT_TYPE_OPTIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_COUNT,
  FIXED_KEYWORD_MAP,
  ERROR_MESSAGES,
  ERR_BEHALF_PAYMENT_FOR,
  REGEX,
  getFixedErrorMsg,
  getFilteredPaymentForOptions,
  formatDateForApi,
  formatDateDisplay,
  formatCurrency,
} from './receiptConstants';

// ─── Screen ───────────────────────────────────────────────────────────────────
const PaymentReceiptScreen = ({navigation, route}) => {
  // ── Data from route.params (replaces Angular's CommonService.ReceiptingDetails) ──
  const receiptDetails = route?.params ?? {};
  const {
    customer_name = '',
    cif = '',
    account_no = '',
    receipting_type = 'secure',
  } = receiptDetails;
  const resolutionType = receiptDetails['resolution type'] ?? '';

  // Computed error message based on resolution type (Angular: fixederrormsg)
  const fixedErrorMsg = getFixedErrorMsg(resolutionType);

  // Payment For options filtered by resolution type (Angular: ngAfterViewInit)
  const paymentForOptions = getFilteredPaymentForOptions(resolutionType);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState('');
  const [depositDate, setDepositDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amountDeposited, setAmountDeposited] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // ── Account / Loan State ────────────────────────────────────────────────────
  const [accountDetails, setAccountDetails] = useState([]);     // currently displayed accounts
  const [accountDetailsCopy, setAccountDetailsCopy] = useState([]); // full API copy (Angular: AccountDetailscopy)
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // ── Upload State ────────────────────────────────────────────────────────────
  const [files, setFiles] = useState([]);          // [{uri, name, type}]
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [uploadStop, setUploadStop] = useState(false); // true for Virtual Account / Payment Gateway

  // ── Validation / Submit State ───────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDuplicate, setIsDuplicate] = useState(false);      // duplicate UTR flag
  const [isDuplicateMsg, setIsDuplicateMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Alert Banner (Angular: alertMessage) ────────────────────────────────────
  const [alertMessage, setAlertMessage] = useState(null);

  // ── Date Limits ─────────────────────────────────────────────────────────────
  const maxDate = new Date();
  const [minDate, setMinDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
  );

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [showPaymentTypeSheet, setShowPaymentTypeSheet] = useState(false);
  const [activePaymentForLan, setActivePaymentForLan] = useState(null); // lan of the loan being edited

  // ─── Hide header ───────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    navigation.setOptions({headerShown: false});
  }, [navigation]);

  // ─── On Mount: validate navigation, fetch accounts, get location ────────────
  useEffect(() => {
    // Angular: if (!this.receiptDeatils.customer_name) → navigate back
    if (!customer_name) {
      Alert.alert('Error', 'Borrower details not found.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
      return;
    }
    loadAccountDetails();
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch Account Details ─────────────────────────────────────────────────
  // Angular: getAccountDetails() called in ngOnInit
  const loadAccountDetails = async () => {
    setLoadingAccounts(true);
    try {
      const data = await getAccountDetails(cif, receipting_type);
      setAccountDetailsCopy(data || []);
      // Angular: update minDate from first record's create_date
      if (data?.length > 0 && data[0].create_date) {
        const createDate = new Date(data[0].create_date);
        createDate.setDate(createDate.getDate() + 1);
        setMinDate(createDate);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load loan accounts. Please try again.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // ─── Get Geolocation ────────────────────────────────────────────────────────
  // Angular: getLocation() called in ngOnInit and on submit
  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      () => {}, // silently fail
      {enableHighAccuracy: false, timeout: 10000},
    );
  };

  // ─── Handle Payment Type Change ─────────────────────────────────────────────
  // Angular: handdlePaymentType($event)
  const handlePaymentType = useCallback(val => {
    setPaymentType(val);
    if (val === 'Virtual Account' || val === 'Payment Gateway') {
      // Disable form, show alert
      setAlertMessage('Receipting is not allowed for Virtual account/Payment gateway.');
      setIsDuplicate(true);
      setUploadStop(true);
      setUtrNumber('');
      setIfscCode('');
      setBankName('');
      setPanNumber('');
      setRemarks('');
    } else {
      setAlertMessage(null);
      setIsDuplicate(false);
      setUploadStop(false);
      if (val === 'Cash') {
        // UTR disabled for Cash
        setUtrNumber('');
      }
    }
    setShowPaymentTypeSheet(false);
  }, []);

  // ─── Show Accounts (amount blur handler) ────────────────────────────────────
  // Angular: showAccounts() – called on amount_deposited blur
  const showAccounts = useCallback(() => {
    const depositAmt = parseFloat(amountDeposited);
    if (!amountDeposited || isNaN(depositAmt) || depositAmt <= 0) {
      Alert.alert('Error', 'Please enter deposited amount');
      setAccountDetails([]);
      return;
    }

    if (accountDetailsCopy.length === 0) {
      return; // Accounts not yet loaded
    }

    // Restore full copy and reset amounts
    let updatedAccounts = accountDetailsCopy.map(ele => ({
      ...ele,
      amount: ele.amount != null ? ele.amount : null,
      readonly: false,
    }));

    // Single account: auto-fill amount as readonly
    if (updatedAccounts.length === 1) {
      updatedAccounts[0].amount = amountDeposited;
      updatedAccounts[0].readonly = true;
    }

    // Compute compareWith (total max payable)
    const compareWithVal = updatedAccounts.reduce((acc, crobj) => {
      if (crobj.reol_type?.toLowerCase() === 'auction') {
        return acc + (parseFloat(crobj.resolution_amount) || 0);
      } else {
        const mios =
          crobj.mios_as_on_date === 'null' || crobj.mios_as_on_date === '' || crobj.mios_as_on_date == null
            ? 0
            : parseFloat(crobj.mios_as_on_date) || 0;
        return acc + (parseFloat(crobj.totalamountpayable) || 0) + mios;
      }
    }, 0);

    setAccountDetails(updatedAccounts);

    if (depositAmt > compareWithVal) {
      Alert.alert('Error', fixedErrorMsg);
    }
  }, [amountDeposited, accountDetailsCopy, fixedErrorMsg]);

  // ─── Update a single loan field ─────────────────────────────────────────────
  const updateLoan = useCallback((lan, key, value) => {
    setAccountDetails(prev => prev.map(l => (l.lan === lan ? {...l, [key]: value} : l)));
  }, []);

  // ─── Fetch Bank Details from IFSC ───────────────────────────────────────────
  // Angular: getBankDetails($event) → calls 'payment-receipt/bankdetails'
  const handleIfscBlur = async () => {
    if (!ifscCode.trim()) return;
    if (ifscCode.trim().length !== 11) return;
    try {
      const data = await getBankDetails(ifscCode.trim());
      if ('status' in data && !data.status) {
        Alert.alert('Error', data.message || 'Incorrect IFSC Code');
      } else {
        setBankName(data.BANK || '');
      }
    } catch {
      Alert.alert('Error', 'Incorrect IFSC Code');
    }
    // After bank details, check duplicate UTR (Angular: called in subscribe complete)
    handleCheckDuplicateUtr();
  };

  // ─── Check Duplicate UTR ────────────────────────────────────────────────────
  // Angular: checkduplicateUtr()
  const handleCheckDuplicateUtr = useCallback(async () => {
    const ifsc = ifscCode.trim();
    const utr = utrNumber.trim();
    if (ifsc.length !== 11) return;
    if (!utr) return;

    try {
      const data = await checkDuplicateUtr(utr, ifsc);
      if (data?.ArrayOfResponse?.length > 0) {
        setErrors(prev => ({...prev, ref_utr_no: 'Duplicate Reference/UTR Number'}));
        setIsDuplicateMsg('Duplicate Reference/UTR Number');
        Alert.alert('Error', 'Duplicate Reference/UTR Number');
      } else {
        setErrors(prev => {
          const errs = {...prev};
          delete errs.ref_utr_no;
          return errs;
        });
        setIsDuplicateMsg('');
      }
    } catch {
      // Silent fail
    }
  }, [ifscCode, utrNumber]);

  // ─── File Upload ────────────────────────────────────────────────────────────
  // Angular: onFileSelected(event) + processFiles(files)
  const handleFilePick = async () => {
    if (uploadStop) return;
    try {
      // @react-native-documents/picker v10+ API
      const results = await pick({
        type: [DocumentTypes.images, DocumentTypes.pdf],
        allowMultiSelection: true,
      });

      // Validate MIME types
      const allowed = results.every(f => ALLOWED_FILE_TYPES.includes(f.type));
      if (!allowed) {
        Alert.alert('Error', 'Please upload image file only (JPG, PNG, PDF)');
        return;
      }

      // Validate file sizes (max 10MB each)
      const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      const validSizes = results.every(f => (f.size || 0) <= maxBytes);
      if (!validSizes) {
        Alert.alert('Error', `Please upload files less than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      // Validate total count (max 2)
      const totalCount = results.length + files.length;
      if (totalCount >= MAX_FILE_COUNT + 1) {
        Alert.alert('Error', `Maximum ${MAX_FILE_COUNT} files are allowed to upload`);
        return;
      }

      const newFiles = results.map(f => ({uri: f.uri, name: f.name, type: f.type}));
      setFiles(prev => [...prev, ...newFiles]);
      // Clear payment_proof error
      setErrors(prev => {
        const errs = {...prev};
        delete errs.payment_proof;
        return errs;
      });
    } catch (err) {
      if (!isCancel(err)) {
        Alert.alert('Error', 'Failed to pick file. Please try again.');
      }
    }
  };

  // Angular: removeImage(index)
  const removeFile = index => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setErrors(e => ({...e, payment_proof: 'Payment proof is required'}));
      }
      return updated;
    });
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    const depositAmt = parseFloat(amountDeposited);

    if (!paymentType) errs.payment_type = 'Payment type is required';
    if (!depositDate) errs.deposit_date = 'Deposit date is required';
    if (!amountDeposited || isNaN(depositAmt) || depositAmt < 1) {
      errs.amount_deposited = 'Amount deposited is required (min ₹1)';
    }

    // UTR required unless Cash
    if (paymentType !== 'Cash') {
      if (!utrNumber.trim()) {
        errs.ref_utr_no = 'Instrument/UTR number is required';
      } else if (!REGEX.utr_ref.test(utrNumber.trim())) {
        errs.ref_utr_no = 'Invalid UTR number (alphanumeric only)';
      }
    }

    // IFSC required for Cheque/DD
    if (paymentType === 'Cheque/DD') {
      if (!ifscCode.trim()) {
        errs.ifsc_code = 'IFSC code is required';
      } else if (!REGEX.ifsc_code.test(ifscCode.trim())) {
        errs.ifsc_code = 'Invalid IFSC code format';
      }
    }

    // PAN required for Cash >= ₹50,000
    if (paymentType === 'Cash' && depositAmt >= 50000) {
      if (!panNumber.trim()) {
        errs.pan_number = 'PAN number required for Cash ≥ ₹50,000';
      } else if (!REGEX.pan_number.test(panNumber.trim())) {
        errs.pan_number = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
    }

    // Payment proof (files) required
    if (files.length === 0) errs.payment_proof = 'Payment proof is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  // Angular: createReceipt($event)
  const handleSave = async () => {
    setSubmitted(true);
    getLocation();

    // Angular: if (this.isduplicate) → show error
    if (isDuplicate) {
      Alert.alert('Error', 'Duplicate Reference/UTR Number');
      return;
    }

    const depositAmt = parseFloat(amountDeposited);

    // Validate account-level logic (Angular: inner loop before form validity check)
    if (amountDeposited && accountDetails.length > 0) {
      const totalAllocated = accountDetails.reduce((sum, acc) => {
        return sum + (acc.amount != null ? parseFloat(acc.amount) || 0 : 0);
      }, 0);

      let status = false;
      let ermsg = '';

      for (let i = 0; i < accountDetails.length; i++) {
        const element = accountDetails[i];

        // Check payment_for selected for non-null amounts
        if ((!element.payment_for || element.payment_for === '') && element.amount > 0) {
          status = true;
          ermsg = 'Please Select Payment For';
          break;
        }

        // Compute max payable for this account
        const mios =
          element.mios_as_on_date === 'null' || element.mios_as_on_date === '' || element.mios_as_on_date == null
            ? 0
            : parseFloat(element.mios_as_on_date) || 0;
        const currentPayable = (parseFloat(element.totalamountpayable) || 0) + mios;

        // Check amount doesn't exceed payable
        if (element.amount > currentPayable) {
          ermsg = `${ERROR_MESSAGES['anytype']} - ${element.lan}`;
          status = true;
          break;
        }
      }

      if (status) {
        Alert.alert('Error', ermsg);
        return;
      }

      // Sum of all linked amounts must equal total deposited
      if (Math.abs(totalAllocated - depositAmt) > 0.01) {
        Alert.alert(
          'Error',
          'Sum of all linked amount to be matched with total amount deposited',
        );
        return;
      }
    }

    // Validate form fields
    if (!validate()) {
      return;
    }

    // Build payload (Angular: input = { ...receiptform.value, deposit_date, receipting_type, accountdetails })
    const payload = {
      payment_type: paymentType,
      deposit_date: formatDateForApi(depositDate),
      amount_deposited: depositAmt,
      pan_number: panNumber || undefined,
      ref_utr_no: paymentType !== 'Cash' ? utrNumber : undefined,
      ifsc_code: paymentType === 'Cheque/DD' ? ifscCode.toUpperCase() : undefined,
      bank_name: paymentType === 'Cheque/DD' ? bankName : undefined,
      remarks,
      lattitude: latitude,
      longitude,
      receipting_type,
      accountdetails: accountDetails.filter(item => item.amount != null),
    };

    try {
      setSubmitting(true);
      const data = await submitPaymentReceipt(payload, files);

      if (data && !data.status && data.message) {
        Alert.alert('Error', data.message);
      } else {
        Alert.alert('Success', 'Payment receipt added successfully', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Derived state ─────────────────────────────────────────────────────────
  const totalDeposited = accountDetails.reduce(
    (sum, l) => sum + (parseFloat(l.amount) || 0),
    0,
  );

  const activeLoan = accountDetails.find(l => l.lan === activePaymentForLan);

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
          <Text style={styles.headerSub}>
            {customer_name ? `${customer_name} · ${account_no}` : 'Edelweiss ARC'}
          </Text>
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

          {/* ── Alert Banner (Virtual Account / Payment Gateway) ── */}
          <AlertBanner message={alertMessage} />

          {/* ══════════════════════════════════════
              CARD 1 — Payment Details
          ══════════════════════════════════════ */}
          <View style={styles.card}>
            <SectionTitle label="Payment Details" />

            {/* Payment Type */}
            <View style={styles.fieldWrap}>
              <FieldLabel text="Payment Type" required />
              <TouchableOpacity
                style={[styles.selector, errors.payment_type ? styles.inputError : null]}
                onPress={() => setShowPaymentTypeSheet(true)}
                activeOpacity={0.7}>
                <View style={styles.selectorLeft}>
                  <Text style={styles.selectorIcon}>
                    {paymentType === 'Digital Payment' ? '📱' : paymentType === 'Cheque/DD' ? '🏦' : '💳'}
                  </Text>
                  <Text style={[styles.selectorValue, !paymentType && styles.placeholder]}>
                    {paymentType || 'Select Payment Type'}
                  </Text>
                </View>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
              <ErrorText message={errors.payment_type} />
            </View>

            {/* Deposit Date + Total Amount */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FieldLabel text="Deposit Date" required />
                <TouchableOpacity
                  style={[styles.dateBox, errors.deposit_date ? styles.inputError : null]}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>{formatDateDisplay(depositDate)}</Text>
                  <Text>📅</Text>
                </TouchableOpacity>
                <ErrorText message={errors.deposit_date} />
              </View>
              <View style={styles.halfField}>
                <FieldLabel text="Total Deposited" />
                <View style={styles.totalBox}>
                  <Text style={styles.totalValue}>
                    ₹{totalDeposited > 0 ? formatCurrency(totalDeposited) : '0.00'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={depositDate}
                mode="date"
                display="default"
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setDepositDate(date);
                }}
              />
            )}

            {/* Amount Deposited */}
            <View style={styles.fieldWrap}>
              <FieldLabel text="Total Amount Deposited" required />
              <TextInput
                style={[styles.input, errors.amount_deposited ? styles.inputError : null]}
                value={amountDeposited}
                onChangeText={val => {
                  setAmountDeposited(val.replace(/[^0-9.]/g, ''));
                  setAccountDetails([]); // Angular: clears appropriation_options
                }}
                onBlur={showAccounts}
                placeholder="Enter total amount"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
              />
              <ErrorText message={errors.amount_deposited} />
            </View>

            {/* PAN Number (Cash only) */}
            {paymentType === 'Cash' && (
              <View style={styles.fieldWrap}>
                <FieldLabel
                  text={`PAN Number${parseFloat(amountDeposited) >= 50000 ? ' (required for ₹50,000+)' : ''}`}
                  required={parseFloat(amountDeposited) >= 50000}
                />
                <TextInput
                  style={[styles.input, errors.pan_number ? styles.inputError : null]}
                  value={panNumber}
                  onChangeText={val => setPanNumber(val.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  maxLength={10}
                />
                <ErrorText message={errors.pan_number} />
              </View>
            )}

            {/* UTR Number (hidden for Cash) */}
            {paymentType !== 'Cash' && (
              <View style={styles.fieldWrap}>
                <FieldLabel text="Instrument / UTR Number" required />
                <TextInput
                  style={[styles.input, (errors.ref_utr_no || isDuplicateMsg) ? styles.inputError : null]}
                  value={utrNumber}
                  onChangeText={setUtrNumber}
                  onBlur={handleCheckDuplicateUtr}
                  placeholder="Enter UTR / Cheque No."
                  placeholderTextColor="#94a3b8"
                />
                <ErrorText message={errors.ref_utr_no || isDuplicateMsg} />
              </View>
            )}

            {/* IFSC + Bank Name (Cheque/DD only) */}
            {paymentType === 'Cheque/DD' && (
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FieldLabel text="IFSC Code" />
                  <TextInput
                    style={[styles.input, errors.ifsc_code ? styles.inputError : null]}
                    value={ifscCode}
                    onChangeText={val => setIfscCode(val.toUpperCase())}
                    onBlur={handleIfscBlur}
                    placeholder="IFSC Code"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                  <ErrorText message={errors.ifsc_code} />
                </View>
                <View style={styles.halfField}>
                  <FieldLabel text="Bank Name" />
                  <TextInput
                    style={[styles.input, styles.inputReadonly]}
                    value={bankName}
                    placeholder="Auto-filled"
                    placeholderTextColor="#94a3b8"
                    editable={false}
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
              maxLength={1000}
            />
          </View>

          {/* ══════════════════════════════════════
              CARD 3 — Loan Accounts
          ══════════════════════════════════════ */}
          <View style={styles.card}>
            <View style={styles.loanHeaderRow}>
              <SectionTitle label="Loan Accounts" />
              {!loadingAccounts && accountDetails.length > 0 && (
                <View style={styles.loanCountBadge}>
                  <Text style={styles.loanCountText}>{accountDetails.length} Loan{accountDetails.length !== 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>

            {loadingAccounts ? (
              <>
                <FetchingIndicator />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : accountDetails.length > 0 ? (
              <>
                <ApiBanner />

                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, {flex: 0.1}]}>#</Text>
                  <Text style={[styles.tableHeaderText, {flex: 1}]}>Account Details</Text>
                  <Text style={[styles.tableHeaderText, {flex: 0.6, textAlign: 'right'}]}>Amount (₹)</Text>
                </View>

                {accountDetails.map((loan, idx) => (
                  <LoanCard
                    key={loan.lan}
                    loan={loan}
                    index={idx}
                    onAmountChange={updateLoan}
                    onPaymentForPress={lan => setActivePaymentForLan(lan)}
                    submitted={submitted}
                  />
                ))}

                {/* Total Footer */}
                <View style={styles.totalFooter}>
                  <View>
                    <Text style={styles.totalFooterLabel}>TOTAL ALLOCATED</Text>
                    <Text style={styles.totalFooterSub}>
                      {accountDetails.filter(l => l.amount).length} of {accountDetails.length} loans filled
                    </Text>
                  </View>
                  <Text style={styles.totalFooterValue}>
                    ₹{totalDeposited > 0 ? formatCurrency(totalDeposited) : '0.00'}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyAccounts}>
                <Text style={styles.emptyAccountsText}>
                  {amountDeposited
                    ? '⚠️ No accounts found. Please check the borrower details.'
                    : '👆 Enter the total amount above to load loan accounts.'}
                </Text>
              </View>
            )}
          </View>

          {/* ══════════════════════════════════════
              CARD 4 — Upload Payment Proof
          ══════════════════════════════════════ */}
          <View style={styles.card}>
            <SectionTitle label="Upload Payment Proof" />

            <TouchableOpacity
              style={[
                styles.uploadBox,
                files.length > 0 ? styles.uploadBoxFilled : styles.uploadBoxEmpty,
                uploadStop ? styles.uploadBoxDisabled : null,
                errors.payment_proof ? styles.uploadBoxError : null,
              ]}
              onPress={handleFilePick}
              disabled={uploadStop}
              activeOpacity={0.7}>
              <Text style={styles.uploadIcon}>{uploadStop ? '🚫' : files.length > 0 ? '📂' : '⬆️'}</Text>
              <Text style={[styles.uploadLabel, {color: uploadStop ? '#94a3b8' : files.length > 0 ? '#16a34a' : '#001a6e'}]}>
                {uploadStop ? 'Upload disabled' : files.length > 0 ? `${files.length} file(s) selected` : 'Upload Payment Proof'}
              </Text>
              <Text style={styles.uploadSub}>
                {uploadStop ? 'Not allowed for this payment type' : `PDF, JPG, PNG · Max ${MAX_FILE_SIZE_MB}MB · Max ${MAX_FILE_COUNT} files`}
              </Text>
            </TouchableOpacity>
            <ErrorText message={errors.payment_proof} />

            {/* File Previews */}
            {files.length > 0 && (
              <View style={styles.filePreviewRow}>
                {files.map((file, index) => (
                  <View key={index} style={styles.fileCard}>
                    <TouchableOpacity
                      style={styles.fileRemoveBtn}
                      onPress={() => removeFile(index)}>
                      <Text style={styles.fileRemoveBtnText}>✕</Text>
                    </TouchableOpacity>
                    {file.type?.startsWith('image/') ? (
                      <TouchableOpacity onPress={() => setPreviewImageUri(file.uri)}>
                        <Image source={{uri: file.uri}} style={styles.fileImagePreview} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.filePdfCard}>
                        <Text style={styles.filePdfIcon}>📄</Text>
                        <Text style={styles.filePdfName} numberOfLines={2}>{file.name}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{height: 20}} />
        </ScrollView>

        {/* ── Fixed Save Button ── */}
        <View style={styles.saveBar}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (loadingAccounts || submitting || isDuplicate) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={loadingAccounts || submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {loadingAccounts ? '⏳  Loading Accounts…' : '💾  Save Payment Receipt'}
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
        onSelect={handlePaymentType}
        onClose={() => setShowPaymentTypeSheet(false)}
      />

      {/* ── Payment For Bottom Sheet (per loan) ── */}
      <BottomSheetModal
        visible={activePaymentForLan !== null}
        title="Payment For"
        subtitle={`Account: ${activeLoan?.lan ?? ''}`}
        options={paymentForOptions}
        selectedValue={activeLoan?.payment_for}
        onSelect={val => {
          if (activePaymentForLan !== null) {
            updateLoan(activePaymentForLan, 'payment_for', val);
          }
          setActivePaymentForLan(null);
        }}
        onClose={() => setActivePaymentForLan(null)}
      />

      {/* ── Image Preview Modal ── */}
      <ImagePreviewModal
        visible={!!previewImageUri}
        imageUri={previewImageUri}
        onClose={() => setPreviewImageUri(null)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#001a6e'},
  flex: {flex: 1, backgroundColor: '#f1f5f9'},

  // Header
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
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
  headerSub: {color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2},

  // Layout
  scroll: {flex: 1},
  scrollContent: {padding: 14, paddingBottom: 90},

  // Card
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

  // Fields
  fieldWrap: {marginBottom: 13},
  row: {flexDirection: 'row', gap: 10, marginBottom: 13},
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
  inputError: {borderColor: '#fca5a5', backgroundColor: '#fff1f2'},
  inputReadonly: {backgroundColor: '#f1f5f9', color: '#64748b'},
  textarea: {height: 72, paddingTop: 10, marginTop: 5},

  // Selector
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
  selectorLeft: {flexDirection: 'row', alignItems: 'center', gap: 8},
  selectorIcon: {fontSize: 17},
  selectorValue: {fontSize: 14, color: '#1e293b', fontWeight: '500'},
  placeholder: {color: '#94a3b8', fontWeight: '400'},
  chevron: {color: '#94a3b8', fontSize: 14},

  // Date & Total
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
    minHeight: 48,
  },
  totalValue: {fontSize: 14, fontWeight: '800', color: '#001a6e'},

  // Loan section
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
  loanCountText: {fontSize: 11, color: '#001a6e', fontWeight: '700'},
  tableHeader: {
    backgroundColor: '#001a6e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tableHeaderText: {color: '#fff', fontSize: 10, fontWeight: '700'},
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
    marginTop: 4,
  },
  totalFooterLabel: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  totalFooterSub: {fontSize: 11, color: '#64748b', marginTop: 1},
  totalFooterValue: {fontSize: 20, fontWeight: '800', color: '#001a6e'},
  emptyAccounts: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  emptyAccountsText: {fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18},

  // Upload
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  uploadBoxFilled: {borderColor: '#86efac', backgroundColor: '#f0fdf4'},
  uploadBoxEmpty: {borderColor: '#cbd5e1', backgroundColor: '#f8fafc'},
  uploadBoxDisabled: {borderColor: '#e2e8f0', backgroundColor: '#f8fafc', opacity: 0.5},
  uploadBoxError: {borderColor: '#fca5a5', backgroundColor: '#fff1f2'},
  uploadIcon: {fontSize: 26},
  uploadLabel: {fontSize: 13, fontWeight: '600'},
  uploadSub: {fontSize: 11, color: '#94a3b8'},

  // File previews
  filePreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  fileCard: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'visible',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  fileRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    backgroundColor: '#ef4444',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  fileRemoveBtnText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  fileImagePreview: {width: '100%', height: '100%', borderRadius: 9},
  filePdfCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  filePdfIcon: {fontSize: 28},
  filePdfName: {fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 4},

  // Save bar
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
  saveBtnDisabled: {backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0},
  saveBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
});

export default PaymentReceiptScreen;
