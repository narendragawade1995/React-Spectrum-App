import React, { useEffect, useState, useRef ,useLayoutEffect} from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Animated,
    StatusBar,
} from "react-native";
import Loader from "./Loader";
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CONT_COLORS = {
    Mobile:    { bg: "#E3F2FD", accent: "#1565C0", light: "#BBDEFB" },
    Home:      { bg: "#E8F5E9", accent: "#2E7D32", light: "#C8E6C9" },
    Work:      { bg: "#FFF3E0", accent: "#E65100", light: "#FFE0B2" },
    Emergency: { bg: "#FCE4EC", accent: "#B71C1C", light: "#F8BBD0" },
    Other:     { bg: COLORS.bg,  accent: COLORS.primary, light: COLORS.lightPurple },
};
const getColors = (type) => CONT_COLORS[type] || CONT_COLORS.Other;

const getInitials = (name = "") =>
    name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");

/* ─── Spotlight Panel (selected contact) ─── */
const SpotlightPanel = ({ item, visible }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        if (!visible) return;
        fadeAnim.setValue(0);
        slideAnim.setValue(12);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        ]).start();
    }, [item, visible]);

    if (!item) return null;
    const c = getColors(item.cont_type);

    return (
        <Animated.View
            style={[
                styles.spotlight,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
        >
            {/* Colored top strip */}
            <View style={[styles.spotlightStrip, { backgroundColor: c.accent }]} />

            <View style={styles.spotlightBody}>
                {/* Avatar + identity */}
                <View style={styles.spotlightTop}>
                    <View style={[styles.spotAvatar, { backgroundColor: c.bg, borderColor: c.accent }]}>
                        <Text style={[styles.spotAvatarText, { color: c.accent }]}>
                            {getInitials(item.customer_name)}
                        </Text>
                    </View>
                    <View style={styles.spotInfo}>
                        <Text style={styles.spotName}>{item.customer_name || "—"}</Text>
                        <Text style={styles.spotBrw}>{item.brw_type || "—"}</Text>
                    </View>
                    <View style={[styles.spotTypePill, { backgroundColor: c.bg }]}>
                        <Text style={[styles.spotTypeText, { color: c.accent }]}>{item.cont_type || "N/A"}</Text>
                    </View>
                </View>

                {/* Phone hero */}
                <View style={[styles.phoneHero, { backgroundColor: c.bg }]}>
                    <Text style={styles.phoneHeroIcon}>📞</Text>
                    <Text style={[styles.phoneHeroNumber, { color: c.accent }]}>
                        {item.cont_number || "—"}
                    </Text>
                </View>

                {/* Meta row */}
                <View style={styles.spotMeta}>
                    <View style={styles.spotMetaItem}>
                        <Text style={styles.spotMetaLabel}>SOURCE</Text>
                        <Text style={styles.spotMetaValue}>{item.source || "—"}</Text>
                    </View>
                    <View style={[styles.spotMetaDot, { backgroundColor: c.light }]} />
                    <View style={styles.spotMetaItem}>
                        <Text style={styles.spotMetaLabel}>TYPE</Text>
                        <Text style={styles.spotMetaValue}>{item.cont_type || "—"}</Text>
                    </View>
                    <View style={[styles.spotMetaDot, { backgroundColor: c.light }]} />
                    <View style={styles.spotMetaItem}>
                        <Text style={styles.spotMetaLabel}>APPLICANT</Text>
                        <Text style={styles.spotMetaValue}>{item.brw_type || "—"}</Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

/* ─── List Row ─── */
const ContactRow = ({ item, index, isSelected, onPress }) => {
    const c = getColors(item.cont_type);
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        onPress();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                {/* Avatar */}
                <View style={[styles.rowAvatar, {
                    backgroundColor: isSelected ? c.accent : c.bg,
                    borderColor: c.accent,
                }]}>
                    <Text style={[styles.rowAvatarText, { color: isSelected ? "#fff" : c.accent }]}>
                        {getInitials(item.customer_name)}
                    </Text>
                </View>

                {/* Info */}
                <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, isSelected && { color: COLORS.primary }]} numberOfLines={1}>
                        {item.customer_name || "—"}
                    </Text>
                    <Text style={styles.rowNumber} numberOfLines={1}>{item.cont_number || "—"}</Text>
                </View>

                {/* Type badge */}
                <View style={[styles.rowBadge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.rowBadgeText, { color: c.accent }]}>{item.cont_type || "—"}</Text>
                </View>

                {isSelected && <View style={[styles.selectedDot, { backgroundColor: c.accent }]} />}
            </TouchableOpacity>
        </Animated.View>
    );
};

/* ─── Main Component ─── */
const CustomerContactDetails = ({ route }) => {
    const [contactData, setContactData] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const navigation = useNavigation();
    const accountId  = route.params.account_id;

    useEffect(() => { fetchContactDetails(); }, []);
     useLayoutEffect(() => {
              navigation.setOptions({
                headerShown: false,
              });
            }, [navigation]);

    const fetchContactDetails = async () => {
        try {
            const result = await Api.get(`diposition/phonenumber?account_id=${accountId}`);
            setContactData(result);
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    };

    if (loading) return <Loader />;

    const selected = contactData[selectedIdx] || null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

          <View style={styles.banner}>
         
                         <View style={{ flexDirection: "row", gap: 4 }}>
                             <TouchableOpacity
                                 style={styles.backBtn}
                                 onPress={() => navigation.goBack()}
         
                                 activeOpacity={0.75}
                             >
                                 <Icon name="arrow-left" size={20} color={COLORS.white} />
                             </TouchableOpacity>
                             <View style={{ justifyContent: "center", marginLeft: 10 }}>
                                 <Text style={styles.bannerTitle}>Contacts</Text>
                                 <Text style={styles.eyebrow}>{route.params.account_no}</Text>
                             </View>
                         </View>
                         <View style={styles.countChip}>
                             <Text style={styles.countNum}>{contactData?.length}</Text>
                             <Text style={styles.countSub}>saved</Text>
                         </View>
                     </View>

            {/* Spotlight detail card */}
            {selected && (
                <View style={styles.spotlightWrap}>
                    <SpotlightPanel item={selected} visible={true} />
                </View>
            )}

            {/* Section label */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>ALL CONTACTS</Text>
                <View style={styles.sectionLine} />
            </View>

            {/* Contact list */}
            <FlatList
                data={contactData}
                keyExtractor={(_, i) => `contact-${i}`}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <ContactRow
                        item={item}
                        index={index}
                        isSelected={selectedIdx === index}
                        onPress={() => setSelectedIdx(index)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>No contacts found</Text>
                    </View>
                }
            />

            {/* Floating CTA */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate("AddContact", { account_id: accountId })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.fabPlus}>＋</Text>
                    <Text style={styles.fabLabel}>Add Contact</Text>
                    <View style={styles.fabArrow}>
                        <Text style={styles.fabArrowText}>→</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },

    /* Header */
     banner: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 22,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eyebrow: {
        fontSize: 9,
        letterSpacing: 3,
        color: COLORS.lightPurple,
        fontWeight: "700",
        marginBottom: 4,
    },
    bannerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: COLORS.white,
        letterSpacing: -0.3,
    },
    countChip: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems: "center",
    },
    countNum: { fontSize: 22, fontWeight: "900", color: COLORS.white },
    countSub: { fontSize: 9, color: COLORS.lightPurple, fontWeight: "600", letterSpacing: 1 },
    /* Spotlight */
    spotlightWrap: { paddingHorizontal: 16, paddingTop: 14 },
    spotlight: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: COLORS.lightGrey,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    spotlightStrip: { height: 4 },
    spotlightBody: { padding: 16 },
    spotlightTop: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
    spotAvatar: {
        width: 50,
        height: 50,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },
    spotAvatarText: { fontSize: 18, fontWeight: "800" },
    spotInfo: { flex: 1 },
    spotName: { fontSize: 15, fontWeight: "700", color: COLORS.black, marginBottom: 2 },
    spotBrw: { fontSize: 12, color: COLORS.label },
    spotTypePill: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    spotTypeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
    phoneHero: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 12,
        padding: 13,
        marginBottom: 12,
    },
    phoneHeroIcon: { fontSize: 18 },
    phoneHeroNumber: { fontSize: 20, fontWeight: "800", letterSpacing: 0.5 },
    spotMeta: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGrey,
        paddingTop: 10,
    },
    spotMetaItem: { flex: 1 },
    spotMetaLabel: { fontSize: 8, letterSpacing: 1.5, color: COLORS.label, fontWeight: "700", marginBottom: 3 },
    spotMetaValue: { fontSize: 12, color: COLORS.black, fontWeight: "600" },
    spotMetaDot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 8 },

    /* Section */
    sectionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 10,
    },
    sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: COLORS.label },
    sectionLine: { flex: 1, height: 1.5, backgroundColor: COLORS.lightGrey, borderRadius: 1 },

    /* List */
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    row: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: COLORS.lightGrey,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    rowSelected: {
        borderColor: COLORS.lightPurple,
        backgroundColor: "#F0F5FF",
        shadowColor: COLORS.primary,
        shadowOpacity: 0.1,
        elevation: 3,
    },
    rowAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },
    rowAvatarText: { fontSize: 14, fontWeight: "800" },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: "600", color: COLORS.black, marginBottom: 2 },
    rowNumber: { fontSize: 12, color: COLORS.grey },
    rowBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    rowBadgeText: { fontSize: 10, fontWeight: "700" },
    selectedDot: {
        width: 8, height: 8, borderRadius: 4, marginLeft: 2,
    },

    /* Empty */
    empty: { alignItems: "center", paddingTop: 40 },
    emptyIcon: { fontSize: 38, marginBottom: 10 },
    emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.grey },

    /* FAB */
    fabContainer: { position: "absolute", bottom: 24, left: 20, right: 20 },
    fab: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        paddingHorizontal: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    fabPlus: { fontSize: 16, fontWeight: "800", color: COLORS.white },
    fabLabel: { fontSize: 15, fontWeight: "700", color: COLORS.white, flex: 1, marginLeft: 8 },
    fabArrow: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    fabArrowText: { fontSize: 14, color: COLORS.white, fontWeight: "700" },
});

export default CustomerContactDetails;
