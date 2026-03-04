import React, { useState, useEffect,useLayoutEffect } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ScrollView,
    StatusBar,SafeAreaView
} from 'react-native';
import { Text } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { useForm, Controller } from 'react-hook-form';
import Api from '../Utilities/apiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/theme';

const LivelinessNew = ({ route, navigation }) => {
    const [borrowerTypes, setBorrowerTypes]   = useState([]);
    const [customerNames, setCustomerNames]   = useState([]);
    const [customerlist, setCustomerlist]     = useState({ allcustomer: [], selectedcustomer: '' });
    const [submitting, setSubmitting]         = useState(false);

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            account_number:  route.params.account_no,
            borrower_type:   '',
            customer_name:   '',
            borrower_status: '',
        },
    });

    const selectedBorrowerType = watch('borrower_type');
    const selectedStatus       = watch('borrower_status');

    useEffect(() => { fetchBorrowerTypes(); }, []);

    useEffect(() => {
        if (selectedBorrowerType) fetchCustomerNames(selectedBorrowerType);
    }, [selectedBorrowerType]);
    useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    }, [navigation]);
    const fetchBorrowerTypes = async () => {
        try {
            const response = await Api.send({ ...route.params }, 'secure_borrowerdetails/getcustomerList');
            setCustomerlist({ ...customerlist, allcustomer: response });
            const types = [...new Set(response.map(i => i['Borrower Type']))];
            setBorrowerTypes(types.map(t => ({ label: t, value: t })));
        } catch (err) {
            console.error('Error fetching borrower types:', err);
        }
    };

    const fetchCustomerNames = (borrowerType) => {
        const filtered = customerlist.allcustomer
            .filter(i => i['Borrower Type'] === borrowerType)
            .map(i => ({ label: i['Customer Name'], value: i['Customer Name'] }));
        setCustomerNames(filtered);
    };

    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            await Api.send({ ...data, ...route.params }, 'secure_borrowerdetails/borrowerStatus');
            Alert.alert('Success', 'Data saved successfully', [], { cancelable: true });
            reset();
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'Something went wrong. Please try again.', [], { cancelable: true });
            reset();
        } finally {
            setSubmitting(false);
        }
    };

    const borrowerStatusList = [
        { label: 'Alive',    value: 'Alive'    },
        { label: 'Deceased', value: 'Deceased' },
    ];

    /* ── Field wrapper ── */
    const FormField = ({ label, icon, children, error }) => (
        <View style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
                <View style={styles.fieldIconBox}>
                    <Icon name={icon} size={14} color={COLORS.primary} />
                </View>
                <Text style={styles.fieldLabel}>{label}</Text>
            </View>
            {children}
            {error && (
                <View style={styles.errorRow}>
                    <Icon name="alert-circle-outline" size={12} color="#C62828" />
                    <Text style={styles.errorText}>This field is required</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}

                    activeOpacity={0.75}
                >
                    <Icon name="arrow-left" size={20} color={COLORS.white} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Liveliness Check</Text>
                </View>

                {/* status badge (dynamic) */}
                {selectedStatus ? (
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: selectedStatus === 'Alive' ? '#E8F5E9' : '#FFEBEE' }
                    ]}>
                        <Icon
                            name={selectedStatus === 'Alive' ? 'heart-pulse' : 'heart-off-outline'}
                            size={14}
                            color={selectedStatus === 'Alive' ? '#2E7D32' : '#C62828'}
                        />
                    </View>
                ) : (
                    <View style={styles.headerPlaceholder} />
                )}
            </View>

            {/* ── Curved bottom of header ── */}
            <View style={styles.headerFoot} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Form card */}
                <View style={styles.formCard}>

                    {/* Account number (read-only) */}
                    <FormField label="Account Number" icon="bank-outline">
                        <Controller
                            control={control}
                            name="account_number"
                            render={({ field: { value } }) => (
                                <View style={styles.readonlyField}>
                                    <Icon name="identifier" size={15} color={COLORS.label} />
                                    <Text style={styles.readonlyText}>{value || '—'}</Text>
                                    <View style={styles.readonlyLock}>
                                        <Icon name="lock-outline" size={12} color={COLORS.label} />
                                    </View>
                                </View>
                            )}
                        />
                    </FormField>

                    <View style={styles.fieldDivider} />

                    {/* Borrower Type */}
                    <FormField
                        label="Borrower Type"
                        icon="account-group-outline"
                        error={errors.borrower_type}
                    >
                        <Controller
                            control={control}
                            rules={{ required: true }}
                            name="borrower_type"
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={[styles.dropdown, errors.borrower_type && styles.dropdownError]}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    itemTextStyle={styles.itemTextStyle}
                                    containerStyle={styles.dropdownContainer}
                                    activeColor={COLORS.bg}
                                    data={borrowerTypes}
                                    maxHeight={280}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select borrower type"
                                    value={value}
                                    renderRightIcon={() => (
                                        <Icon name="chevron-down" size={18} color={COLORS.label} />
                                    )}
                                    onChange={item => onChange(item.value)}
                                />
                            )}
                        />
                    </FormField>

                    <View style={styles.fieldDivider} />

                    {/* Customer Name */}
                    <FormField
                        label="Customer Name"
                        icon="account-outline"
                        error={errors.customer_name}
                    >
                        <Controller
                            control={control}
                            rules={{ required: true }}
                            name="customer_name"
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={[
                                        styles.dropdown,
                                        errors.customer_name && styles.dropdownError,
                                        !selectedBorrowerType && styles.dropdownDisabled,
                                    ]}
                                    placeholderStyle={[
                                        styles.placeholderStyle,
                                        !selectedBorrowerType && styles.placeholderDisabled,
                                    ]}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    itemTextStyle={styles.itemTextStyle}
                                    containerStyle={styles.dropdownContainer}
                                    activeColor={COLORS.bg}
                                    data={customerNames}
                                    maxHeight={280}
                                    labelField="label"
                                    valueField="value"
                                    placeholder={selectedBorrowerType ? "Select customer name" : "Select borrower type first"}
                                    value={value}
                                    disable={!selectedBorrowerType}
                                    renderRightIcon={() => (
                                        <Icon
                                            name="chevron-down"
                                            size={18}
                                            color={!selectedBorrowerType ? COLORS.lightGrey : COLORS.label}
                                        />
                                    )}
                                    onChange={item => onChange(item.value)}
                                />
                            )}
                        />
                    </FormField>

                    <View style={styles.fieldDivider} />

                    {/* Borrower Status — visual toggle pills */}
                    <FormField
                        label="Borrower Status"
                        icon="heart-pulse"
                        error={errors.borrower_status}
                    >
                        <Controller
                            control={control}
                            rules={{ required: true }}
                            name="borrower_status"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.statusRow}>
                                    {borrowerStatusList.map(opt => {
                                        const isAlive    = opt.value === 'Alive';
                                        const isSelected = value === opt.value;
                                        const activeColor = isAlive ? '#2E7D32' : '#C62828';
                                        const activeBg    = isAlive ? '#E8F5E9' : '#FFEBEE';
                                        const activeBorder= isAlive ? '#A5D6A7' : '#EF9A9A';

                                        return (
                                            <TouchableOpacity
                                                key={opt.value}
                                                style={[
                                                    styles.statusPill,
                                                    isSelected && {
                                                        backgroundColor: activeBg,
                                                        borderColor: activeBorder,
                                                        borderWidth: 1.5,
                                                    },
                                                ]}
                                                onPress={() => onChange(opt.value)}
                                                activeOpacity={0.8}
                                            >
                                                <Icon
                                                    name={isAlive ? 'heart-pulse' : 'heart-off-outline'}
                                                    size={18}
                                                    color={isSelected ? activeColor : COLORS.label}
                                                />
                                                <Text style={[
                                                    styles.statusPillText,
                                                    isSelected && { color: activeColor, fontWeight: '800' },
                                                ]}>
                                                    {opt.label}
                                                </Text>
                                                {isSelected && (
                                                    <View style={[styles.selectedDot, { backgroundColor: activeColor }]} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        />
                    </FormField>
                </View>

                {/* Info note */}
                <View style={styles.infoNote}>
                    <Icon name="information-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.infoNoteText}>
                        All fields are mandatory. Status update will be saved against the account record.
                    </Text>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    activeOpacity={0.85}
                    disabled={submitting}
                >
                    <Icon
                        name={submitting ? "loading" : "content-save-outline"}
                        size={18}
                        color={COLORS.white}
                    />
                    <Text style={styles.submitBtnText}>
                        {submitting ? 'Saving...' : 'Save Record'}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },

    /* ── Header ── */
    header: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    headerCenter: { flex: 1 },
    headerEyebrow: {
        fontSize: 9,
        letterSpacing: 3,
        color: COLORS.lightPurple,
        fontWeight: '700',
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.white,
        letterSpacing: -0.3,
    },
    statusBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerPlaceholder: { width: 36 },
    headerFoot: { height: 8, backgroundColor: COLORS.bg },

    /* ── Scroll ── */
    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },

    /* ── Form Card ── */
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.lightGrey,
        paddingHorizontal: 18,
        paddingVertical: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 14,
    },

    /* ── Field wrapper ── */
    fieldWrap:     { paddingVertical: 14 },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
    fieldIconBox: {
        width: 24,
        height: 24,
        borderRadius: 7,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
        color: COLORS.label,
        textTransform: 'uppercase',
    },
    fieldDivider: { height: 1, backgroundColor: COLORS.lightGrey },

    /* Error */
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    errorText: { fontSize: 11, color: '#C62828', fontWeight: '600' },

    /* Read-only field */
    readonlyField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.bg,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderWidth: 1,
        borderColor: COLORS.lightGrey,
    },
    readonlyText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.grey },
    readonlyLock: {
        backgroundColor: COLORS.lightGrey,
        borderRadius: 5,
        padding: 3,
    },

    /* Dropdown */
    dropdown: {
        height: 50,
        borderColor: COLORS.lightGrey,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 14,
        backgroundColor: COLORS.bg,
    },
    dropdownError:    { borderColor: '#EF9A9A', borderWidth: 1.5 },
    dropdownDisabled: { opacity: 0.5 },
    dropdownContainer: {
        borderRadius: 12,
        borderColor: COLORS.lightGrey,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    placeholderStyle:  { fontSize: 14, color: COLORS.label },
    placeholderDisabled: { color: COLORS.lightGrey },
    selectedTextStyle: { fontSize: 14, fontWeight: '700', color: COLORS.black },
    itemTextStyle:     { fontSize: 14, color: COLORS.black },

    /* Status pills */
    statusRow: { flexDirection: 'row', gap: 10 },
    statusPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: COLORS.bg,
        borderWidth: 1.5,
        borderColor: COLORS.lightGrey,
        position: 'relative',
    },
    statusPillText: { fontSize: 14, fontWeight: '600', color: COLORS.grey },
    selectedDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 7,
        height: 7,
        borderRadius: 4,
    },

    /* Info note */
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.lightPurple,
        marginBottom: 20,
    },
    infoNoteText: { flex: 1, fontSize: 11, color: COLORS.label, lineHeight: 17, fontWeight: '500' },

    /* Submit button */
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius: 14,
        elevation: 8,
    },
    submitBtnDisabled: { opacity: 0.65 },
    submitBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white, letterSpacing: 0.3 },
});

export default LivelinessNew;
