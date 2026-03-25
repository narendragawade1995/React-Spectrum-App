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
        {/* decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        {/* nav row — back + title + refresh */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>360° View</Text>
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

        {/* Option B hero — big account number + customer + badges */}
        {row0 && (
          <>
            {/* Account number hero */}
            <View style={styles.accHero}>
              <Text style={styles.accHeroLbl}>Account Number</Text>
              <Text style={styles.accHeroNo} numberOfLines={1}>
                {safeStr(row0["Account no"])}
              </Text>
            </View>

            {/* Customer name · Bank */}
            <View style={styles.custRow}>
              <View style={styles.custDot} />
              <Text style={styles.custName} numberOfLines={1}>
                {safeStr(row0["Name"])}
              </Text>
              {hasValue(row0["Selling Bank"]) && (
                <>
                  <View style={styles.custSep} />
                  <Text style={styles.custBank} numberOfLines={1}>
                    {safeStr(row0["Selling Bank"])}
                  </Text>
                </>
              )}
            </View>

            {/* Inline colour badges: Overdue · Trust · TOS · Zone */}
            <View style={styles.badgeStrip}>
              {hasValue(row0["Overdue Amount"]) && (
                <View style={[styles.infoBadge, styles.badgeRed]}>
                  <Text style={[styles.infoBadgeLbl, styles.badgeRedLbl]}>Overdue</Text>
                  <Text style={[styles.infoBadgeVal, styles.badgeRedVal]}>
                    {safeStr(row0["Overdue Amount"])}
                  </Text>
                </View>
              )}
              {hasValue(row0["Trust code"]) && (
                <View style={[styles.infoBadge, styles.badgeWhite]}>
                  <Text style={[styles.infoBadgeLbl, styles.badgeWhiteLbl]}>Trust</Text>
                  <Text style={[styles.infoBadgeVal, styles.badgeWhiteVal]}>
                    {safeStr(row0["Trust code"])}
                  </Text>
                </View>
              )}
              {hasValue(row0["TOS"]) && (
                <View style={[styles.infoBadge, styles.badgeGreen]}>
                  <Text style={[styles.infoBadgeLbl, styles.badgeGreenLbl]}>TOS</Text>
                  <Text style={[styles.infoBadgeVal, styles.badgeGreenVal]}>
                    {safeStr(row0["TOS"])}
                  </Text>
                </View>
              )}
              {hasValue(row0["Zone"]) && (
                <View style={[styles.infoBadge, styles.badgeNeutral]}>
                  <Text style={[styles.infoBadgeLbl, styles.badgeNeutralLbl]}>Zone</Text>
                  <Text style={[styles.infoBadgeVal, styles.badgeNeutralVal]}>
                    {safeStr(row0["Zone"])}
                  </Text>
                </View>
              )}
            </View>
          </>
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

  // ── Header — Option B (account hero + inline badges) ────────────────────────
  header: {
    backgroundColor: "#1240A8",
    paddingTop: Platform.OS === "android" ? 20 : 30,
    paddingBottom: 20,
    paddingHorizontal: 18,
    overflow: "hidden",
    // flat bottom — no borderRadius
  },
  decorCircle1: {
    position: "absolute", bottom: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  decorCircle2: {
    position: "absolute", top: -20, right: 40,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(37,99,235,0.45)",
  },
  decorCircle3: {
    position: "absolute", top: -30, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  // nav row
  navRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginBottom: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.20)",
    justifyContent: "center", alignItems: "center",
  },
  navTitle: {
    flex: 1, color: "#fff", fontSize: 17, fontWeight: "600", letterSpacing: 0.1,
  },
  headerRefreshBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.20)",
    justifyContent: "center", alignItems: "center",
  },

  // account number hero
  accHero: { marginBottom: 8, zIndex: 1 },
  accHeroLbl: {
    color: "rgba(255,255,255,0.40)", fontSize: 9, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4,
  },
  accHeroNo: {
    color: "#fff", fontSize: 22, fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1, lineHeight: 26,
  },

  // customer name + bank row
  custRow: {
    flexDirection: "row", alignItems: "center",
    gap: 6, marginBottom: 16, flexWrap: "wrap",
  },
  custDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)", flexShrink: 0,
  },
  custName: {
    color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500",
  },
  custSep: {
    width: 1, height: 12,
    backgroundColor: "rgba(255,255,255,0.22)", marginHorizontal: 2,
  },
  custBank: {
    color: "rgba(255,255,255,0.40)", fontSize: 11, fontWeight: "400",
    flexShrink: 1,
  },

  // badge strip
  badgeStrip: {
    flexDirection: "row", flexWrap: "wrap", gap: 7,
  },
  infoBadge: {
    borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1,
  },
  infoBadgeLbl: {
    fontSize: 8.5, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  infoBadgeVal: {
    fontSize: 11.5, fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    marginTop: 3,
  },
  // red — Overdue
  badgeRed:      { backgroundColor: "rgba(239,68,68,0.15)",  borderColor: "rgba(239,68,68,0.25)" },
  badgeRedLbl:   { color: "rgba(252,165,165,0.80)" },
  badgeRedVal:   { color: "#FCA5A5" },
  // white/neutral — Trust
  badgeWhite:    { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" },
  badgeWhiteLbl: { color: "rgba(255,255,255,0.45)" },
  badgeWhiteVal: { color: "#fff" },
  // green — TOS
  badgeGreen:    { backgroundColor: "rgba(16,185,129,0.14)", borderColor: "rgba(16,185,129,0.22)" },
  badgeGreenLbl: { color: "rgba(110,231,183,0.75)" },
  badgeGreenVal: { color: "#6EE7B7" },
  // neutral — Zone
  badgeNeutral:    { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)" },
  badgeNeutralLbl: { color: "rgba(255,255,255,0.40)" },
  badgeNeutralVal: { color: "rgba(255,255,255,0.70)" },

  // ── kept for backward compat (unused but harmless) ───────────────────────────
  accountCard: {}, accountCardTop: {}, avatarCircle: {},
  accountNo: {}, accountName: {}, tagRow: {}, tag: {}, tagText: {},

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
