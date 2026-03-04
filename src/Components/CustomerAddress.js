import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    StatusBar,
    Platform,
    UIManager,
} from "react-native";
import Loader from "./Loader";
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ADDRESS_META = {
    Permanent: { icon: "🏠", accent: COLORS.primary },
    Current:   { icon: "📍", accent: "#1976D2" },
    Office:    { icon: "🏢", accent: "#455A64" },
    Other:     { icon: "📦", accent: COLORS.grey },
};
const getMeta = (type) => ADDRESS_META[type] || { icon: "📌", accent: COLORS.primary };

/* ─── Accordion Item ─── */
const AccordionItem = ({ item, index, isOpen, onToggle }) => {
    const anim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
    const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(anim, {
                toValue: isOpen ? 1 : 0,
                useNativeDriver: false,
                tension: 55,
                friction: 9,
            }),
            Animated.timing(rotateAnim, {
                toValue: isOpen ? 1 : 0,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isOpen]);

    const chevronRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    const maxH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] });
    const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });

    const meta = getMeta(item.address_type);
    const fullAddress = [item.address1, item.address2, item.address3].filter(Boolean).join(", ");

    return (
        <View style={[styles.card, isOpen && styles.cardOpen]}>
            {/* left color accent */}
            <View style={[styles.accentBar, { backgroundColor: meta.accent }]} />

            {/* Tappable header */}
            <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={[styles.iconBox, { backgroundColor: meta.accent + "18" }]}>
                    <Text style={styles.iconText}>{meta.icon}</Text>
                </View>

                <View style={styles.headerInfo}>
                    <View style={styles.headerRow}>
                        <Text style={styles.cardName} numberOfLines={1}>{item.customer_name || "—"}</Text>
                        {item.brw_type
                            ? <View style={styles.pill}><Text style={styles.pillText}>{item.brw_type}</Text></View>
                            : null}
                    </View>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {item.address_type || "Address"} · {item.city || "—"}{item.state ? `, ${item.state}` : ""}
                    </Text>
                </View>

                <Animated.Text style={[styles.chevron, { transform: [{ rotate: chevronRotate }] }]}>
                    ⌄
                </Animated.Text>
            </TouchableOpacity>

            {/* Expandable details */}
            <Animated.View style={{ maxHeight: maxH, opacity, overflow: "hidden" }}>
                <View style={styles.expandContent}>
                    <View style={styles.divider} />

                    {/* Full address strip */}
                    <View style={styles.addrStrip}>
                        <Text style={styles.stripLabel}>FULL ADDRESS</Text>
                        <Text style={styles.stripText}>{fullAddress || "—"}</Text>
                    </View>

                    {/* 2-column grid */}
                    <View style={styles.grid}>
                        {[
                            ["City",    item.city],
                            ["State",   item.state],
                            ["Pincode", item.pin_code],
                            ["Source",  item.source],
                        ].map(([label, val]) => (
                            <View key={label} style={styles.gridCell}>
                                <Text style={styles.cellLabel}>{label}</Text>
                                <Text style={styles.cellValue}>{val || "—"}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

/* ─── Main Component ─── */
const AddressDetails = ({ route }) => {
    const [address, setAddress]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [openIdx, setOpenIdx]   = useState(0);
    const navigation = useNavigation();
    const accountId  = route.params.account_id;

    useEffect(() => { fetchAddressDetails(); }, []);

    const fetchAddressDetails = async () => {
        try {
            const result = await Api.get(`diposition/addressDetails?account_id=${accountId}`);
            setAddress(result);
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    };

    const toggle = useCallback((i) => {
        setOpenIdx(prev => (prev === i ? null : i));
    }, []);

    if (loading) return <Loader />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} /> 
            {/* Divider wave */}
            <View style={styles.bannerFoot} /> 
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false} >
                {address.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}> 
                            <Icon name="home" size={48} color={COLORS.lightGrey} />
                        </Text>
                        <Text style={styles.emptyTitle}>No addresses found</Text>
                        <Text style={styles.emptySub}>Tap below to add one</Text>
                    </View>
                ) : address.map((item, i) => (
                    <AccordionItem
                        key={`addr-${i}`}
                        item={item}
                        index={i}
                        isOpen={openIdx === i}
                        onToggle={() => toggle(i)}
                    />
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating CTA */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate("AddAddress", { account_id: accountId })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.fabPlus}>＋</Text>
                    <Text style={styles.fabLabel}>Add Address</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },  
    bannerFoot: { height: 8, backgroundColor: COLORS.white },
    /* Scroll */
    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10 },

    /* Accordion card */
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: "row",
        borderWidth: 1.5,
        borderColor: COLORS.lightGrey,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardOpen: {
        borderColor: COLORS.lightPurple,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.12,
        elevation: 5,
    },
    accentBar: { width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },

    cardHeader: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        gap: 10,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    iconText: { fontSize: 20 },
    headerInfo: { flex: 1 },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    cardName: { fontSize: 14, fontWeight: "700", color: COLORS.black, flex: 1 },
    pill: {
        backgroundColor: COLORS.bg,
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: COLORS.lightGrey,
    },
    pillText: { fontSize: 10, color: COLORS.grey, fontWeight: "600" },
    cardSubtitle: { fontSize: 12, color: COLORS.label },
    chevron: {
        fontSize: 22,
        color: COLORS.primary,
        fontWeight: "600",
        paddingRight: 4,
        lineHeight: 26,
    },

    /* Expand */
    expandContent: { paddingHorizontal: 14, paddingBottom: 14, marginLeft: 4 },
    divider: { height: 1, backgroundColor: COLORS.lightGrey, marginBottom: 12 },
    addrStrip: {
        backgroundColor: COLORS.bg,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    stripLabel: {
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1.5,
        color: COLORS.primary,
        marginBottom: 4,
    },
    stripText: { fontSize: 13, color: COLORS.grey, lineHeight: 18 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    gridCell: {
        width: "47%",
        backgroundColor: COLORS.bg,
        borderRadius: 10,
        padding: 10,
    },
    cellLabel: {
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1,
        color: COLORS.label,
        textTransform: "uppercase",
        marginBottom: 3,
    },
    cellValue: { fontSize: 13, fontWeight: "600", color: COLORS.black },

    /* Empty */
    empty: { alignItems: "center", paddingTop: 70 },
    emptyIcon: { fontSize: 42, marginBottom: 10 },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.grey, marginBottom: 4 },
    emptySub: { fontSize: 13, color: COLORS.label },

    /* FAB */
    fabContainer: { position: "absolute", bottom: 24, left: 20, right: 20 },
    fab: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    fabPlus: { fontSize: 18, fontWeight: "800", color: COLORS.white },
    fabLabel: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});

export default AddressDetails;
