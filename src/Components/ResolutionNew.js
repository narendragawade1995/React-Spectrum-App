import React, { useEffect, useState, useRef,useLayoutEffect } from "react";
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    Animated,
    StatusBar,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS } from "../theme/theme";
import Api from "../Utilities/apiService";
import Loader from "./Loader";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─── Classification config ─── */
const CLASSIFICATION_CONFIG = {
    "NPA":      { color: "#C62828", icon: "alert-circle"         },
    "SMA-2":    { color: "#E65100", icon: "alert"                },
    "SMA-1":    { color: "#F57F17", icon: "alert-outline"        },
    "SMA-0":    { color: "#558B2F", icon: "check-circle-outline" },
    "Standard": { color: "#1B5E20", icon: "check-circle"         },
    default:    { color: COLORS.primary, icon: "file-document-outline" },
};
const getCfg = (cls) => CLASSIFICATION_CONFIG[cls] || CLASSIFICATION_CONFIG.default;

/* ─── Info Row ─── */
const InfoRow = ({ icon, label, value, last }) => (
    <>
        <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
                <Icon name={icon} size={15} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || "N/A"}</Text>
            </View>
        </View>
        {!last && <View style={styles.rowDivider} />}
    </>
);

/* ─── Valuation Tile ─── */
const ValTile = ({ label, value, highlight }) => (
    <View style={[styles.valTile, highlight && styles.valTileHighlight]}>
        <Text style={[styles.valTileLabel, highlight && styles.valTileLabelHighlight]}>{label}</Text>
        <Text style={[styles.valTileValue, highlight && styles.valTileValueHighlight]}>{value || "N/A"}</Text>
    </View>
);

/* ─── Single Collateral Card ─── */
const CollateralCard = ({ item, index, total }) => (
    <View style={[styles.collCard, index < total - 1 && { marginBottom: 10 }]}>
        {/* Asset header row */}
        <View style={styles.assetHeaderRow}>
            <View style={styles.assetIndexBadge}>
                <Text style={styles.assetIndexText}>{String(index + 1).padStart(2, "0")}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.assetCode}>{item["Asset Codes"] || "—"}</Text>
                <Text style={styles.assetCust}>{item["Customer Name"] || "—"}</Text>
            </View>
            <View style={styles.assetAcctWrap}>
                <Text style={styles.assetAcctLabel}>A/C NO</Text>
                <Text style={styles.assetAcctValue} numberOfLines={1}>{item["Account No"] || "—"}</Text>
            </View>
        </View>

        {/* FMV / RSV / DSV tiles */}
        <View style={styles.valRow}>
            <ValTile label="FMV" value={item["FMV"]} highlight />
            <ValTile label="RSV" value={item["RSV"]} />
            <ValTile label="DSV" value={item["DSV"]} />
        </View>

        {/* Address */}
        <View style={styles.addrBlock}>
            <Icon name="map-marker-outline" size={13} color={COLORS.primary} style={{ marginTop: 1 }} />
            <Text style={styles.addrText}>
                {[item["Collateral Address"], item["Collateral City"], item["Collateral State"], item["Collateral PIN"]]
                    .filter(Boolean).join(", ") || "—"}
            </Text>
        </View>

        {/* Bottom detail grid: 2 per row */}
        <View style={styles.detailGrid}>
            {[
                ["calendar-outline",        "Valuation Date",    item["Valuation Date"]       ],
                ["currency-inr",            "SV Amount",         item["SV Valuation Amount"]  ],
                ["calendar-check-outline",  "SV Val. Date",      item["SV Valuation Date"]    ],
                ["source-branch",           "Address Source",    item["Address Source"]       ],
            ].map(([ico, lbl, val]) => (
                <View key={lbl} style={styles.detailCell}>
                    <Icon name={ico} size={12} color={COLORS.label} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailCellLabel}>{lbl}</Text>
                        <Text style={styles.detailCellValue}>{val || "N/A"}</Text>
                    </View>
                </View>
            ))}
        </View>
    </View>
);

/* ─── Resolution Card with inline collateral ─── */
const ResolutionCard = ({ item}) => {
    const [open, setOpen]                           = useState(false);
    const [collateralData, setCollateralData]       = useState([]);
    const [collateralLoading, setCollateralLoading] = useState(false);
    const [fetched, setFetched]                     = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const cfg = getCfg(item?.borrower_classification);
  
    const handleToggle = async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const next = !open;
        setOpen(next);

        Animated.timing(rotateAnim, {
            toValue: next ? 1 : 0,
            duration: 240,
            useNativeDriver: true,
        }).start();

        if (next && !fetched) {
            setCollateralLoading(true);
            try {
                // Uncomment to wire real API:
                const data = await Api.get(
                    `securedloanview/getSecuredLoanViewDetails?LoanAccountNo=${item.loan_account_number}&ViewType=Collateral View`
                );
                setCollateralData(data.SecuredLoanViewData);
            } catch (err) {
                console.error("Collateral fetch error:", err);
            } finally {
                setCollateralLoading(false);
                setFetched(true);
            }
        }
    };

    const chevronRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    return (
        <View style={styles.card}>

            {/* ── Coloured Header ── */}
            <View style={[styles.cardHeader, { backgroundColor: cfg.color }]}>
                <View style={styles.cardHeaderLeft}>
                    <View style={styles.cardHeaderIconBox}>
                        <Icon name={cfg.icon} size={20} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardHeaderName} numberOfLines={1}>
                            {item?.name_of_borrower || "—"}
                        </Text>
                        <Text style={styles.cardHeaderCif}>CIF: {item?.cif || "—"}</Text>
                    </View>
                </View>
                <View style={styles.clsBadge}>
                    <Text style={styles.clsBadgeText}>{item?.borrower_classification || "—"}</Text>
                </View>
            </View>

            {/* ── Info rows ── */}
            <View style={styles.cardBody}>
                <InfoRow icon="chart-line"             label="CIBIL Score"             value={item?.cibil_score} />
                <InfoRow icon="tag-outline"            label="Borrower Categorization" value={item?.borrower_classification} />
                <InfoRow icon="file-document-outline"  label="Resolution Strategy"     value={item?.resolution_strategy} last />
            </View>

            {/* ── Collateral Toggle Button ── */}
            <TouchableOpacity
                style={[styles.collToggle, open && styles.collToggleOpen]}
                onPress={handleToggle}
                activeOpacity={0.82}
            >
                <View style={styles.collToggleLeft}>
                    <Icon
                        name="home-city-outline"
                        size={16}
                        color={open ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[styles.collToggleText, open && styles.collToggleTextOpen]}>
                        Collateral Details
                    </Text>
                    {!open && (
                        <View style={styles.viewTag}>
                            <Text style={styles.viewTagText}>TAP TO VIEW</Text>
                        </View>
                    )}
                </View>
                <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                    <Icon
                        name="chevron-down"
                        size={18}
                        color={open ? COLORS.white : COLORS.primary}
                    />
                </Animated.View>
            </TouchableOpacity>

            {/* ── Inline Collateral Section ── */}
            {open && (
                <View style={styles.collInlineWrap}>
                    {collateralLoading ? (
                        <View style={styles.collLoader}>
                            <Loader />
                        </View>
                    ) : collateralData.length === 0 ? (
                        <View style={styles.collEmpty}>
                            <Icon name="home-remove-outline" size={30} color={COLORS.lightGrey} />
                            <Text style={styles.collEmptyText}>No collateral data available</Text>
                        </View>
                    ) : (
                        <>
                            {/* Section label */}
                            <View style={styles.collSectionLabel}>
                                <View style={styles.collSectionLabelLeft}>
                                    <Icon name="home-city-outline" size={14} color={COLORS.primary} />
                                    <Text style={styles.collSectionLabelText}>Assets on Record</Text>
                                </View>
                                <View style={styles.assetCountPill}>
                                    <Text style={styles.assetCountText}>{collateralData.length}</Text>
                                </View>
                            </View>

                            {collateralData.map((c, i) => (
                                <CollateralCard
                                    key={i}
                                    item={c}
                                    index={i}
                                    total={collateralData.length}
                                />
                            ))}
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

/* ─── Main Screen ─── */
const ResolutionNew = ({ route,navigation }) => {
    const [resolutionRecommendation, setResolutionRecommendation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const result = await Api.send(
                    { account_number: route.params.account_no },
                    "diposition/borrowerClassification"
                );
                setResolutionRecommendation(result);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [route.params.account_no]);
    useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    }, [navigation]);

    if (loading) return <View style={styles.container}><Loader /></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <View style={styles.banner}>

                  <TouchableOpacity
                                    style={styles.backBtn}
                                    onPress={() => navigation.goBack()}
                
                                    activeOpacity={0.75}
                                >
                                    <Icon name="arrow-left" size={20} color={COLORS.white} />
                                </TouchableOpacity>

                <View>
                     <Text style={styles.bannerTitle}>Resolution Plan</Text>
                </View>
                <View style={styles.bannerChip}>
                    <Text style={styles.bannerChipNum}>{resolutionRecommendation.length}</Text>
                    <Text style={styles.bannerChipSub}>records</Text>
                </View>
            </View>

            {error ? (
                <View style={styles.stateWrap}>
                    <Icon name="alert-circle-outline" size={44} color="#EF5350" />
                    <Text style={styles.stateTitle}>Failed to Load</Text>
                    <Text style={styles.stateSub}>{error.message}</Text>
                </View>
            ) : resolutionRecommendation.length === 0 ? (
                <View style={styles.stateWrap}>
                    <Icon name="progress-clock" size={52} color={COLORS.lightPurple} />
                    <Text style={styles.stateTitle}>Work In Progress</Text>
                    <Text style={styles.stateSub}>Resolution data will appear once available</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {resolutionRecommendation.map((item, i) => (
                        <ResolutionCard key={i.toString()} item={item} />
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

/* ═══════════════════ STYLES ═══════════════════ */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
   backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    /* Banner */
    banner: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 22, paddingTop: 22, paddingBottom: 22,
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
     bannerTitle:   { fontSize: 26, fontWeight: "800", color: COLORS.white, letterSpacing: -0.3 },
    bannerChip: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: "center",
    },
    bannerChipNum: { fontSize: 22, fontWeight: "900", color: COLORS.white },
    bannerChipSub: { fontSize: 9, color: COLORS.lightPurple, fontWeight: "600", letterSpacing: 1 },

    listContent: { padding: 16, paddingBottom: 32 },

    /* ── Resolution Card ── */
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 18, marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1.5, borderColor: COLORS.lightGrey,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09, shadowRadius: 12, elevation: 4,
    },
    cardHeader: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    },
    cardHeaderLeft:   { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    cardHeaderIconBox:{ width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" },
    cardHeaderName:   { fontSize: 14, fontWeight: "800", color: COLORS.white, marginBottom: 2, maxWidth: 160 },
    cardHeaderCif:    { fontSize: 11, color: "rgba(255,255,255,0.72)", fontWeight: "600" },
    clsBadge:         { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(255,255,255,0.22)", flexShrink: 0 },
    clsBadgeText:     { fontSize: 11, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },

    cardBody: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 6 },

    /* Info rows */
    infoRow:      { flexDirection: "row", alignItems: "flex-start", paddingVertical: 11, gap: 10 },
    infoIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center", marginTop: 1 },
    infoContent:  { flex: 1 },
    infoLabel:    { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, color: COLORS.label, textTransform: "uppercase", marginBottom: 4 },
    infoValue:    { fontSize: 13, fontWeight: "600", color: COLORS.black, lineHeight: 18 },
    rowDivider:   { height: 1, backgroundColor: COLORS.lightGrey, marginLeft: 38 },

    /* Collateral toggle */
    collToggle: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        marginHorizontal: 14, marginBottom: 14,
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.bg,
        borderWidth: 1.5, borderColor: COLORS.lightPurple,
    },
    collToggleOpen:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    collToggleLeft:     { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    collToggleText:     { fontSize: 13, fontWeight: "700", color: COLORS.primary },
    collToggleTextOpen: { color: COLORS.white },
    viewTag:            { backgroundColor: COLORS.lightPurple, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
    viewTagText:        { fontSize: 8, fontWeight: "900", letterSpacing: 1, color: COLORS.primary },

    /* Inline collateral container */
    collInlineWrap: {
        marginHorizontal: 14, marginBottom: 14,
        paddingTop: 2,
    },

    /* Collateral section label */
    collSectionLabel: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", marginBottom: 10,
    },
    collSectionLabelLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
    collSectionLabelText: { fontSize: 12, fontWeight: "800", color: COLORS.black },
    assetCountPill:  { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    assetCountText:  { fontSize: 10, fontWeight: "800", color: COLORS.white },

    /* Individual collateral card */
    collCard: {
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        borderWidth: 1.5, borderColor: COLORS.lightGrey,
        padding: 12,
    },

    /* Asset header */
    assetHeaderRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
    assetIndexBadge: {
        width: 34, height: 34, borderRadius: 9,
        backgroundColor: COLORS.white,
        borderWidth: 1.5, borderColor: COLORS.lightPurple,
        justifyContent: "center", alignItems: "center",
    },
    assetIndexText: { fontSize: 12, fontWeight: "900", color: COLORS.primary },
    assetCode:      { fontSize: 12.5, fontWeight: "800", color: COLORS.black },
    assetCust:      { fontSize: 10.5, color: COLORS.label, marginTop: 1 },
    assetAcctWrap:  { alignItems: "flex-end" },
    assetAcctLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1, color: COLORS.label },
    assetAcctValue: { fontSize: 11, fontWeight: "700", color: COLORS.primary, maxWidth: 90 },

    /* Valuation tiles */
    valRow:    { flexDirection: "row", gap: 7, marginBottom: 9 },
    valTile:   { flex: 1, backgroundColor: COLORS.white, borderRadius: 9, padding: 9, alignItems: "center", borderWidth: 1, borderColor: COLORS.lightGrey },
    valTileHighlight: { borderColor: COLORS.lightPurple, borderWidth: 1.5 },
    valTileLabel:          { fontSize: 7.5, fontWeight: "800", letterSpacing: 1.2, color: COLORS.label, marginBottom: 3 },
    valTileLabelHighlight: { color: COLORS.primary },
    valTileValue:          { fontSize: 12, fontWeight: "700", color: COLORS.black },
    valTileValueHighlight: { color: COLORS.primary },

    /* Address */
    addrBlock: {
        flexDirection: "row", alignItems: "flex-start", gap: 6,
        backgroundColor: COLORS.white, borderRadius: 8, padding: 9,
        borderLeftWidth: 3, borderLeftColor: COLORS.primary, marginBottom: 8,
    },
    addrText: { fontSize: 11, color: COLORS.grey, lineHeight: 16, flex: 1 },

    /* Detail 2-col grid */
    detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    detailCell: {
        width: "47%",
        flexDirection: "row", alignItems: "flex-start", gap: 6,
        backgroundColor: COLORS.white, borderRadius: 8, padding: 8,
        borderWidth: 1, borderColor: COLORS.lightGrey,
    },
    detailCellLabel: { fontSize: 8.5, fontWeight: "700", color: COLORS.label, marginBottom: 2 },
    detailCellValue: { fontSize: 11, fontWeight: "700", color: COLORS.black },

    /* Loading / empty */
    collLoader:    { paddingVertical: 20, alignItems: "center" },
    collEmpty:     { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 18, justifyContent: "center" },
    collEmptyText: { fontSize: 12, color: COLORS.label },

    /* Page states */
    stateWrap:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
    stateTitle: { fontSize: 18, fontWeight: "800", color: COLORS.grey },
    stateSub:   { fontSize: 13, color: COLORS.label, textAlign: "center", lineHeight: 20 },
});

export default ResolutionNew;
