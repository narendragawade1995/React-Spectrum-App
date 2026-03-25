import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import Loader from "./Loader";

// ─── helpers ──────────────────────────────────────────────────────────────────
const safeStr = (v) => (v === null || v === undefined ? "—" : String(v));

// ─── section config ───────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: "account", title: "Account Information", icon: "account-circle", accent: "#1A3C8F",
    feild: [
      { key: "Account no",    label: "Account no" },
      { key: "Name",          label: "Name" },
      { key: "Selling Bank",  label: "Selling Bank" },
      { key: "Trust code",    label: "Trust code" },
      { key: "Loan Type",     label: "Loan Type" },
      { key: "Deal Type",     label: "Deal Type" },
      { key: "Zone",          label: "Zone" },
      { key: "Allocate to",   label: "Allocate to" },
    ],
  },
  {
    key: "loan_details", title: "Original Loan Details", icon: "card-account-details", accent: "#1565C0",
    feild: [
      { key: "Disbursement date",   label: "Disbursement date" },
      { key: "Disbursement amount", label: "Disbursement amount" },
      { key: "NPA Date",            label: "NPA Date" },
      { key: "EMI Amount",          label: "EMI Amount" },
    ],
  },
  {
    key: "financial", title: "Financial Details", icon: "currency-inr", accent: "#0277BD",
    feild: [
      { key: "Acq POS",          label: "Acquired POS" },
      { key: "POS",              label: "Current POS" },
      { key: "TOS",              label: "Current TOS" },
      { key: "EMI Outstanding",  label: "EMI Outstanding" },
      { key: "Overdue Amount",   label: "Overdue Amount" },
    ],
  },
  {
    key: "disposition_summary", title: "Latest Disposition Summary", icon: "clipboard-list", accent: "#0277BD",
    feild: [
      { key: "reason",                    label: "reason" },
      { key: "Last FV Status",            label: "Last FV Disposition" },
      { key: "last_fv_subdisposition",    label: "Last FV Subdisposition" },
      { key: "Last SV Status",            label: "Last SV Disposition" },
      { key: "last_sv_subdisposition",    label: "Last SV Subdisposition" },
      { key: "Last Calling status",       label: "Last Calling Disposition" },
      { key: "last_call_subdisposition",  label: "Last Call Subdisposition" },
    ],
  },
  {
    key: "resolution", title: "Resolution Status", icon: "check-decagram", accent: "#1565C0",
    feild: [
      { key: "Resolution type",                    label: "Resolution Status" },
      { key: "Date",                               label: "Date" },
      { key: "Resolution Amount",                  label: "Resolution Amount" },
      { key: "Last RP",                            label: "Last RP" },
      { key: "Payment Paid (Post resolution)",     label: "Payment Paid" },
      { key: "Status - Success/Broken/Failed",     label: "Status" },
    ],
  },
  {
    key: "legal", title: "Legal Details", icon: "gavel", accent: "#1A3C8F",
    feild: [
      { key: "Current SARFAESI Stage", label: "Current SARFAESI Stage" },
      { key: "Litigation",             label: "Litigation" },
    ],
  },
  {
    key: "other_loan", title: "Linked Link Loans", icon: "link-variant", accent: "#0D47A1",
    feild: [
      { key: "Link Loan account number", label: "Link Loan account number" },
    ],
  },
  {
    key: "collateral", title: "Collateral Details", icon: "home-city", accent: "#1565C0",
  },
];

// ─── stat card data builder ───────────────────────────────────────────────────
const buildStats = (row0) => [
  { label: "Current TOS",     value: safeStr(row0?.["TOS"]),              icon: "chart-line",       color: "#1A56DB" },
  { label: "Overdue Amount",  value: safeStr(row0?.["Overdue Amount"]),   icon: "alert-circle",     color: "#EF4444" },
  { label: "EMI Outstanding", value: safeStr(row0?.["EMI Outstanding"]),  icon: "clock-alert",      color: "#F59E0B" },
];

// ─── tag pills for hero card ──────────────────────────────────────────────────
const buildTags = (row0) =>
  [
    row0?.["Loan Type"],
    row0?.["Zone"],
    row0?.["Trust code"],
  ]
    .filter(Boolean)
    .map(String);

// ─────────────────────────────────────────────────────────────────────────────
const Account360NewPreview = ({ route, navigation }) => {
  const [loandata,          setLoandata]          = useState([]);
  const [data360,           set360data]           = useState([]);
  const [loader,            setLoader]            = useState(true);
  const [expandedSections,  setExpandedSections]  = useState({});

  const [animations] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, new Animated.Value(0)]))
  );

  useEffect(() => {
    getSecuredLoanViewDetails();
    get360view();
  }, []);

  // ── API calls (unchanged) ──────────────────────────────────────────────────
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
      setLoader(false);
    }
  };

  // ── toggle accordion (unchanged) ──────────────────────────────────────────
  const toggleSection = (section) => {
    const isOpen = expandedSections[section];
    Animated.spring(animations[section], {
      toValue: isOpen ? 0 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
    setExpandedSections((prev) => ({ ...prev, [section]: !isOpen }));
  };

  // ── render one row ─────────────────────────────────────────────────────────
  const renderRow = (label, value, index, accent) => (
    <View key={index} style={[styles.row, index % 2 === 0 && styles.rowShaded]}>
      <View style={[styles.rowDot, { backgroundColor: accent }]} />
      <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{safeStr(value)}</Text>
    </View>
  );

  // ── render accordion card ──────────────────────────────────────────────────
  const renderSection = (section, data) => {
    if (!data || typeof data !== "object") return null;
    const entries       = section.feild;
    const isOpen        = expandedSections[section.key];
    const ROW_H         = 46;
    const PADDING       = 12;

    const animatedHeight = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: [0, entries.length * ROW_H + PADDING],
    });
    const rotateChevron = animations[section.key].interpolate({
      inputRange:  [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    return (
      <View
        key={section.key}
        style={[styles.card, isOpen && styles.cardOpen]}
      >
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleSection(section.key)}
          activeOpacity={0.82}
        >
          {/* Icon badge with blue-shade accent */}
          <View style={[styles.iconBadge, { backgroundColor: section.accent }]}>
            <Icon name={section.icon} size={19} color="#fff" />
          </View>

          <Text style={styles.cardTitle}>{section.title}</Text>

          {/* Chevron toggle */}
          <View style={[styles.chevronWrap, isOpen && styles.chevronWrapOpen]}>
            <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
              <Icon name="chevron-down" size={18} color={isOpen ? COLORS.primary : "#94A3B8"} />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Divider only when open */}
        {isOpen && <View style={styles.divider} />}

        {/* Expandable body */}
        <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
          <View style={styles.cardBody}>
            {entries.map((field, i) => renderRow(field.label, data[field.key], i, section.accent))}
          </View>
        </Animated.View>
      </View>
    );
  };

  // ── render collateral section (array of objects) ──────────────────────────
  const renderCollateralSection = (items) => {
    const section   = SECTIONS[7];
    const isOpen    = expandedSections[section.key];
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
      <View key={section.key} style={[styles.card, isOpen && styles.cardOpen]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleSection(section.key)}
          activeOpacity={0.82}
        >
          <View style={[styles.iconBadge, { backgroundColor: section.accent }]}>
            <Icon name={section.icon} size={19} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <View style={[styles.chevronWrap, isOpen && styles.chevronWrapOpen]}>
            <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
              <Icon name="chevron-down" size={18} color={isOpen ? COLORS.primary : "#94A3B8"} />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {isOpen && <View style={styles.divider} />}

        <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
          <View style={styles.collateralList}>
            {items.map((item, idx) => (
              <View key={idx} style={styles.collateralItem}>
                {/* Sub-card header */}
                <View style={styles.collateralItemHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icon name="home-city-outline" size={14} color={section.accent} />
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

  // ── main render ───────────────────────────────────────────────────────────
  const row0  = data360?.[0] ?? null;
  const stats = row0 ? buildStats(row0) : [];
  const tags  = row0 ? buildTags(row0)  : [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1240A8" />

      {/* ── Gradient Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* Back + Title bar */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>360° View</Text>
        </View>

        {/* Frosted account card */}
        {row0 && (
          <View style={styles.accountCard}>
            <View style={styles.accountCardLeft}>
              <View style={styles.avatarCircle}>
                <Icon name="account" size={24} color="#fff" />
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
            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.tagRow}>
                {tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {row0 && (
        <>
          {/* ── Stat strip ──────────────────────────────────────────────────── */}
          <View style={styles.statStrip}>
            {stats.map((s, i) => (
              <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + "18" }]}>
                  <Icon name={s.icon} size={14} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>
                  {s.value === "—" ? "—" : s.value}
                </Text>
                <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Accordion list ──────────────────────────────────────────────── */}
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
  root: { flex: 1, backgroundColor: "#EEF2FF" },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: "#1240A8",
    paddingTop: Platform.OS === "android" ? 42 : 52,
    paddingBottom: 20,
    paddingHorizontal: 16,
    overflow: "hidden",
    // Gradient simulation via layered views is not possible in RN inline,
    // so we use a solid primary dark here. If LinearGradient is available:
    // wrap this in <LinearGradient colors={["#1240A8","#1A56DB","#3B82F6"]} />
  },

  // Decorative circles
  decorCircle1: {
    position: "absolute",
    top: -32,
    right: -32,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: 8,
    left: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Nav row
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Frosted account card
  accountCard: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 10,
  },
  accountCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  accountNo: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  accountName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  tagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  // ── Stat strip ──────────────────────────────────────────────────────────────
  statStrip: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    gap: 4,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
    textAlign: "center",
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12 },

  // ── Accordion card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#1A56DB",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: "#EEF2FF",
  },
  cardOpen: {
    borderColor: "rgba(59,130,246,0.25)",
    elevation: 4,
    shadowOpacity: 0.10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    // shadow for icon badge
    elevation: 3,
    shadowColor: "#1A56DB",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  chevronWrapOpen: {
    backgroundColor: "rgba(26,86,219,0.10)",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 14,
  },

  // ── Card body rows ───────────────────────────────────────────────────────────
  cardBody: { paddingBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  rowShaded: { backgroundColor: "#F8FAFC" },
  rowDot:   { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  rowLabel: { flex: 1.1, fontSize: 13, color: "#64748B", fontWeight: "500" },
  rowValue: { flex: 1,   fontSize: 13, color: "#0F172A", fontWeight: "700", textAlign: "right" },

  // ── Collateral sub-cards ─────────────────────────────────────────────────────
  collateralList:          { padding: 10, gap: 10 },
  collateralItem:          { borderWidth: 1.5, borderColor: "#DBEAFE", borderRadius: 12, overflow: "hidden", marginBottom: 8 },
  collateralItemHeader:    {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 10, backgroundColor: "#EEF2FF",
    borderBottomWidth: 1, borderBottomColor: "#DBEAFE",
  },
  collateralItemLabel:     { fontSize: 12, fontWeight: "700" },
  collateralTypeBadge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  collateralTypeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});

export default Account360NewPreview;
