import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, ScrollView, Modal, Animated, Dimensions,
} from 'react-native';
import { COLORS } from '../theme/theme';
import Api from "../Utilities/apiService";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Loader from './Loader';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  blue900: '#0B1F4A', blue700: '#1340A0', blue500: '#2563EB',
  blue200: '#BFDBFE', blue100: '#DBEAFE', blue50: '#EFF6FF',
  grey800: '#1E293B', grey500: '#64748B', grey300: '#CBD5E1',
  grey200: '#E2E8F0', grey100: '#F1F5F9', white: '#FFFFFF',
  green100: '#DCFCE7', green200: '#BBF7D0', green700: '#166534',
  yellow100: '#FEF9C3', yellow200: '#FDE68A', yellow800: '#854D0E',
  red700: '#B91C1C',
};

const SECTIONS = [
{
  tabname: 'Customer Details',
  fields: [
    {
      key:'Customer Name',
      label:'Customer Name'
    },
    {
      key:'Salutation',
      label:'Salutation'
    },
    {
      key:'Gender',
      label:'Gender'
    },
    {
      key:'Borrower Type',
      label:'Borrower Type'
    },
    {
      key:'Constitution',
      label:'Constitution'
    }
  ]
},
{
  tabname: 'Family Details',
  fields: [
    {
      key:'Father Name',
      label:'Father Name'
    },
    {
      key:'Spouse Name',
      label:'Constitution'
    },
    {
      key:'Spouse Employer Name',
      label:'Spouse Employer Name'
    },
    {
      key:'Spouse Income',
      label:'Spouse Income'
    }
  ]
},
{
  tabname: 'Personal Details',
  fields: [
    {
      key:'Marital Status',
      label:'Marital Status'
    },
    {
      key:'Qualification',
      label:'Qualification'
    },
    {
      key:'No of Dependents',
      label:'No of Dependents'
    },
    {
      key:'Residence Ownership',
      label:'Residence Ownership'
    },
    {
      key:'Residence Occupied Since',
      label:'Residence Occupied Since'
    },
    {
      key:'Employement Type',
      label:'Employment Type'
    },
    {
      key:'Industry Type',
      label:'Industry Type'
    },
    {
      key:'Employer Name',
      label:'Employer Name'
    },
    {
      key:'Designation',
      label:'Designation'
    },
     {
      key:'Employed Since',
      label:'Employed Since'
    },
     {
      key:'Annual Income',
      label:'Annual Income'
    },
     {
      key:'Other Income',
      label:'Other Income'
    },
     {
      key:'Caste',
      label:'Caste'
    },
     {
      key:'Religion',
      label:'Religion'
    },
     {
      key:'Other Income',
      label:'Other Income'
    } 
  ]
},

{
  tabname: 'KYC Details',
  fields: []
}
]





// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = ['Customer Details', 'Family Details', 'Personal Details', 'KYC Details'];

// ─── Reusable UI Atoms ────────────────────────────────────────────────────────

const SectionTitle = ({ title }) => (
  <View style={s.secTitleRow}>
    <Text style={s.secTitle}>{title}</Text>
    <View style={s.secLine} />
  </View>
);

const FieldGrid = ({ fields,data ,full}) => {
  return (
    <View style={s.fGrid}>
      {fields.map(( item, i) => (
        <View key={i} style={[s.fCell,full && s.fCellFull]}>
          <Text style={s.fLbl}>{item.label}</Text>
          <Text style={s.fVal}>
            {data[item.key] || '—'}
          </Text>
        </View>
      ))}
    </View>
  )
};

const DOC_STYLES = {
  aadhaar: { bg: '#FEF9C3', border: '#FDE68A' },
  pan: { bg: C.blue50, border: C.blue200 },
  voter: { bg: C.green100, border: C.green200 },
  passport: { bg: '#FFF1F2', border: '#FECDD3' },
  dl: { bg: '#F5F3FF', border: '#DDD6FE' },
};

const DocCard = ({ doc }) => {
  return (
    <View style={s.docCard}>
      <View style={[s.docIcon, { backgroundColor: COLORS.primary }]}>
        <Text style={s.docEmoji}>

          <Icon name={doc.icon || 'document'} size={15} color={COLORS.white} />
        </Text>
      </View>
      <View style={s.docBody}>
        <Text style={s.docType}>{doc.type}</Text>
        <Text style={s.docNum}>{doc.number || '-'}</Text>

      </View>
      {/* <View style={[s.pill, verified ? s.pillV : s.pillP]}>
        <Text style={[s.pillTxt, verified ? s.pillTxtV : s.pillTxtP]}>{doc.status}</Text>
      </View> */}
    </View>
  );
};



// ─── Tab Panels ───────────────────────────────────────────────────────────────

const PersonalTab = ({ data, fields,full }) => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <SectionTitle title="Basic Information" />
    <FieldGrid data={data} fields={fields} full={full}/>
    <View style={{ height: 20 }} />
  </ScrollView>
);

const DocumentsTab = ({ data }) => {
  let doc = {}
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionTitle title="Identity Proof" />

      <DocCard doc={{ type: "PASSPORT", icon: "passport", number: data.Passport }} />
      <DocCard doc={{ type: "PAN CARD", icon: "card-account-details-outline", number: data['Income Tax '] }} />
      <DocCard doc={{ type: "UID", icon: "card-account-details", number: data.UID }} />
      <DocCard doc={{ type: "DRIVING LICENSE", icon: "license", number: data['Driving License '] }} />
      <DocCard doc={{ type: "VOTER ID", icon: "card-bulleted-outline", number: data['Voter Card'] }} />
      <DocCard doc={{ type: "DATE OF BIRTH/INCORPORATION", icon: "calendar-account-outline", number: data['Date of Birth/Incorporation'] }} />

      <View style={{ height: 20 }} />
    </ScrollView>
  )
};


// ─── Detail Bottom Sheet ──────────────────────────────────────────────────────

const DetailSheet = ({ visible, customer, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setActiveTab(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 3, speed: 14 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!customer) return null;
  const detail = customer;
  const renderTab = () => {
    switch (activeTab) {
      case 0: return <PersonalTab data={detail} fields={SECTIONS[0].fields} full={true} />;
      case 1: return <PersonalTab data={detail} fields={SECTIONS[1].fields} full={true} />;
      case 2: return <PersonalTab data={detail} fields={SECTIONS[2].fields} full={false} />;
      case 3: return <DocumentsTab data={detail} />;

      default: return null;
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Dim overlay */}
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Handle */}
        <View style={s.handleWrap}><View style={s.handle} /></View>

        {/* Profile header */}
        <View style={s.profileRow}>
          <View style={[s.sheetAvatar, s.avBlue]}>
            <Text  ><Icon name='account-circle' size={30} color={COLORS.white} /> </Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.sheetName}>{customer?.['Customer Name']}</Text>
            <Text style={s.sheetAcct}>{customer?.lan}</Text>
            <View style={[s.typeBadge, s.typeBadgeA]}>
              <Text style={[s.typeBadgeTxt, s.typeBadgeTxtA]}>
                {customer?.['Borrower Type']}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabsScroll}
          contentContainerStyle={s.tabsContent}
        >
          {SECTIONS.map((tab, i) => (
            <TouchableOpacity
              key={i}
              style={[s.tabBtn, activeTab === i && s.tabBtnActive]}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.75}
            >
              <Text style={[s.tabTxt, activeTab === i && s.tabTxtActive]}>{tab.tabname}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.tabDivider} />

        {/* Active tab content */}
        <View style={s.tabContent}>{renderTab()}</View>

      </Animated.View>
    </Modal>
  );
};

// ─── Customer Card ────────────────────────────────────────────────────────────

const CustomerCard = ({ item, onPress }) => {
  const isApplicant = item.type === 'Applicant';
  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={[s.avatar, s.avatarA]}>
        <Text  ><Icon name='account-circle' size={25} color={COLORS.white} /> </Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardName}>{item?.['Customer Name']}</Text>
        <Text style={s.cardSub}>{item?.lan}</Text>
      </View>
      <View style={[s.badge, s.badgeA]}>
        <Text style={[s.badgeTxt, s.badgeTxtA]}>{item?.['Borrower Type']}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CustomerListScreen = ({ route, navigation }) => {
  const [selected, setSelected] = useState(null);
  const [customerlist, setCustomerlist] = useState([]);
  const [loader,        setLoader]        = useState(true);

  const getCustomerList = async () => {
    try {

      let result = await Api.send(route.params, 'secure_borrowerdetails/getcustomerList');
      setCustomerlist(result);
      setLoader(false); 
      console.log(result);

    } catch (error) {
      console.log(error);
      setLoader(false);
    }
  }
  useEffect(() => {
    getCustomerList()
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: COLORS.primary }]} >
        <View style={s.headerNav}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Customer List</Text>
        </View>
        {/* <View style={s.statsRow}>
          <View style={s.statChip}>
            <Text style={s.statNum}>{applicants.length}</Text>
            <Text style={s.statLbl}>Applicants</Text>
          </View>
          <View style={s.statChip}>
            <Text style={s.statNum}>{coApplicants.length}</Text>
            <Text style={s.statLbl}>Co-Applicants</Text>
          </View>
          <View style={s.statChip}>
            <Text style={s.statNum}>{CUSTOMERS.length}</Text>
            <Text style={s.statLbl}>Total</Text>
          </View>
        </View> */}
      </View>

      {/* Account Badge */}
      <View style={s.accountBadge}>
        <View style={s.accountIcon}>
          <Text>
            <Icon name='clipboard-text-outline' size={25} color={COLORS.white} />
          </Text>

        </View>
        <View>
          <Text style={s.accountLbl}>Account Number</Text>
          <Text style={s.accountNum}> {route.params?.account_no}</Text>
        </View>
      </View>

      {/* Customer List */}
      <ScrollView
        style={s.listScroll}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Applicants */}
        <View style={s.sectionRow}>

          <View style={s.sectionLine} />
        </View>
        {customerlist.map((item, index) => (
          <CustomerCard key={index} item={item} onPress={setSelected} />
        ))}


      </ScrollView>

      {/* Detail Sheet */}
      <DetailSheet
        visible={!!selected}
        customer={selected}
        onClose={() => setSelected(null)}
      />

       {loader && <Loader />}
    </SafeAreaView>
  );
};

export default CustomerListScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.grey100 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerNav: { flexDirection: 'row', alignItems: 'center', gap: 12, },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 24, lineHeight: 28, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 10,
    paddingHorizontal: 12, alignItems: 'center',
  },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  statLbl: { color: C.blue200, fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Account
  accountBadge: {
    marginHorizontal: 16, marginTop: 14, backgroundColor: C.blue50,
    borderWidth: 1.5, borderColor: C.blue200, borderRadius: 14,
    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  accountIcon: { width: 36, height: 36, backgroundColor: C.blue500, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accountLbl: { fontSize: 10, fontWeight: '600', color: C.grey500, textTransform: 'uppercase', letterSpacing: 0.7 },
  accountNum: { fontFamily: 'Courier New', fontSize: 13, fontWeight: '500', color: C.blue700 },

  // List
  listScroll: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 8 },
  sectionLbl: { fontSize: 10, fontWeight: '700', color: C.grey500, textTransform: 'uppercase', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.grey300 },

  // Customer card
  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(203,213,225,0.5)',
  },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarA: { backgroundColor: C.blue500, elevation: 4 },
  avatarC: { backgroundColor: '#64748B', elevation: 4 },
  avatarTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: C.grey800, lineHeight: 20 },
  cardSub: { fontFamily: 'Courier New', fontSize: 11, color: C.grey500, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, flexShrink: 0 },
  badgeA: { backgroundColor: C.blue100, borderColor: C.blue200 },
  badgeC: { backgroundColor: C.grey100, borderColor: C.grey300 },
  badgeTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  badgeTxtA: { color: C.blue700 },
  badgeTxtC: { color: C.grey500 },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,31,74,0.55)' },

  // Sheet
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SHEET_HEIGHT,
    backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  handleWrap: { alignItems: 'center', paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.grey300 },

  // Profile
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  sheetAvatar: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avBlue: { backgroundColor: COLORS.primary, elevation: 6 },
  avGrey: { backgroundColor: '#64748B', elevation: 6 },
  sheetAvatarTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileInfo: { flex: 1 },
  sheetName: { fontSize: 16, fontWeight: '700', color: C.blue900, letterSpacing: -0.2 },
  sheetAcct: { fontFamily: 'Courier New', fontSize: 11, color: C.grey500, marginTop: 2 },
  typeBadge: { alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  typeBadgeA: { backgroundColor: C.blue100, borderColor: C.blue200 },
  typeBadgeC: { backgroundColor: C.grey100, borderColor: C.grey300 },
  typeBadgeTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  typeBadgeTxtA: { color: C.blue700 },
  typeBadgeTxtC: { color: C.grey500 },
  closeBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.grey100, borderWidth: 1, borderColor: C.grey200, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 12, color: C.grey500, fontWeight: '600' },

  // Tabs
  tabsScroll: { marginTop: 12, height: 20, maxHeight: 50 },
  tabsContent: { alignItems: 'center', paddingHorizontal: 16, gap: 6, flexDirection: 'row' },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.grey300, backgroundColor: C.white },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, elevation: 4 },
  tabTxt: { fontSize: 11, fontWeight: '600', color: C.grey500 },
  tabTxtActive: { color: '#fff' },
  tabDivider: { height: 1, backgroundColor: C.grey200, marginTop: 10 },
  tabContent: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

  // Field grid
  fGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  fCell: { width: '47.5%', backgroundColor: C.grey100, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: C.grey200 },
  fCellFull: { width: '100%' },
  fLbl: { fontSize: 9, fontWeight: '700', color: C.grey500, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 },
  fVal: { fontSize: 13, fontWeight: '600', color: C.grey800, lineHeight: 18 },
  fMono: { fontFamily: 'Courier New', fontSize: 12, letterSpacing: 0.3 },

  // Section title
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6 },
  secTitle: { fontSize: 10, fontWeight: '700', color: C.grey500, textTransform: 'uppercase', letterSpacing: 1 },
  secLine: { flex: 1, height: 1, backgroundColor: C.grey200 },

  // Doc card
  docCard: {
    backgroundColor: C.white, borderRadius: 13, padding: 11,
    borderWidth: 1.5, borderColor: C.grey200, flexDirection: 'row',
    alignItems: 'center', gap: 11, marginBottom: 8, elevation: 1,
  },
  docIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: COLORS.primary },
  docEmoji: { fontSize: 17 },
  docBody: { flex: 1, minWidth: 0 },
  docType: { fontSize: 9, fontWeight: '700', color: C.grey500, textTransform: 'uppercase', letterSpacing: 0.7 },
  docNum: { fontFamily: 'Courier New', fontSize: 12, fontWeight: '600', color: C.grey800, marginTop: 2 },
  docSub: { fontSize: 10, color: C.grey500, marginTop: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, flexShrink: 0 },
  pillV: { backgroundColor: C.green100, borderColor: C.green200 },
  pillP: { backgroundColor: '#FEF9C3', borderColor: '#FDE68A' },
  pillTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillTxtV: { color: C.green700 },
  pillTxtP: { color: '#854D0E' },
  // Score
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  scoreRingOuter: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.blue500, alignItems: 'center', justifyContent: 'center', flexShrink: 0, elevation: 5 },
  scoreRingInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 15, fontWeight: '700', color: C.blue700 },
  scoreMeta: { flex: 1 },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: C.grey800 },
  scoreSub: { fontSize: 10, color: C.grey500, marginTop: 2 },
  scoreBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  scoreBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.grey200 },
  scoreBarFill: { height: 6, borderRadius: 3, backgroundColor: C.blue500 },
  scoreBarLbl: { fontSize: 9, color: C.grey500, fontWeight: '600' },
});
