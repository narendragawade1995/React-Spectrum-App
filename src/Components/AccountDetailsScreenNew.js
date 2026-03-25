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
const AccountDetailsScreenNew = ({ navigation,route }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header — Option B hero ───────────────────────────────────────── */}
      <View style={styles.navbar}>
        {/* decorative circles */}
        <View style={styles.hdrCircle1} />
        <View style={styles.hdrCircle2} />

        {/* nav row: back + title */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Account Details</Text>
        </View>

        {/* Big account number hero */}
        <View style={styles.accHero}>
          <Text style={styles.accHeroLbl}>Account Number</Text>
          <Text style={styles.accHeroNo} numberOfLines={1}>
            {route.params?.account_no ?? '—'}
          </Text>
        </View>

        {/* Customer name · Bank name */}
        <View style={styles.custRow}>
          <View style={styles.custDot} />
          <Text style={styles.custName} numberOfLines={1}>
            {route.params?.customer_name ?? '—'}
          </Text>
          {route.params?.bank_name ? (
            <>
              <View style={styles.custSep} />
              <Text style={styles.custBank} numberOfLines={1}>
                {route.params.bank_name}
              </Text>
            </>
          ) : null}
        </View>

        {/* Inline colour badges: Overdue · Trust · TOS · Zone */}
        <View style={styles.badgeStrip}>
          {route.params?.over_dues ? (
            <View style={[styles.infoBadge, styles.badgeRed]}>
              <Text style={[styles.infoBadgeLbl, styles.badgeRedLbl]}>Overdue</Text>
              <Text style={[styles.infoBadgeVal, styles.badgeRedVal]}>
                ₹{route.params.over_dues}
              </Text>
            </View>
          ) : null}
          {route.params?.trust ? (
            <View style={[styles.infoBadge, styles.badgeWhite]}>
              <Text style={[styles.infoBadgeLbl, styles.badgeWhiteLbl]}>Trust</Text>
              <Text style={[styles.infoBadgeVal, styles.badgeWhiteVal]}>
                {route.params.trust}
              </Text>
            </View>
          ) : null}
          {route.params?.tos_as_on_date ? (
            <View style={[styles.infoBadge, styles.badgeGreen]}>
              <Text style={[styles.infoBadgeLbl, styles.badgeGreenLbl]}>TOS</Text>
              <Text style={[styles.infoBadgeVal, styles.badgeGreenVal]}>
                ₹{route.params.tos_as_on_date}
              </Text>
            </View>
          ) : null}
          {route.params?.zone ? (
            <View style={[styles.infoBadge, styles.badgeNeutral]}>
              <Text style={[styles.infoBadgeLbl, styles.badgeNeutralLbl]}>Zone</Text>
              <Text style={[styles.infoBadgeVal, styles.badgeNeutralVal]}>
                {route.params.zone}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

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

  // ── Header — Option B (account hero + inline badges) ────────────────────────
  navbar: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? 20 : 30,
    paddingBottom: 20,
    paddingHorizontal: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  hdrCircle1: {
    position: 'absolute', bottom: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  hdrCircle2: {
    position: 'absolute', top: -20, right: 40,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(37,99,235,0.40)',
  },

  // nav row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: {
    flex: 1, color: '#fff', fontSize: 17, fontWeight: '700',
  },

  // account number hero
  accHero: { marginBottom: 8 },
  accHeroLbl: {
    color: 'rgba(255,255,255,0.40)', fontSize: 9, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4,
  },
  accHeroNo: {
    color: '#fff', fontSize: 22, fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1, lineHeight: 26,
  },

  // customer + bank row
  custRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 16, flexWrap: 'wrap',
  },
  custDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)', flexShrink: 0,
  },
  custName: {
    color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500',
  },
  custSep: {
    width: 1, height: 12,
    backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 2,
  },
  custBank: {
    color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: '400', flexShrink: 1,
  },

  // badge strip
  badgeStrip: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 7,
  },
  infoBadge: {
    borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1,
  },
  infoBadgeLbl: {
    fontSize: 8.5, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  infoBadgeVal: {
    fontSize: 11.5, fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 3,
  },
  // red — Overdue
  badgeRed:        { backgroundColor: 'rgba(239,68,68,0.15)',   borderColor: 'rgba(239,68,68,0.25)' },
  badgeRedLbl:     { color: 'rgba(252,165,165,0.80)' },
  badgeRedVal:     { color: '#FCA5A5' },
  // white/neutral — Trust
  badgeWhite:      { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)' },
  badgeWhiteLbl:   { color: 'rgba(255,255,255,0.45)' },
  badgeWhiteVal:   { color: '#fff' },
  // green — TOS
  badgeGreen:      { backgroundColor: 'rgba(16,185,129,0.14)',  borderColor: 'rgba(16,185,129,0.22)' },
  badgeGreenLbl:   { color: 'rgba(110,231,183,0.75)' },
  badgeGreenVal:   { color: '#6EE7B7' },
  // neutral — Zone
  badgeNeutral:    { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' },
  badgeNeutralLbl: { color: 'rgba(255,255,255,0.40)' },
  badgeNeutralVal: { color: 'rgba(255,255,255,0.70)' },

  // ── kept for backward compat (unused but safe) ────────────────────────────
  backIcon: {},
  navSubtitle: {},

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

export default AccountDetailsScreenNew;
