import React, { useState, useEffect, useRef,useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/theme';

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  primary: '#1A56DB',
  primaryLight: '#EBF1FF',
  primaryDark: '#1240A8',
  accent: '#3B82F6',
  white: '#FFFFFF',
  bg: '#EFF4FF',
  border: '#D1DCF8',
  inputBg: '#F8FAFF',
  text: '#1E2A4A',
  textMuted: '#6B7A99',
  grey: '#E8EDF8',
  greyDark: '#B0BCDA',
  success: '#10B981',
  successLight: '#ECFDF5',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warn: '#F59E0B',
  warnLight: '#FFFBEB',
  shadow: '#1A56DB',
};

// ─── MOCK API ─────────────────────────────────────────────────────────────────
// Replace this with your real API call.
// loanNumber comes from navigation params (route.params.loanNumber)
const fetchValuationData = (loanNumber) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[MockAPI] Fetching valuation data for loan:', loanNumber);
      if (loanNumber === 'NONE') {
        resolve({ status: 'NOT_FOUND', data: null });
      } else if (loanNumber === 'SUBMITTED') {
        resolve({
          status: 'ALREADY_SUBMITTED',
          data: {
            submittedOn: '27 Jun 2024',
            valuationType: 'Desktop Valuation',
            valuationFor: 'Settlement',
            structuralSoundness: 'Average',
            submittedBy: 'gawade.narendra',
            referenceId: 'VAL-2024-00477',
          },
        });
      } else {
        resolve({
          status: 'FRESH',
          data: {
            accountNumber: '01000005702',
            assetId: 'H77_162228_SLSP_1/1',
            borrowerName: 'Vinoth K',
            trustName: 'EARC Trust SC 477',
            status: 'Initiated',
            collateralAddress: 'Flat No S4, 2nd Floor, Chennai',
            contactPersonName: 'test',
            contactPersonEmail: 'test@ymail.com',
            contactNumber: '7545655543',
          },
        });
      }
    }, 1800);
  });
};

// ─── OPTIONS ─────────────────────────────────────────────────────────────────
const OPTIONS = {
  valuationType: ['Internal', 'External', 'Desktop Valuation'],
  valuationFor: ['Settlement', 'Auction', 'Re-Valuation'],
  structuralSoundness: ['Average', 'Very Good', 'Poor'],
  constructionStatus: [
    'Incomplete Construction – Ongoing',
    'Incomplete Construction – Cons',
    'Complete',
    'No Construction',
  ],
  positiveFactors: [
    'Proximity to basic amenities, Market, School, Hospital',
    'Structural soundness or Infrastructure Development',
    'Posh area or Market Demand or Retail Trends and Growth',
  ],
  negativeFactors: [
    'Narrow approach road or Kaccha Road or High Voltage',
    'Average structural soundness or Leakage or Repairs required',
    'Negative area / Community dominated area or religious',
  ],
  priorityStatus: ['Priority 1', 'Priority 2', 'Priority 3'],
};

const STEPS = ['Account', 'Valuation', 'Assessment', 'Factors'];

// ─── DROPDOWN BOTTOM SHEET ────────────────────────────────────────────────────
const DropdownSheet = ({ visible, label, options, value, onSelect, onClose }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Title */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
            </View>

            {/* Options */}
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      selected && { backgroundColor: C.primaryLight },
                    ]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        selected && {
                          borderColor: C.primary,
                          backgroundColor: C.primary,
                        },
                      ]}
                    >
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        selected && { color: C.primary, fontWeight: '600' },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── FIELD COMPONENTS ─────────────────────────────────────────────────────────
const FieldLabel = ({ text }) => (
  <Text style={styles.fieldLabel}>{text.toUpperCase()}</Text>
);

const ReadOnlyField = ({ label, value, icon }) => (
  <View style={styles.fieldWrap}>
    <FieldLabel text={label} />
    <View style={[styles.inputBox, { backgroundColor: C.grey }]}>
      {icon ? <Text style={styles.fieldIcon}>{icon}</Text> : null}
      <Text style={styles.readOnlyText}>{value}</Text>
    </View>
  </View>
);

const InputField = ({ label, value, onChange, keyboardType = 'default', icon, placeholder }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text={label} />
      <View
        style={[
          styles.inputBox,
          focused && { borderColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
        ]}
      >
        {icon ? <Text style={styles.fieldIcon}>{icon}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || label}
          placeholderTextColor={C.greyDark}
          keyboardType={keyboardType}
          style={styles.textInput}
        />
      </View>
    </View>
  );
};

const SelectField = ({ label, value, options, onChange, icon }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <View style={styles.fieldWrap}>
        <FieldLabel text={label} />
        <TouchableOpacity
          style={[
            styles.inputBox,
            value && {
              borderColor: C.primary,
              shadowColor: C.primary,
              shadowOpacity: 0.12,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {icon ? <Text style={styles.fieldIcon}>{icon}</Text> : null}
              <Text style={[styles.selectText, !value && { color: C.greyDark }]}>
                {value || `Select ${label}`}
              </Text>
            </View>
            <Text style={{ color: C.primary, fontSize: 16 }}>▾</Text>
          </View>
        </TouchableOpacity>
      </View>
      <DropdownSheet
        visible={open}
        label={label}
        options={options}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

const Divider = () => <View style={styles.divider} />;

// ─── HEADER COMPONENT ─────────────────────────────────────────────────────────
const Header = ({ loanNumber, apiStatus , navigation }) => (
  <View style={styles.header}>
    {/* Decorative circles */}
    <View style={styles.headerCircle1} />
    <View style={styles.headerCircle2} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity style={styles.headerIconBox}  onPress={() => navigation.goBack()}> 
         <Icon name="arrow-left" size={20} color={COLORS.white} />
        
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Initiate Valuation</Text>
        <Text style={styles.headerSub}>{loanNumber}</Text>

      </View>
      {apiStatus === 'NOT_FOUND' && (
        <View style={[styles.statusPill, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
          <Text style={[styles.statusPillText, { color: '#FCA5A5' }]}>❌ Not Found</Text>
        </View>
      )}
      {apiStatus === 'ALREADY_SUBMITTED' && (
        <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Text style={[styles.statusPillText, { color: C.white }]}>✅ Submitted</Text>
        </View>
      )}
    </View>
  </View>
);

// Loan chip bar
const LoanChip = ({ loanNumber, verifying }) => (
  <View style={styles.loanChip}>
    <View style={styles.loanBadge}>
      <Text style={styles.loanBadgeText}>LOAN</Text>
    </View>
    <Text style={styles.loanNumber}>#{loanNumber}</Text>
    <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: verifying ? C.warn : C.success },
        ]}
      />
      <Text style={styles.verifyText}>{verifying ? 'Verifying...' : 'Verified'}</Text>
    </View>
  </View>
);

// ─── STATE: LOADING ───────────────────────────────────────────────────────────
const LoadingScreen = ({ loanNumber }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.stateContainer}>
      <View style={{ width: 84, height: 84, marginBottom: 28, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.spinnerTrack} />
        <Animated.View style={[styles.spinnerArc, { transform: [{ rotate: spin }] }]} />
        <View style={styles.spinnerCore}>
          <Text style={{ fontSize: 26 }}>🏠</Text>
        </View>
      </View>
      <Text style={styles.stateTitle}>Fetching Valuation Data</Text>
      <Text style={styles.stateSubtitle}>
        Checking loan{' '}
        <Text style={{ color: C.primary, fontWeight: '700' }}>#{loanNumber}</Text>
      </Text>
      <View style={styles.connectingBadge}>
        <Animated.View style={[styles.connectingDot, { opacity: pulseAnim }]} />
        <Text style={styles.connectingText}>Connecting to EARC Spectrum</Text>
      </View>
    </View>
  );
};

// ─── STATE: NOT FOUND ─────────────────────────────────────────────────────────
const NotFoundScreen = ({ loanNumber, onRetry }) => (
  <ScrollView contentContainerStyle={styles.stateContainer} showsVerticalScrollIndicator={false}>
    {/* Dashed circle icon */}
    <View style={styles.notFoundIcon}>
      <Text style={{ fontSize: 38 }}>🔍</Text>
    </View>

    {/* Badge */}
    <View style={[styles.badge, { backgroundColor: C.errorLight, borderColor: '#FCA5A5' }]}>
      <Text style={[styles.badgeText, { color: C.error }]}>DATA NOT FOUND</Text>
    </View>

    <Text style={styles.stateTitle}>No Valuation Record</Text>
    <Text style={[styles.stateSubtitle, { marginBottom: 8 }]}>
      We couldn't find any loan or asset data for
    </Text>

    {/* Loan chip */}
    <View style={styles.loanChipStatic}>
      <Text style={styles.loanChipText}>Loan # {loanNumber}</Text>
    </View>

    {/* Divider */}
    <View style={styles.iconDivider}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
      <Text style={{ fontSize: 16, marginHorizontal: 10 }}>📋</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </View>

    {/* Reasons card */}
    <View style={[styles.reasonCard, { backgroundColor: C.errorLight, borderColor: '#FCA5A5' }]}>
      <Text style={[styles.reasonTitle, { color: C.error }]}>Possible reasons:</Text>
      {[
        'Loan number may be incorrect or mistyped',
        'Account not yet registered in the system',
        'Data may not have synced — try again later',
      ].map((r, i) => (
        <View key={i} style={styles.reasonRow}>
          <Text style={[styles.reasonBullet, { color: C.error }]}>•</Text>
          <Text style={[styles.reasonText, { color: '#B91C1C' }]}>{r}</Text>
        </View>
      ))}
    </View>

    {/* Actions */}
    <View style={styles.actionRow}>
      <TouchableOpacity style={styles.btnSecondary} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.btnSecondaryText}>← Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnPrimary, { flex: 2 }]} onPress={onRetry} activeOpacity={0.85}>
        <Text style={styles.btnPrimaryText}>🔄  Retry Search</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

// ─── STATE: ALREADY SUBMITTED ─────────────────────────────────────────────────
const AlreadySubmittedScreen = ({ data, loanNumber, onGoBack }) => (
  <ScrollView contentContainerStyle={styles.stateContainer} showsVerticalScrollIndicator={false}>
    {/* Success icon */}
    <View style={{ width: 90, height: 90, marginBottom: 20 }}>
      <View style={styles.successIcon}>
        <Text style={{ fontSize: 36 }}>✅</Text>
      </View>
      <View style={styles.successBadgeDot}>
        <Text style={{ color: C.white, fontWeight: '700', fontSize: 14 }}>✓</Text>
      </View>
    </View>

    {/* Badge */}
    <View style={[styles.badge, { backgroundColor: C.successLight, borderColor: '#6EE7B7' }]}>
      <Text style={[styles.badgeText, { color: C.success }]}>ALREADY SUBMITTED</Text>
    </View>

    <Text style={styles.stateTitle}>Valuation Completed</Text>
    <Text style={[styles.stateSubtitle, { marginBottom: 20, textAlign: 'center' }]}>
      A valuation has already been submitted for loan{' '}
      <Text style={{ color: C.primary, fontWeight: '700' }}>#{loanNumber}</Text>
    </Text>

    {/* Details gradient card */}
    <View style={styles.submittedCard}>
      <View style={styles.submittedCardTop}>
        <View>
          <Text style={styles.submittedCardLabel}>Reference ID</Text>
          <Text style={styles.submittedCardRef}>{data.referenceId}</Text>
        </View>
        <View style={styles.submittedTag}>
          <Text style={styles.submittedTagText}>SUBMITTED</Text>
        </View>
      </View>

      {[
        { label: 'Submitted On', value: data.submittedOn, icon: '📅' },
        { label: 'Valuation Type', value: data.valuationType, icon: '📋' },
        { label: 'Valuation For', value: data.valuationFor, icon: '🎯' },
        { label: 'Structural Soundness', value: data.structuralSoundness, icon: '🏗️' },
        { label: 'Submitted By', value: data.submittedBy, icon: '👤' },
      ].map(({ label, value, icon }) => (
        <View key={label} style={styles.submittedRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text style={styles.submittedRowLabel}>{label}</Text>
          </View>
          <Text style={styles.submittedRowValue}>{value}</Text>
        </View>
      ))}
    </View>

    {/* Warning note */}
    <View style={styles.warnNote}>
      <Text style={{ fontSize: 20 }}>⚠️</Text>
      <Text style={styles.warnNoteText}>
        Valuation for this loan is already recorded. To re-initiate, please contact your team
        lead or raise a <Text style={{ fontWeight: '700' }}>Re-Valuation</Text> request.
      </Text>
    </View>

    <TouchableOpacity style={styles.btnPrimary} onPress={onGoBack} activeOpacity={0.85}>
      <Text style={styles.btnPrimaryText}>← Back to Loan List</Text>
    </TouchableOpacity>
  </ScrollView>
);

// ─── STATE: FRESH FORM ────────────────────────────────────────────────────────
const ValuationForm = ({ accountData, onSubmit }) => {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [form, setForm] = useState({
    dateOfVisit: '',
    valuationType: '',
    valuationFor: '',
    structuralSoundness: '',
    constructionStatus: '',
    positiveFactors: '',
    negativeFactors: '',
    priorityStatus: '',
    contactPersonName: accountData.contactPersonName,
    contactPersonEmail: accountData.contactPersonEmail,
    contactNumber: accountData.contactNumber,
  });

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const isLast = step === STEPS.length - 1;

  const goTo = (nextStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  };

  const soundnessInfo = {
    'Very Good': { icon: '✅', label: 'Property in excellent condition' },
    Average: { icon: '⚠️', label: 'Minor repairs may be required' },
    Poor: { icon: '🔴', label: 'Significant structural concerns found' },
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <SectionHeader title="Account Details" subtitle="Auto-filled from system records" />
            <View style={styles.row2col}>
              <View style={{ flex: 1 }}>
                <ReadOnlyField label="Account Number" value={accountData.accountNumber} icon="🔢" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <ReadOnlyField label="Asset ID" value={accountData.assetId} icon="🏷️" />
              </View>
            </View>
            <ReadOnlyField label="Borrower Name" value={accountData.borrowerName} icon="👤" />
            <View style={styles.row2col}>
              <View style={{ flex: 1 }}>
                <ReadOnlyField label="Trust Name" value={accountData.trustName} icon="🏛️" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <ReadOnlyField label="Status" value={accountData.status} icon="📌" />
              </View>
            </View>
            <ReadOnlyField label="Collateral Address" value={accountData.collateralAddress} icon="📍" />
            <Divider />
            <SectionHeader title="Contact Information" />
            <InputField label="Contact Person Name" value={form.contactPersonName} onChange={set('contactPersonName')} icon="👤" placeholder="Enter contact name" />
            <InputField label="Contact Person Email" value={form.contactPersonEmail} onChange={set('contactPersonEmail')} keyboardType="email-address" icon="✉️" placeholder="Enter email" />
            <InputField label="Contact Number" value={form.contactNumber} onChange={set('contactNumber')} keyboardType="phone-pad" icon="📞" placeholder="Enter phone number" />
          </View>
        );

      case 1:
        return (
          <View>
            <SectionHeader title="Valuation Details" subtitle="Configure valuation parameters" />
            <InputField label="Date of Visit" value={form.dateOfVisit} onChange={set('dateOfVisit')} icon="📅" placeholder="DD/MM/YYYY" />
            <SelectField label="Valuation Type" value={form.valuationType} options={OPTIONS.valuationType} onChange={set('valuationType')} icon="📋" />
            <SelectField label="Valuation For" value={form.valuationFor} options={OPTIONS.valuationFor} onChange={set('valuationFor')} icon="🎯" />
            <SelectField label="Priority Status" value={form.priorityStatus} options={OPTIONS.priorityStatus} onChange={set('priorityStatus')} icon="⚡" />
          </View>
        );

      case 2:
        return (
          <View>
            <SectionHeader title="Property Assessment" subtitle="Evaluate the physical property condition" />
            <SelectField label="Structural Soundness" value={form.structuralSoundness} options={OPTIONS.structuralSoundness} onChange={set('structuralSoundness')} icon="🏗️" />
            <SelectField label="Construction Status" value={form.constructionStatus} options={OPTIONS.constructionStatus} onChange={set('constructionStatus')} icon="🔨" />
            {form.structuralSoundness ? (
              <View style={styles.soundnessCard}>
                <Text style={{ fontSize: 24 }}>
                  {soundnessInfo[form.structuralSoundness]?.icon}
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.soundnessTitle}>
                    Soundness: {form.structuralSoundness}
                  </Text>
                  <Text style={styles.soundnessSubtitle}>
                    {soundnessInfo[form.structuralSoundness]?.label}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        );

      case 3:
        return (
          <View>
            <SectionHeader title="Market Factors" subtitle="Select influencing factors for this property" />
            <SelectField label="Positive Factors" value={form.positiveFactors} options={OPTIONS.positiveFactors} onChange={set('positiveFactors')} icon="✅" />
            <SelectField label="Negative Factors" value={form.negativeFactors} options={OPTIONS.negativeFactors} onChange={set('negativeFactors')} icon="⚠️" />

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>VALUATION SUMMARY</Text>
              {[
                ['Type', form.valuationType],
                ['For', form.valuationFor],
                ['Priority', form.priorityStatus],
                ['Soundness', form.structuralSoundness],
              ].map(([label, value]) => (
                <View key={label} style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>{label}</Text>
                  <Text style={styles.summaryRowValue}>{value || '—'}</Text>
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
    <View style={{ flex: 1 }}>
      {/* Step Progress */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flex: 1, marginHorizontal: 3 }}>
            <View
              style={[
                styles.stepLine,
                { backgroundColor: i <= step ? C.primary : C.border },
              ]}
            />
            <Text
              style={[
                styles.stepLabel,
                i <= step ? { color: C.primary, fontWeight: '700' } : { color: C.greyDark },
              ]}
            >
              {s}
            </Text>
          </View>
        ))}
      </View>

      {/* Step Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => goTo(step - 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btnPrimary, { flex: 2 }]}
          onPress={() => (isLast ? onSubmit(form) : goTo(step + 1))}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>
            {isLast ? '✓  Submit Valuation' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const InitiateValuationScreen = ({ navigation, route }) => {
  // In real usage: const loanNumber = route?.params?.loanNumber;
  const [loanNumber, setLoanNumber] = useState('01000005702');
  const [apiStatus, setApiStatus] = useState('LOADING');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    setApiStatus('LOADING');
    setApiData(null);
    fetchValuationData(loanNumber).then((res) => {
      console.log('[API Response]***********', res);
      setApiStatus(res.status);
      setApiData(res.data);
    });
  }, [loanNumber]);
    useLayoutEffect(() => {
                navigation.setOptions({
                  headerShown: false,
                });
              }, [ ]);

  const resetToList = () => {
    // In real app: navigation.goBack();
    setLoanNumber('01000005702');
  };

  const handleSubmit = (formData) => {
    // TODO: call your submit API here with formData
    alert('✅ Valuation Initiated Successfully!\n\nLoan: ' + loanNumber);
  };

  const showLoanChip =
    apiStatus === 'LOADING' || apiStatus === 'FRESH' || apiStatus === 'ALREADY_SUBMITTED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
        <Header loanNumber={loanNumber} apiStatus={apiStatus} navigation={navigation} />

      <View style={styles.card}>
        {/* Header */}

        {/* Loan chip bar */}
        {showLoanChip && (
          <LoanChip loanNumber={loanNumber} verifying={apiStatus === 'LOADING'} />
        )}

        {/* Content */}
        <View style={{ flex: 1 }}>
          {apiStatus === 'LOADING' && <LoadingScreen loanNumber={loanNumber} />}
          {apiStatus === 'NOT_FOUND' && (
            <NotFoundScreen loanNumber={loanNumber} onRetry={resetToList} />
          )}
          {(apiStatus === 'ALREADY_SUBMITTED' && apiData) && (
            <AlreadySubmittedScreen data={apiData} loanNumber={loanNumber} onGoBack={resetToList} />
          )}
          {(apiStatus === 'FRESH' && apiData) && (
            <ValuationForm accountData={apiData} onSubmit={handleSubmit} />
          )}
        </View>
      </View>

      {/* ── DEV ONLY: State switcher ── Remove in production ── */}
      <View style={styles.devSwitcher}>
        <Text style={styles.devLabel}>DEV →</Text>
        {[
          { label: 'Fresh', value: '01000005702' },
          { label: 'Not Found', value: 'NONE' },
          { label: 'Submitted', value: 'SUBMITTED' },
        ].map((d) => (
          <TouchableOpacity
            key={d.value}
            onPress={() => setLoanNumber(d.value)}
            style={[
              styles.devPill,
              loanNumber === d.value && { backgroundColor: C.primaryLight, borderColor: C.primary },
            ]}
          >
            <Text
              style={[
                styles.devPillText,
                loanNumber === d.value && { color: C.primary },
              ]}
            >
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default InitiateValuationScreen;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Card shell ──
  card: {
    flex: 1,
    // margin: 12,
    backgroundColor: C.white,
    // borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 10 },
    }),
  },

  // ── Header ──
  header: {
    backgroundColor: C.primaryDark,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', top: -30, right: -20, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerCircle2: {
    position: 'absolute', bottom: -40, left: 60, width: 90, height: 90,
    borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerIconBox: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub: {
    fontSize: 10, color: 'rgba(255,255,255,0.65)',
    fontWeight: '700', letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 20, color: C.white, fontWeight: '800', letterSpacing: 0.3,
  },
  statusPill: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  // ── Loan chip bar ──
  loanChip: {
    backgroundColor: C.primaryLight,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  loanBadge: {
    backgroundColor: C.primary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 8,
  },
  loanBadgeText: { fontSize: 10, fontWeight: '800', color: C.white, letterSpacing: 0.5 },
  loanNumber: { fontSize: 13, color: C.primary, fontWeight: '700' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  verifyText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },

  // ── Field common ──
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: C.textMuted,
    letterSpacing: 0.9, marginBottom: 6,
  },
  inputBox: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  fieldIcon: { fontSize: 16, opacity: 0.7, marginRight: 10 },
  readOnlyText: { fontSize: 14, color: C.text, fontWeight: '500', flex: 1 },
  textInput: {
    flex: 1, fontSize: 14, color: C.text,
    paddingVertical: 0,
  },
  selectRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  selectText: { fontSize: 14, color: C.text, fontWeight: '500', flex: 1 },

  // ── Dropdown sheet ──
  overlay: {
    flex: 1, backgroundColor: 'rgba(10,20,60,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 36,
    maxHeight: '70%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 20 },
    }),
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.greyDark,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    marginBottom: 6,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 13,
  },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.greyDark,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  optionText: { fontSize: 14, color: C.text, flex: 1 },

  // ── Section headers ──
  sectionHeader: { marginBottom: 16, marginTop: 4 },
  sectionBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: C.primary, marginRight: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  sectionSubtitle: { fontSize: 12, color: C.textMuted, marginTop: 2, marginLeft: 14 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  row2col: { flexDirection: 'row' },

  // ── Step bar ──
  stepBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  stepLine: { height: 3, borderRadius: 2, marginBottom: 5 },
  stepLabel: { fontSize: 9, fontWeight: '500', textAlign: 'center' },

  // ── Footer ──
  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.white,
  },

  // ── Buttons ──
  btnPrimary: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.primaryDark,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  btnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  btnSecondary: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 2, borderColor: C.border, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSecondaryText: { color: C.text, fontSize: 14, fontWeight: '700' },

  // ── State screens ──
  stateContainer: {
    alignItems: 'center', paddingHorizontal: 24,
    paddingTop: 36, paddingBottom: 24,
  },

  // Loading
  spinnerTrack: {
    position: 'absolute', width: 84, height: 84,
    borderRadius: 42, borderWidth: 4, borderColor: C.primaryLight,
  },
  spinnerArc: {
    position: 'absolute', width: 84, height: 84,
    borderRadius: 42, borderWidth: 4,
    borderColor: 'transparent', borderTopColor: C.primary,
  },
  spinnerCore: {
    position: 'absolute', width: 56, height: 56,
    borderRadius: 28, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 19, fontWeight: '800', color: C.text,
    marginBottom: 8, textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 20,
    lineHeight: 20,
  },
  connectingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primaryLight, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  connectingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  connectingText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Not Found
  notFoundIcon: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: C.error, borderStyle: 'dashed',
    backgroundColor: C.errorLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  badge: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 5, marginBottom: 14,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  loanChipStatic: {
    backgroundColor: C.grey, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 9, marginBottom: 20,
  },
  loanChipText: { fontSize: 14, fontWeight: '700', color: C.text },
  iconDivider: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', marginBottom: 18,
  },
  reasonCard: {
    width: '100%', borderWidth: 1, borderRadius: 14,
    padding: 16, marginBottom: 28,
  },
  reasonTitle: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  reasonBullet: { fontSize: 14, marginRight: 8, marginTop: 1 },
  reasonText: { fontSize: 12, lineHeight: 18, flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10, width: '100%' },

  // Already submitted
  successIcon: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 45, backgroundColor: C.successLight,
    borderWidth: 3, borderColor: C.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successBadgeDot: {
    position: 'absolute', top: -4, right: -4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
  },
  submittedCard: {
    width: '100%', backgroundColor: C.primaryDark,
    borderRadius: 18, padding: 20, marginBottom: 16,
  },
  submittedCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  submittedCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8 },
  submittedCardRef: { fontSize: 16, fontWeight: '700', color: C.white, marginTop: 2 },
  submittedTag: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  submittedTagText: { fontSize: 10, fontWeight: '800', color: C.white, letterSpacing: 0.6 },
  submittedRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.13)',
  },
  submittedRowLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  submittedRowValue: { fontSize: 12, fontWeight: '600', color: C.white },
  warnNote: {
    width: '100%', backgroundColor: C.warnLight,
    borderWidth: 1, borderColor: '#FCD34D',
    borderRadius: 14, padding: 14,
    flexDirection: 'row', gap: 10, marginBottom: 22,
  },
  warnNoteText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  // ── Form specific ──
  soundnessCard: {
    backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center',
    marginBottom: 14,
  },
  soundnessTitle: { fontSize: 13, fontWeight: '700', color: C.primary },
  soundnessSubtitle: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  summaryCard: {
    backgroundColor: C.primaryDark, borderRadius: 16, padding: 20, marginTop: 8,
  },
  summaryCardTitle: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8, marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.13)',
  },
  summaryRowLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  summaryRowValue: { fontSize: 12, fontWeight: '600', color: C.white },

  // ── Dev switcher (remove in production) ──
  devSwitcher: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    gap: 8, flexWrap: 'wrap',
  },
  devLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.6 },
  devPill: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white,
  },
  devPillText: { fontSize: 11, fontWeight: '700', color: C.textMuted },
};
