// AccountDetailsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  LayoutAnimation,
  UIManager,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Api from '../Utilities/apiService';

import { COLORS } from '../theme/theme';
// ─── Enable LayoutAnimation on Android ───────────────────────────────────────
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  primary:      '#1a3c6e',
  primaryMid:   '#2563a8',
  primaryLight: '#4a90d9',
  accent:       '#e8f0fb',
  cardBorder:   '#d0dff5',
  divider:      '#e8edf5',
  bgPage:       '#f0f4fa',
  bgCard:       '#ffffff',
  bgInner:      '#f7f9fd',
  textPrimary:  '#1a2340',
  textSub:      '#5a6a85',
  textLabel:    '#8a9bb5',
  grey1:        '#f2f4f8',
  grey2:        '#dde3ee',
  grey3:        '#b0bdd0',
  badgeGreen:   { bg: '#e8f5ee', text: '#1e7d45' },
  badgeBlue:    { bg: '#e3eeff', text: '#1a3c6e' },
  badgeGrey:    { bg: '#edf0f5', text: '#5a6a85' },
};

// ─── MOCK API ENDPOINTS ───────────────────────────────────────────────────────
// Replace these with your real API base URL and token
const BASE_URL = 'https://your-api.com';
const AUTH_TOKEN = 'Bearer YOUR_TOKEN_HERE';

const API_MAP = {
  financial:      'securedloanview/getSecuredLoanViewDetails?LoanAccountNo=',
  customer:       '/api/customer-accounts',
  collateral:     '/api/collateral-view',
  payment:        '/api/payment-receipts',
  settlement:     '/api/settlement-balances',
  restructuring:  '/api/restructuring-balances',
};

// ─── MOCK DATA (used as fallback / for preview) ───────────────────────────────
const MOCK_DATA = {
  financial: {
    type: 'grid',
    fields: [
      { label: 'Outstanding Balance', value: '₹2,45,000.00', highlight: true },
      { label: 'Principal Amount',    value: '₹3,00,000.00' },
      { label: 'Interest Accrued',    value: '₹12,450.00' },
      { label: 'Loan Status',         value: 'Active',      badge: 'green' },
      { label: 'Maturity Date',       value: '09-03-2028' },
      { label: 'ROI',                 value: '12.5% p.a.' },
    ],
  },
  customer: {
    type: 'cards',
    cards: [
      {
        cardTitle: 'Account 1',
        fields: [
          { label: 'Account No.',  value: 'LOAN-00123456' },
          { label: 'Account Type', value: 'Home Loan' },
          { label: 'Branch',       value: 'MG Road, Bangalore' },
          { label: 'Status',       value: 'Active', badge: 'green' },
        ],
      },
      {
        cardTitle: 'Account 2',
        fields: [
          { label: 'Account No.',  value: 'LOAN-00789012' },
          { label: 'Account Type', value: 'Personal Loan' },
          { label: 'Branch',       value: 'Koramangala' },
          { label: 'Status',       value: 'Active', badge: 'green' },
        ],
      },
      {
        cardTitle: 'Account 3',
        fields: [
          { label: 'Account No.',  value: 'LOAN-00345678' },
          { label: 'Account Type', value: 'Car Loan' },
          { label: 'Branch',       value: 'Whitefield' },
          { label: 'Status',       value: 'Closed', badge: 'grey' },
        ],
      },
    ],
  },
  collateral: {
    type: 'cards',
    cards: [
      {
        cardTitle: 'Collateral 1 — Property',
        fields: [
          { label: 'Type',         value: 'Immovable Property' },
          { label: 'Value',        value: '₹45,00,000.00', highlight: true },
          { label: 'Address',      value: '123, MG Road, Bangalore' },
          { label: 'Doc Status',   value: 'Verified', badge: 'green' },
        ],
      },
      {
        cardTitle: 'Collateral 2 — Vehicle',
        fields: [
          { label: 'Type',        value: 'Vehicle' },
          { label: 'Value',       value: '₹8,50,000.00', highlight: true },
          { label: 'Vehicle No.', value: 'KA-01-AB-1234' },
          { label: 'Doc Status',  value: 'Pending', badge: 'blue' },
        ],
      },
      {
        cardTitle: 'Collateral 3 — FD',
        fields: [
          { label: 'Type',       value: 'Fixed Deposit' },
          { label: 'FD Amount',  value: '₹5,00,000.00', highlight: true },
          { label: 'FD Number',  value: 'FD-9900234' },
          { label: 'Doc Status', value: 'Verified', badge: 'green' },
        ],
      },
    ],
  },
  payment: {
    type: 'cards',
    cards: [
      {
        cardTitle: 'Receipt — Feb 2026',
        fields: [
          { label: 'Payment Mode',  value: 'Monthly' },
          { label: 'Amount Paid',   value: '₹909.00', highlight: true },
          { label: 'Paid Date',     value: '09-02-2026' },
          { label: 'Auto Debit',    value: 'Active',   badge: 'green' },
          { label: 'Account No.',   value: '0000000000007004' },
          { label: 'Next Due Date', value: '09-03-2026' },
        ],
      },
      {
        cardTitle: 'Receipt — Jan 2026',
        fields: [
          { label: 'Payment Mode',   value: 'Monthly' },
          { label: 'Amount Paid',    value: '₹909.00', highlight: true },
          { label: 'Paid Date',      value: '09-01-2026' },
          { label: 'Auto Debit',     value: 'Active',  badge: 'green' },
          { label: 'Account No.',    value: '0000000000007004' },
          { label: 'Transaction ID', value: 'TXN2026010923' },
        ],
      },
      {
        cardTitle: 'Receipt — Dec 2025',
        fields: [
          { label: 'Payment Mode',   value: 'Monthly' },
          { label: 'Amount Paid',    value: '₹909.00', highlight: true },
          { label: 'Paid Date',      value: '09-12-2025' },
          { label: 'Auto Debit',     value: 'Active',  badge: 'green' },
          { label: 'Account No.',    value: '0000000000007004' },
          { label: 'Transaction ID', value: 'TXN2025120918' },
        ],
      },
    ],
  },
  settlement: {
    type: 'grid',
    fields: [
      { label: 'Settlement Amount', value: '₹1,85,000.00', highlight: true },
      { label: 'Waiver Amount',     value: '₹15,000.00' },
      { label: 'Settlement Date',   value: '15-03-2026' },
      { label: 'Status',            value: 'Pending', badge: 'blue' },
    ],
  },
  restructuring: {
    type: 'grid',
    fields: [
      { label: 'Restructured Amount', value: '₹2,10,000.00', highlight: true },
      { label: 'New EMI',             value: '₹8,500.00' },
      { label: 'Revised Tenure',      value: '36 Months' },
      { label: 'Restructure Date',    value: '01-01-2025' },
    ],
  },
};

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'financial',     title: 'Financial View',                   icon: 'shield-check' ,viewType:'Financial View', type:'grid' },
  { id: 'customer',      title: 'Customer Multiple Account View',    icon: 'account',viewType:'Customer multiple account view', type:'cards' },
  { id: 'collateral',    title: 'Collateral View',                  icon: 'shield-account',viewType:'Collateral View', type:'cards' },
  { id: 'payment',       title: 'Payment Receipt',                  icon: 'bank' ,viewType:'Payment Receipt', type:'cards'},
  { id: 'settlement',    title: 'Settlement Balances',              icon: 'account-multiple',viewType:'Settlement Balances', type:'grid' },
  { id: 'restructuring', title: 'Restructuring Balances',           icon: 'currency-inr',viewType:'Restructuring Balances', type:'grid' },
];

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ type, value }) => {
  const style =
    type === 'green' ? T.badgeGreen :
    type === 'blue'  ? T.badgeBlue  : T.badgeGrey;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.text }]}>{value}</Text>
    </View>
  );
};

// ─── FIELD VALUE ──────────────────────────────────────────────────────────────
const FieldValue = ({ item }) => {
  if (item.badge) return <Badge type={item.badge} value={item.value} />;
  return (
    <Text style={[
      styles.fieldValue,
      item.highlight && { color: T.primary, fontSize: 16, fontWeight: '700' },
    ]}>
      {item.value}
    </Text>
  );
};

// ─── FIELD PAIR ROW ───────────────────────────────────────────────────────────
const FieldPairRow = ({ left, right }) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldCell}>
      <Text style={styles.fieldLabel}>{left.label}</Text>
      <FieldValue item={left} />
    </View>
    {right ? (
      <View style={styles.fieldCell}>
        <Text style={styles.fieldLabel}>{right.label}</Text>
        <FieldValue item={right} />
      </View>
    ) : (
      <View style={styles.fieldCell} />
    )}
  </View>
);

// ─── GRID CONTENT (for Financial, Settlement, Restructuring) ─────────────────
const GridContent = ({ fields }) => {
  const pairs = [];
  for (let i = 0; i < fields.length; i += 2) pairs.push([fields[i], fields[i + 1]]);
  return (
    <View style={styles.gridContent}>
      {pairs.map((pair, i) => (
        <View key={i}>
          <FieldPairRow left={pair[0]} right={pair[1]} />
          {i < pairs.length - 1 && <View style={styles.innerDivider} />}
        </View>
      ))}
    </View>
  );
};

// ─── SINGLE CARD (inside cards content) ──────────────────────────────────────
const DataCard = ({ card, index }) => {
  const pairs = [];
  for (let i = 0; i < card.fields.length; i += 2)
    pairs.push([card.fields[i], card.fields[i + 1]]);
  return (
    <View style={styles.dataCard}>
      {/* Card Header */}
      <View style={styles.dataCardHeader}>
        <Text style={styles.dataCardTitle}>{card.cardTitle}</Text>
        <View style={styles.dataCardBadge}>
          <Text style={styles.dataCardBadgeText}>#{index + 1}</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.dataCardBody}>
        {pairs.map((pair, i) => (
          <View key={i}>
            <FieldPairRow left={pair[0]} right={pair[1]} />
            {i < pairs.length - 1 && <View style={styles.innerDivider} />}
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── CARDS CONTENT (for Payment, Collateral, Customer) ───────────────────────
const CardsContent = ({ cards }) => (
  <View style={styles.cardsWrapper}>
    {cards.map((card, i) => (
      <DataCard key={i} card={card} index={i} />
    ))}
  </View>
);

// ─── ACCORDION ITEM ───────────────────────────────────────────────────────────
const AccordionItem = ({ section,loanNumber }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // ── Fetch API data ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); 
      const url = `securedloanview/getSecuredLoanViewDetails?LoanAccountNo=${loanNumber}&ViewType=${section.viewType}`;
      const result = await Api.get(url);  
      console.log('****************', JSON.stringify(result),'______________________________',url)
      if(section.type === 'grid'){
        if(result.SecuredLoanViewData && result.SecuredLoanViewData.length > 0){
          const dataItem = result.SecuredLoanViewData[0];
          const fields = Object.keys(dataItem).map(key => ({ label: key, value: dataItem[key] }));
          setData({ type: 'grid', fields });
        } else {
          setError('No data available');
        }
         
      } else if(section.type === 'cards'){
        if(result.SecuredLoanViewData && result.SecuredLoanViewData.length > 0){
          const cards = result.SecuredLoanViewData.map((item, index) => {
            const fields = Object.keys(item).map(key => ({ label: key, value: item[key] }));
            return {
              cardTitle: `${section.title} ${index + 1}`,
              fields,
            };
          });
          setData({ type: 'cards', cards });
        }else {
          setError('No data available');
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [section.id]);

  // ── Toggle handler ──
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const expanding = !open;
    setOpen(expanding);
    if (expanding && !data && !loading) {
      fetchData(); // API called only on first expand
    }
  };

  const isCards = data?.type === 'cards';
  const count = isCards ? data?.cards?.length : null;

  return (
    <View style={[styles.accordion, open && styles.accordionOpen]}>

      {/* ── Header ── */}
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.75}
        style={[styles.accordionHeader, open && styles.accordionHeaderOpen]}
      >
        {/* Left: icon + title */}
        <View style={styles.headerLeft}>
          <View style={[styles.iconBubble, open && styles.iconBubbleOpen]}>
            {/* <Text style={styles.iconText}>{section.icon}</Text> */}
                      <Icon name={section.icon} size={24} color={COLORS.primary} />
            
          </View>
          <View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {count !== null && (
              <Text style={styles.recordCount}>{count} record{count !== 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>

        {/* Right: chevron */}
        <View style={[styles.chevronWrap, open && styles.chevronWrapOpen]}>
          <Text style={[styles.chevron, open && styles.chevronOpen]}>
            {open ? '∧' : '∨'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ── Body ── */}
      {open && (
        <View>
          <View style={styles.headerDivider} />

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="small" color={T.primaryMid} />
              <Text style={styles.loaderText}>Fetching records…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity
                onPress={() => { setData(null); fetchData(); }}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : data ? (
            isCards
              ? <CardsContent cards={data.cards} />
              : <GridContent fields={data.fields} />
          ) : null}
        </View>
      )}
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const AccountDetailsScreen = ({ navigation,route }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Top Nav */}
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.navTitle}>Account Details</Text>
          <Text style={styles.navSubtitle}>Account Number:  {route.params.account_no}</Text>

        </View>
      </View>

{/* 
      <Appbar.Header style={styles.header}>
              <Appbar.BackAction onPress={() => navigation?.goBack()} color={COLORS.primary} />
              <Appbar.Content title="Account Details" titleStyle={styles.headerTitle} />
               
            </Appbar.Header> */}

      {/* Sections */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map(section => (
          <AccordionItem key={section.id} section={section} loanNumber= {route.params.account_no}/>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.primary,
  },

  // ── Navbar ──
  navbar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 22,
  },
  navSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginBottom: 2,
  },
  navTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
    backgroundColor: T.bgPage,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },

  // ── Accordion ──
  accordion: {
    backgroundColor: T.bgCard,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.grey2,
    overflow: 'hidden',
    shadowColor: T.primary,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  accordionOpen: {
    borderColor: T.cardBorder,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: T.bgCard,
  },
  accordionHeaderOpen: {
    backgroundColor: T.accent,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.grey1,
    borderWidth: 1.5,
    borderColor: T.grey2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleOpen: {
    borderColor: T.cardBorder,
  },
  iconText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.textPrimary,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  recordCount: {
    fontSize: 11,
    color: T.textLabel,
    marginTop: 1,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.grey1,
    borderWidth: 1,
    borderColor: T.grey2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrapOpen: {
    backgroundColor: T.primaryMid,
    borderColor: T.primaryMid,
  },
  chevron: {
    fontSize: 12,
    color: T.grey3,
    fontWeight: '700',
    lineHeight: 16,
  },
  chevronOpen: {
    color: '#fff',
  },
  headerDivider: {
    height: 1,
    backgroundColor: T.divider,
  },

  // ── Loader / Error ──
  loaderWrap: {
    padding: 28,
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.bgInner,
  },
  loaderText: {
    fontSize: 12,
    color: T.textLabel,
    marginTop: 8,
  },
  errorWrap: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.bgInner,
  },
  errorText: {
    fontSize: 13,
    color: '#c0392b',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: T.accent,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.cardBorder,
  },
  retryText: {
    fontSize: 13,
    color: T.primaryMid,
    fontWeight: '600',
  },

  // ── Grid Content ──
  gridContent: {
    padding: 16,
    backgroundColor: T.bgCard,
  },

  // ── Cards Wrapper ──
  cardsWrapper: {
    padding: 10,
    gap: 10,
    backgroundColor: T.bgInner,
  },

  // ── Data Card ──
  dataCard: {
    backgroundColor: T.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: T.primaryLight,
    overflow: 'hidden',
    shadowColor: T.primary,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.grey2,
  },
  dataCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: T.primary,
  },
  dataCardBadge: {
    backgroundColor: T.grey2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dataCardBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: T.textSub,
  },
  dataCardBody: {
    padding: 12,
  },

  // ── Field Row ──
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldCell: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10.5,
    color: T.textLabel,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  fieldValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: T.textPrimary,
  },
  innerDivider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 12,
  },

  // ── Badge ──
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default AccountDetailsScreen;
