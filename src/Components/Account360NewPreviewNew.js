import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";
import { Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import Loader from "./Loader";

// ─── helpers ──────────────────────────────────────────────────────────────────
const safeStr = (v) => (v === null || v === undefined ? "—" : String(v));

const hasValue = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" && String(v).trim() !== "—";

// ─── section config ───────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: "account",
    title: "Account Information",
    icon: "account-circle",
    iconBg: "#1A3C8F",
    feild: [
      { key: "Account no",   label: "Account no" },
      { key: "Name",         label: "Name" },
      { key: "Selling Bank", label: "Selling Bank" },
      { key: "Trust code",   label: "Trust code" },
      { key: "Loan Type",    label: "Loan Type" },
      { key: "Deal Type",    label: "Deal Type" },
      { key: "Zone",         label: "Zone" },
      { key: "Allocate to",  label: "Allocate to" },
    ],
  },
  {
    key: "loan_details",
    title: "Original Loan Details",
    icon: "card-account-details",
    iconBg: "#1565C0",
    feild: [
      { key: "Disbursement date",   label: "Disbursement date" },
      { key: "Disbursement amount", label: "Disbursement amount" },
      { key: "NPA Date",            label: "NPA Date" },
      { key: "EMI Amount",          label: "EMI Amount" },
    ],
  },
  {
    key: "financial",
    title: "Financial Details",
    icon: "currency-inr",
    iconBg: "#0D47A1",
    feild: [
      { key: "Acq POS",         label: "Acquired POS" },
      { key: "POS",             label: "Current POS" },
      { key: "TOS",             label: "Current TOS" },
      { key: "EMI Outstanding", label: "EMI Outstanding" },
      { key: "Overdue Amount",  label: "Overdue Amount" },
    ],
  },
  {
    key: "disposition_summary",
    title: "Latest Disposition Summary",
    icon: "clipboard-list",
    iconBg: "#1976D2",
    feild: [
      { key: "reason",                   label: "Reason" },
      { key: "Last FV Status",           label: "Last FV Disposition" },
      { key: "last_fv_subdisposition",   label: "Last FV Subdisposition" },
      { key: "Last SV Status",           label: "Last SV Disposition" },
      { key: "last_sv_subdisposition",   label: "Last SV Subdisposition" },
      { key: "Last Calling status",      label: "Last Calling Disposition" },
      { key: "last_call_subdisposition", label: "Last Call Subdisposition" },
    ],
  },
  {
    key: "resolution",
    title: "Resolution Status",
    icon: "check-decagram",
    iconBg: "#1565C0",
    feild: [
      { key: "Resolution type",                label: "Resolution Status" },
      { key: "Date",                           label: "Date" },
      { key: "Resolution Amount",              label: "Resolution Amount" },
      { key: "Last RP",                        label: "Last RP" },
      { key: "Payment Paid (Post resolution)", label: "Payment Paid" },
      { key: "Status - Success/Broken/Failed", label: "Status" },
    ],
  },
  {
    key: "legal",
    title: "Legal Details",
    icon: "gavel",
    iconBg: "#283593",
    feild: [
      { key: "Current SARFAESI Stage", label: "Current SARFAESI Stage" },
      { key: "Litigation",             label: "Litigation" },
    ],
  },
  {
    key: "other_loan",
    title: "Linked Link Loans",
    icon: "link-variant",
    iconBg: "#1A237E",
    feild: [
      { key: "Link Loan account number", label: "Link Loan account number" },
    ],
  },
  {
    key: "collateral",
    title: "Collateral Details",
    icon: "home-city",
    iconBg: "#0D47A1",
  },
];

// ─── Stat strip config ────────────────────────────────────────────────────────
const STAT_CONFIG = [
  { dataKey: "TOS",             label: "Current TOS",     icon: "chart-line",   color: "#1A56DB" },
  { dataKey: "Overdue Amount",  label: "Overdue Amount",  icon: "alert-circle", color: "#EF4444" },
  { dataKey: "EMI Outstanding", label: "EMI Outstanding", icon: "clock-alert",  color: "#F59E0B" },
];

// ─── Empty rows inside an accordion ──────────────────────────────────────────
const EmptyRows = () => (
  <View style={styles.emptyRows}>
    <Icon name="database-off-outline" size={28} color="#BFDBFE" />
    <Text style={styles.emptyRowsText}>No data available</Text>
  </View>
);

// ─── Full-page: data came back empty ─────────────────────────────────────────
const NoDataScreen = ({ onRefresh }) => (
  <View style={styles.fullStateWrap}>
    <View style={[styles.fullStateIcon, { backgroundColor: "#EEF2FF" }]}>
      <Icon name="database-off-outline" size={52} color="#93C5FD" />
    </View>
    <Text style={styles.fullStateTitle}>No Data Found</Text>
    <Text style={styles.fullStateSub}>
      We couldn't load the 360° view details.{"\n"}Please try again.
    </Text>
    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
      <Icon name="refresh" size={18} color="#fff" />
      <Text style={styles.refreshBtnText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

// ─── Full-page: API / network error ──────────────────────────────────────────
const ApiErrorScreen = ({ onRefresh }) => (
  <View style={styles.fullStateWrap}>
    <View style={[styles.fullStateIcon, { backgroundColor: "#FEE2E2" }]}>
      <Icon name="wifi-off" size={52} color="#FCA5A5" />
    </View>
    <Text style={styles.fullStateTitle}>Something Went Wrong</Text>
    <Text style={styles.fullStateSub}>
      Unable to fetch data. Check your{"\n"}connection and try again.
    </Text>
    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
      <Icon name="refresh" size={18} color="#fff" />
      <Text style={styles.refreshBtnText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);
// ─────────────────────────────────────────────────────────────────────────────
const Account360NewPreviewNew = ({ route, navigation }) => {
  const [loandata,         setLoandata]         = useState([]);
  const [data360,          set360data]          = useState([]);
  const [loader,           setLoader]           = useState(true);
  const [apiError,         setApiError]         = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const [animations] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, new Animated.Value(0)]))
  );

  useEffect(() => {
    fetchAll();
  }, []);

  // ── fetch wrapper used for first load and refresh ──────────────────────────
  const fetchAll = () => {
    setLoader(true);
    setApiError(false);
    set360data([]);
    setLoandata([]);
    SECTIONS.forEach((s) => animations[s.key].setValue(0));
    setExpandedSections({});
    getSecuredLoanViewDetails();
    get360view();
  };

  // ── API calls (logic completely unchanged) ─────────────────────────────────
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
      if (result?.[0]?.["Link Loan account number"]) {
        const linkloan = result[0]["Link Loan account number"].split("<br>");
        result[0]["Link Loan account number"] = linkloan.join(",");
      }
      if (result) set360data(result);
      setLoader(false);
    } catch (e) {
      console.log(e);
      setApiError(true);
      setLoader(false);
    }
  };

  // ── toggle accordion ───────────────────────────────────────────────────────
  const toggleSection = (sectionKey) => {
    const isOpen = expandedSections[sectionKey];
    Animated.spring(animations[sectionKey], {
      toValue: isOpen ? 0 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: !isOpen }));
  };

  // ── render one KV row ──────────────────────────────────────────────────────
  const renderRow = (label, value, index) => (
    <View key={index} style={[styles.row, index % 2 === 0 && styles.rowShaded]}>
      <View style={styles.rowDot} />
      <Text style={styles.rowLabel} numberOfLines={2}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{safeStr(value)}</Text>
    </View>
  );

  // ── render accordion section card ──────────────────────────────────────────
  const renderSection = (section, data) => {
    if (!data || typeof data !== "object") return null;

    const entries    = section.feild;
    const isOpen     = expandedSections[section.key];
    const hasAnyData = entries.some((f) => hasValue(data[f.key]));
    const bodyHeight = hasAnyData ? entries.length * 46 + 12 : 88;

    const animatedHeight = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: [0, bodyHeight],
    });
    const rotateChevron = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    return (
      <View key={section.key} style={[styles.card, isOpen && styles.cardOpen]}>
        {/* ── Header tap row ── */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleSection(section.key)}
          activeOpacity={0.82}
        >
          <View style={[styles.iconBadge, { backgroundColor: section.iconBg }]}>
            <Icon name={section.icon} size={19} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <View style={[styles.chevronWrap, isOpen && styles.chevronWrapOpen]}>
            <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
              <Icon name="chevron-down" size={18} color={isOpen ? "#1A56DB" : "#94A3B8"} />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {isOpen && <View style={styles.divider} />}

        {/* ── Animated body ── */}
        <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
          <View style={styles.cardBody}>
            {hasAnyData
              ? entries.map((field, i) => renderRow(field.label, data[field.key], i))
              : <EmptyRows />}
          </View>
        </Animated.View>
      </View>
    );
  };

  // ── render collateral section ──────────────────────────────────────────────
  const renderCollateralSection = (items) => {
    const section   = SECTIONS[7];
    const isOpen    = expandedSections[section.key];
    const totalRows = items.reduce((acc, item) => acc + Object.keys(item).length, 0);
    const bodyHeight = items.length > 0
      ? totalRows * 46 + items.length * 44 + 24
      : 88;

    const animatedHeight = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: [0, bodyHeight],
    });
    const rotateChevron = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    return (
      <View key={section.key} style={[styles.card, isOpen && styles.cardOpen]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleSection(section.key)}
          activeOpacity={0.82}
        >
          <View style={[styles.iconBadge, { backgroundColor: section.iconBg }]}>
            <Icon name={section.icon} size={19} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <View style={[styles.chevronWrap, isOpen && styles.chevronWrapOpen]}>
            <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
              <Icon name="chevron-down" size={18} color={isOpen ? "#1A56DB" : "#94A3B8"} />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {isOpen && <View style={styles.divider} />}

        <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
          {items.length > 0 ? (
            <View style={styles.collateralList}>
              {items.map((item, idx) => (
                <View key={idx} style={styles.collateralItem}>
                  <View style={styles.collateralItemHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Icon name="home-city-outline" size={14} color={section.iconBg} />
                      <Text style={[styles.collateralItemLabel, { color: section.iconBg }]}>
                        Collateral #{idx + 1}
                      </Text>
                    </View>
                    {item["Property Type"] ? (
                      <View style={[styles.collateralTypeBadge, { backgroundColor: section.iconBg }]}>
                        <Text style={styles.collateralTypeBadgeText}>
                          {safeStr(item["Property Type"])}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {Object.entries(item).map(([k, v], i) => (
                    <View key={i} style={[styles.row, i % 2 === 0 && styles.rowShaded]}>
                      <View style={styles.rowDot} />
                      <Text style={styles.rowLabel}>{k}</Text>
                      <Text style={styles.rowValue}>{safeStr(v)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.cardBody}>
              <EmptyRows />
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  // ── main render ───────────────────────────────────────────────────────────
  const row0 = data360?.[0] ?? null;
  console.log("360 data:_______________________", data360);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1240A8" />

      {/* ── Header (always visible) ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        {/* nav bar */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>360° View</Text>
          {/* inline refresh icon — visible after first load */}
          {!loader && (
            <TouchableOpacity
              style={styles.headerRefreshBtn}
              onPress={fetchAll}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* frosted account card (shows only when data is loaded) */}
        {row0 && (
          <View style={styles.accountCard}>
            <View style={styles.accountCardTop}>
              <View style={styles.avatarCircle}>
                <Icon name="account" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountNo} numberOfLines={1}>
                  {safeStr(row0["Account no"])}
                </Text>
                <Text style={styles.accountName} numberOfLines={1}>
                  {safeStr(row0["Name"])}
                </Text>
              </View>
            </View>
            <View style={styles.tagRow}>
              {[row0["Loan Type"], row0["Zone"], row0["Trust code"]]
                .filter(Boolean)
                .map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{String(tag)}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </View>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {!loader && (
        <>
          {/* State 1 – API / network hard error */}
          {apiError && <ApiErrorScreen onRefresh={fetchAll} />}

          {/* State 2 – API succeeded but returned no data */}
          {!apiError && !row0 && <NoDataScreen onRefresh={fetchAll} />}

          {/* State 3 – Happy path */}
          {!apiError && row0 && (
            <>
              {/* stat strip */}
              <View style={styles.statStrip}>
                {STAT_CONFIG.map((s, i) => (
                  <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
                    <View style={[styles.statIconWrap, { backgroundColor: s.color + "18" }]}>
                      <Icon name={s.icon} size={14} color={s.color} />
                    </View>
                    <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>
                      {hasValue(row0[s.dataKey]) ? safeStr(row0[s.dataKey]) : "—"}
                    </Text>
                    <Text style={styles.statLabel} numberOfLines={2}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* accordion list */}
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
                {renderCollateralSection(loandata)}
                <View style={{ height: 32 }} />
              </ScrollView>
            </>
          )}
        </>
      )}

      {loader && <Loader />}
    </SafeAreaView>
  );
};

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF2FF" },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: "#1240A8",
    paddingTop: Platform.OS === "android" ? 20 : 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute", top: -40, right: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  decorCircle2: {
    position: "absolute", bottom: -10, left: -30,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  decorCircle3: {
    position: "absolute", top: 20, right: 90,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  navRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginBottom: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  navTitle: {
    flex: 1, color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3,
  },
  headerRefreshBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },

  accountCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    gap: 10,
  },
  accountCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  accountNo: {
    color: "rgba(255,255,255,0.72)", fontSize: 11,
    fontWeight: "600", letterSpacing: 1.2, marginBottom: 2,
  },
  accountName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  tagText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // ── Stat strip ──────────────────────────────────────────────────────────────
  statStrip: {
    flexDirection: "row",
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 2, gap: 8,
  },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 6,
    alignItems: "center", borderTopWidth: 3,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, gap: 3,
  },
  statIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  statValue: { fontSize: 11, fontWeight: "800" },
  statLabel: { fontSize: 9, color: "#94A3B8", fontWeight: "600", textAlign: "center" },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12 },

  // ── Accordion card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    marginBottom: 10, overflow: "hidden",
    elevation: 2, shadowColor: "#1A56DB", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    borderWidth: 1.5, borderColor: "#EEF2FF",
  },
  cardOpen: {
    borderColor: "rgba(59,130,246,0.22)", elevation: 4, shadowOpacity: 0.11,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  iconBadge: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
    elevation: 3, shadowColor: "#1A3C8F",
    shadowOpacity: 0.28, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1E293B" },
  chevronWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center",
  },
  chevronWrapOpen: { backgroundColor: "rgba(26,86,219,0.10)" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 14 },

  cardBody: { paddingBottom: 8 },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
  },
  rowShaded: { backgroundColor: "#F8FAFC" },
  rowDot:   { width: 5, height: 5, borderRadius: 3, flexShrink: 0, backgroundColor: "#93C5FD" },
  rowLabel: { flex: 1.1, fontSize: 13, color: "#64748B", fontWeight: "500" },
  rowValue: { flex: 1, fontSize: 13, color: "#0F172A", fontWeight: "700", textAlign: "right" },

  // ── Empty rows inside accordion ──────────────────────────────────────────────
  emptyRows: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 22, gap: 6,
  },
  emptyRowsText: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },

  // ── Collateral sub-cards ─────────────────────────────────────────────────────
  collateralList: { padding: 10, gap: 10 },
  collateralItem: {
    borderWidth: 1.5, borderColor: "#DBEAFE",
    borderRadius: 12, overflow: "hidden", marginBottom: 8,
  },
  collateralItemHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", padding: 10,
    backgroundColor: "#EEF2FF",
    borderBottomWidth: 1, borderBottomColor: "#DBEAFE",
  },
  collateralItemLabel: { fontSize: 12, fontWeight: "700" },
  collateralTypeBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  collateralTypeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // ── Full-page states (no data / error) ───────────────────────────────────────
  fullStateWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 12,
  },
  fullStateIcon: {
    width: 100, height: 100, borderRadius: 24,
    justifyContent: "center", alignItems: "center", marginBottom: 4,
  },
  fullStateTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", textAlign: "center" },
  fullStateSub:   { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20 },
  refreshBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1A56DB",
    paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 12, marginTop: 8,
    elevation: 4, shadowColor: "#1A56DB",
    shadowOpacity: 0.35, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
  },
  refreshBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

export default Account360NewPreviewNew;
