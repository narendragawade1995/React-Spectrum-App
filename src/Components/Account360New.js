import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Text, Appbar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import Loader from "./Loader";

// ─── helpers ─────────────────────────────────────────────────────────────────
const safeStr = (v) => (v === null || v === undefined ? "—" : String(v));



// ─── section config ───────────────────────────────────────────────────────────
const SECTIONS = [
  { key: "account",           title: "Account Information",       icon: "account-circle",         accent: "#1A3C8F" , feild: [
      { key: "Account no", label: "Account no" },
      { key: "Name", label: "Name" },
      { key: "Selling Bank", label: "Selling Bank" },
      { key: "Trust code", label: "Trust code" },
      { key: "Loan Type", label: "Loan Type" },
      { key: "Deal Type", label: "Deal Type" },
      { key: "Zone", label: "Zone" },
      { key: "Allocate to", label: "Allocate to" }
    ]},
  { key: "loan_details",      title: "Original Loan Details",              icon: "card-account-details",   accent: "#1565C0" , feild: [
      { key: "Disbursement date", label: "Disbursement date" },
      { key: "Disbursement amount", label: "Disbursement amount" },
      { key: "NPA Date", label: "NPA Date" },
      { key: "EMI Amount", label: "EMI Amount" }
    ]},
  { key: "financial",         title: "Financial Details",        icon: "currency-inr",           accent: "#0277BD" ,feild: [
      { key: "Acq POS", label: "Acquired POS" },
      { key: "POS", label: "Current POS" },
      { key: "TOS", label: "Current TOS" },
      { key: "EMI Outstanding", label: "EMI Outstanding" },
      { key: "Overdue Amount", label: "Overdue Amount" }
    ]},
  { key: "disposition_summary",title: "Latest Disposition Summary",     icon: "clipboard-list",         accent: "#00838F", feild: [
      { key: "reason", label: "reason" },
      { key: "Last FV Status", label: "Last FV Disposition" },
      { key: "last_fv_subdisposition", label: "Last FV Subdisposition" },
      { key: "Last SV Status", label: "Last SV Disposition" },
      { key: "last_sv_subdisposition", label: "Last SV Subdisposition" },
      { key: "Last Calling status", label: "Last Calling Disposition" },
      { key: "last_call_subdisposition", label: "Last Call Subdisposition" }
    ] },
  { key: "resolution",        title: "Resolution Status",         icon: "check-decagram",         accent: "#2E7D32" ,feild: [
      { key: "Resolution type", label: "Resolution Status" },
      { key: "Date", label: "Date" },
      { key: "Resolution Amount", label: "Resolution Amount" },
      { key: "Last RP", label: "Last RP" },
      { key: "Payment Paid (Post resolution)", label: "Payment Paid" },
      { key: "Status - Success/Broken/Failed", label: "Status" }
    ]},
  { key: "legal",             title: "Legal Details",             icon: "gavel",                  accent: "#6A1B9A" ,feild: [
      { key: "Current SARFAESI Stage", label: "Current SARFAESI Stage" },
      { key: "Litigation", label: "Litigation" }
    ]},
  { key: "other_loan",        title: "Linked Link Loans",              icon: "link-variant",           accent: "#E65100" , feild: [
      { key: "Link Loan account number", label: "Link Loan account number" }
    ]},
  { key: "collateral",        title: "Collateral Details",        icon: "home-city",              accent: "#37474F" },
];

// ─── component ────────────────────────────────────────────────────────────────
const Account360 = ({ route, navigation }) => {
  const [loandata,      setLoandata]      = useState([]);
  const [data360,       set360data]       = useState([]);
  const [loader,        setLoader]        = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  const [animations] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, new Animated.Value(0)]))
  );

  useEffect(() => {
    getSecuredLoanViewDetails();
    get360view();
  }, []);

  // ── API calls ──────────────────────────────────────────────────────────────
  const getSecuredLoanViewDetails = async () => {
    try {
      const result = await Api.get(
        `securedloanview/getSecuredLoanViewDetails?LoanAccountNo=${route.params.account_no}&ViewType=Collateral View`
      );
      setLoandata(result.SecuredLoanViewData || []);
    } catch (e) {
      console.log(e);
      setLoader(false);
    }
  };

  const get360view = async () => {
    try {
      const result = await Api.send(
        { account_number: route.params.account_no, from: route.params.secure ? false : true },
        "secure_borrowerdetails/get360viewData"
      );
       if (result?.[0]?.['Link Loan account number']) {
        const linkloan = result[0]['Link Loan account number'].split('<br>');
         result[0]['Link Loan account number'] = linkloan.join(',');
      };
      if (result) set360data(result);
      setLoader(false);
    } catch (e) {
      console.log(e);
      setLoader(false);
    }
  };

  // ── toggle accordion ───────────────────────────────────────────────────────
  const toggleSection = (section, itemCount) => {
    const isOpen = expandedSections[section];
    Animated.spring(animations[section], {
      toValue: isOpen ? 0 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
    setExpandedSections((prev) => ({ ...prev, [section]: !isOpen }));
  };

  // ── render collateral section (array of objects) ──────────────────────────
  const renderCollateralSection = (items) => {
    const section  = SECTIONS[7];
    const isOpen   = expandedSections[section.key];
    const totalRows = items.reduce((acc, item) => acc + Object.keys(item).length, 0);
    const animatedHeight = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: [0, totalRows * 46 + items.length * 44 + 24],
    });
    const rotateChevron = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    return (
      <View key={section.key} style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleSection(section.key)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBadge, { backgroundColor: COLORS.primary }]}>
            <Icon name={section.icon} size={18} color={COLORS.white} />
          </View>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <View style={styles.headerRight}>
            {/* {isOpen && (
              <View style={[styles.countBadge, { backgroundColor: section.accent + "22" }]}>
                <Text style={[styles.countText, { color: section.accent }]}>{items.length} items</Text>
              </View>
            )} */}
            <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
              <Icon name="chevron-down" size={22} color="#94A3B8" />
            </Animated.View>
          </View>
        </TouchableOpacity>
        <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
          <View style={styles.collateralList}>
            {items.map((item, idx) => (
              <View key={idx} style={styles.collateralItem}>
                <View style={styles.collateralItemHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icon name="home-city-outline" size={15} color={section.accent} />
                    <Text style={[styles.collateralItemLabel, { color: section.accent }]}>
                      Collateral #{idx + 1}
                    </Text>
                  </View>
                  {item["Property Type"] ? (
                    <View style={[styles.collateralTypeBadge, { backgroundColor: section.accent }]}>
                      <Text style={styles.collateralTypeBadgeText}>{safeStr(item["Property Type"])}</Text>
                    </View>
                  ) : null}
                </View>
                {Object.entries(item).map(([k, v], i) => (
                  <View key={i} style={[styles.row, i % 2 === 0 && styles.rowShaded]}>
                    <View style={[styles.rowDot, { backgroundColor: section.accent }]} />
                    <Text style={styles.rowLabel}>{k}</Text>
                    <Text style={styles.rowValue}>{safeStr(v)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  };

  // ── render one row ─────────────────────────────────────────────────────────
  const renderRow = (key, value, index, accent) => (
    <View
      key={index}
      style={[styles.row, index % 2 === 0 && styles.rowShaded]}
    >
      <View style={[styles.rowDot, { backgroundColor: accent }]} />
      <Text style={styles.rowLabel} numberOfLines={1}>
        {key}
      </Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {safeStr(value)}
      </Text>
    </View>
  );

  // ── render accordion card ──────────────────────────────────────────────────
  const renderSection = (section, data) => {
    if (!data || typeof data !== "object") return null;
    //const entries = Object.entries(data);
    const entries =  section.feild;
    const isOpen  = expandedSections[section.key];
    const ROW_H   = 46;
    const PADDING  = 12;
    const animatedHeight = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: [0, entries.length * ROW_H + PADDING],
    });

    const rotateChevron = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    return (
      <View key={section.key} style={styles.card}>
        {/* header strip */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleSection(section.key, entries.length)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBadge, { backgroundColor:  COLORS.primary }]}>
            <Icon name={section.icon} size={18} color={COLORS.white} /> 
          </View>

          <Text style={styles.cardTitle}>{section.title}</Text>

          <View style={styles.headerRight}>
            {/* {isOpen && (
              <View style={[styles.countBadge, { backgroundColor: section.accent + "22" }]}>
                <Text style={[styles.countText, { color: section.accent }]}>
                  {entries.length}
                </Text>
              </View>
            )} */}
            <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
              <Icon name="chevron-down" size={22} color="#94A3B8" />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* expandable body */}
        <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
          <View style={styles.cardBody}>
            {entries.map((field, i) => renderRow(field.label, data[field.key], i, section.accent))}
          </View>
        </Animated.View>
      </View>
    );
  };

  // ── main render ───────────────────────────────────────────────────────────
  const row0 = data360?.[0] ?? null;
  console.log("360 data:_______________________", data360);
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── AppBar ── */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation?.goBack()} color="#fff" />
        <Appbar.Content title="360° View" titleStyle={[styles.appbarTitle ]} />
      </Appbar.Header>

      {row0 && (
        <>
          {/* ── Hero banner ── */}
          <View style={styles.hero}>
            {/* <View style={styles.heroBadge}>
              <Icon name="view-dashboard" size={16} color="#fff" />
              <Text style={styles.heroBadgeText}>360° View</Text>
            </View> */}
            <Text style={styles.heroAccount}>{safeStr(row0["Account no"])}</Text>
            <Text style={styles.heroName}>{safeStr(row0["Name"])}</Text>

            {/* quick stat pills */}
            {/* <View style={styles.pills}>
              {row0["Loan Type"] ? (
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Loan Type</Text>
                  <Text style={styles.pillVal}>{safeStr(row0["Loan Type"])}</Text>
                </View>
              ) : null}
              {row0["Overdue Amount"] ? (
                <View style={[styles.pill, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
                  <Text style={[styles.pillLabel, { color: "#FCA5A5" }]}>Overdue</Text>
                  <Text style={[styles.pillVal, { color: "#FCA5A5" }]}>
                    ₹{safeStr(row0["Overdue Amount"])}
                  </Text>
                </View>
              ) : null}
              {row0["POS"] ? (
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>POS</Text>
                  <Text style={styles.pillVal}>₹{safeStr(row0["POS"])}</Text>
                </View>
              ) : null}
            </View> */}
          </View>

          {/* ── Accordion list ── */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderSection(SECTIONS[0], row0)}
            {renderSection(SECTIONS[1], row0)}
            {renderSection(SECTIONS[2], row0)}
            {renderSection(SECTIONS[3], row0)}
            {renderSection(SECTIONS[4], row0)}
            {renderSection(SECTIONS[5], row0)}
            {renderSection(SECTIONS[6], row0)}
            {/* ✅ Collateral: render all items as sub-cards */}
            {loandata.length > 0 && renderCollateralSection(loandata)}

            <View style={{ height: 32 }} />
          </ScrollView>
        </>
      )}

      {loader && <Loader />}
    </View>
  );
};

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },

  // AppBar
  appbar: { backgroundColor: COLORS.primary, elevation: 0 },
  appbarTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Hero
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    gap: 6,
  },
  heroBadgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  heroAccount:  { color: "rgba(255,255,255,0.75)", fontSize: 13, letterSpacing: 1.5 },
  heroName:     { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 2, marginBottom: 14 },

  pills:    { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  pill:     {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 80,
  },
  pillLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  pillVal:   { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 1 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle:   { flex: 1, fontSize: 15, fontWeight: "700", color: "#1E293B" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  countText:   { fontSize: 12, fontWeight: "700" },

  // Card body
  cardBody: { paddingBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  rowShaded: { backgroundColor: "#F8FAFC" },
  rowDot:    { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  rowLabel:  { flex: 1.1, fontSize: 13, color: "#64748B", fontWeight: "500" },
  rowValue:  { flex: 1, fontSize: 13, color: "#0F172A", fontWeight: "700", textAlign: "right" },

  // Collateral multi-item
  collateralList:          { padding: 10, gap: 10 },
  collateralItem:          { borderWidth: 1.5, borderColor: "#DBEAFE", borderRadius: 12, overflow: "hidden", marginBottom: 8 },
  collateralItemHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, backgroundColor: "#EEF2FF", borderBottomWidth: 1, borderBottomColor: "#DBEAFE" },
  collateralItemLabel:     { fontSize: 12, fontWeight: "700" },
  collateralTypeBadge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  collateralTypeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});

export default Account360;
