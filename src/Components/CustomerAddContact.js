import React, { useEffect, useState ,useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'react-native-paper-dropdown';
import Api from '../Utilities/apiService';
import { COLORS } from '../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/* ─── Step progress dots ─── */
const StepDots = ({ total, current }) => (
  <View style={styles.stepRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.stepDot,
          i < current
            ? styles.stepDotDone
            : i === current
            ? styles.stepDotActive
            : styles.stepDotIdle,
          i < total - 1 && styles.stepDotGap,
        ]}
      />
    ))}
  </View>
);

/* ─── Section card header ─── */
const SectionHeader = ({ icon, label, note }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconBox}>
      <Text style={styles.sectionIcon}>{icon}</Text>
    </View>
    <View style={styles.sectionHeaderText}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </View>
  </View>
);

/* ─── Dropdown theme ─── */
const dropTheme = {
  colors: {
    primary: COLORS.primary,
    background: COLORS.white,
    surface: COLORS.white,
  },
};

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
const CustomerAddContact = ({ route, navigation }) => {
  const { control, handleSubmit, watch, reset } = useForm();
  const [isFocus, setIsFocus] = useState(false);
  const [Apires, setApires] = useState({ selectedlist: [], borrower_type: [] });
  const [selectd_opt, setSelectedOpt] = useState({ borrower_type: '' });

  const contactType    = watch('contactType');
  const borrowerType   = watch('borrowerType');
  const phoneNumberType = watch('phoneNumberType');

  const contactTypeData = [
    { label: 'Phone Number', value: 'Phone Number' },
    { label: 'Email Id',     value: 'Email Id'     },
  ];
  const phoneNumberTypeData = [
    { label: 'Mobile',   value: 'Mobile'   },
    { label: 'Landline', value: 'Landline' },
  ];

     useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Compute progress for dots
  let filledSteps = 0;
  if (contactType)     filledSteps = 1;
  if (borrowerType)    filledSteps = 2;
  if (contactType === 'Phone Number' && phoneNumberType) filledSteps = 3;

  useEffect(() => {
    fetchCustomerList();
    return () => {};
  }, []);

  const fetchCustomerList = async () => {
    try {
      let result = await Api.send({ ...route.params }, 'secure_borrowerdetails/getcustomerList');
      let types = [...new Set(result.map((im) => im['Borrower Type']))].map((type) => ({
        label: type,
        value: type,
      }));
      setApires({
        customerlist: result,
        selectedlist: result,
        borrower_type: [...types, { label: 'Others', value: 'Others' }],
      });
    } catch (error) {
      console.error(error);
    }
  };

  const setCustomerlist = (type) => {
    setSelectedOpt({ ...selectd_opt, borrower_type: type });
    let list = Apires.customerlist
      .filter((itm) => itm['Borrower Type'] === type)
      .map((itm) => ({ value: itm['Customer Name'], label: itm['Customer Name'] }));
    setApires({ ...Apires, selectedlist: list });
  };

  const onSubmit = async (data) => {
    let contactdata = {
      account_id:              route.params.account_id,
      account_number:          route.params.account_no,
      borrower_type:           data.borrowerType,
      con_type:                data.contactType ? data.contactType : null,
      cont_number:             data.contactType !== 'Phone Number' ? data.email : data.phoneNumber,
      number_type:             data.phoneNumberType,
      relation_with_borrower:  data.relationship ? data.relationship : '',
      customer_name:           data.customer_name,
    };

    let mode = await Api.getMode();
    if (mode === 'offline') {
      Api.setOfflineSync({ ...contactdata, url: 'secure_borrowerdetails/addContact' });
      Alert.alert('Success', 'Contact Saved Offline', [], { cancelable: true });
      reset();
      return;
    }

    Api.send(contactdata, 'secure_borrowerdetails/addContact')
      .then(() => {
        Alert.alert('Success', 'Contact Saved Successfully', [], { cancelable: true });
        reset();
      })
      .catch(() => {
        Alert.alert('Error', 'Something went wrong', [], { cancelable: true });
        reset();
      });
  };

  const isOthers = selectd_opt.borrower_type?.toLowerCase() === 'others';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Top Banner ── */}
      <View style={styles.banner}>
        <TouchableOpacity
                                    style={styles.backBtn}  
                                    onPress={() => navigation.goBack()}
                
                                    activeOpacity={0.75}
                                >
                                    <Icon name="arrow-left" size={20} color={COLORS.white} />
                                </TouchableOpacity>
                                
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerEyebrow}>NEW ENTRY</Text>
          <Text style={styles.bannerTitle}>Add Contact</Text>
        </View>
        <View style={styles.bannerIconBox}>
          <Text style={styles.bannerIcon}>📱</Text>
        </View>
      </View> 

      {/* ── Progress dots ── */}
      <View style={styles.progressWrap}>
        <StepDots total={3} current={filledSteps} />
        <Text style={styles.progressLabel}>
          {filledSteps === 0
            ? 'Fill in the details below'
            : filledSteps === 3
            ? 'Ready to save!'
            : `Step ${filledSteps} of 3`}
        </Text>
      </View>

      {/* ── Form ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── SECTION 1: Contact Type ── */}
        <View style={styles.card}>
          <SectionHeader icon="📋" label="Contact Type" note="Choose what kind of contact to add" />
          <View style={styles.cardBody}>

            <Controller
              control={control}
              name="contactType"
              rules={{ required: 'Contact type is required' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Contact Type *</Text>
                  <Dropdown
                    theme={dropTheme}
                    mode="outlined"
                    label="Select Contact Type"
                    hideMenuHeader={true}
                    options={contactTypeData}
                    value={value}
                    onSelect={(item) => { onChange(item); }}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    style={styles.dropdown}
                  />
                  {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                </View>
              )}
            />

            {/* Phone Number sub-fields */}
            {contactType === 'Phone Number' && (
              <View style={styles.subSection}>
                <View style={styles.subDivider} />

                <Controller
                  control={control}
                  name="phoneNumberType"
                  rules={{ required: 'Number type is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>Number Type *</Text>
                      <Dropdown
                        theme={dropTheme}
                        mode="outlined"
                        label="Mobile / Landline"
                        hideMenuHeader={true}
                        options={phoneNumberTypeData}
                        value={value}
                        onSelect={(item) => { onChange(item); }}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        style={styles.dropdown}
                      />
                      {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="phoneNumber"
                  rules={{
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter a valid 10-digit number',
                    },
                  }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>Contact Number *</Text>
                      <TextInput
                        label="e.g. 9876543210"
                        value={value}
                        mode="outlined"
                        onChangeText={onChange}
                        keyboardType="phone-pad"
                        style={styles.input}
                        outlineColor={COLORS.lightGrey}
                        activeOutlineColor={COLORS.primary}
                        error={!!error}
                        left={<TextInput.Icon icon="phone" color={COLORS.primary} />}
                      />
                      {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                    </View>
                  )}
                />
              </View>
            )}

            {/* Email sub-field */}
            {contactType === 'Email Id' && (
              <View style={styles.subSection}>
                <View style={styles.subDivider} />
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Enter a valid email address',
                    },
                  }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>Email Address *</Text>
                      <TextInput
                        label="e.g. name@domain.com"
                        value={value}
                        mode="outlined"
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        outlineColor={COLORS.lightGrey}
                        activeOutlineColor={COLORS.primary}
                        error={!!error}
                        left={<TextInput.Icon icon="email" color={COLORS.primary} />}
                      />
                      {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        </View>

        {/* ── SECTION 2: Borrower Info ── */}
        <View style={styles.card}>
          <SectionHeader icon="👤" label="Borrower Details" note="Link this contact to an applicant" />
          <View style={styles.cardBody}>

            <Controller
              control={control}
              name="borrowerType"
              rules={{ required: 'Borrower type is required' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Borrower Type *</Text>
                  <Dropdown
                    theme={dropTheme}
                    mode="outlined"
                    label="Select Borrower Type"
                    hideMenuHeader={true}
                    options={Apires.borrower_type}
                    value={value}
                    onSelect={(item) => {
                      onChange(item);
                      setCustomerlist(item);
                    }}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    style={styles.dropdown}
                  />
                  {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                </View>
              )}
            />

            {/* Others branch */}
            {isOthers ? (
              <View style={styles.subSection}>
                <View style={styles.subDivider} />

                <Controller
                  control={control}
                  name="otherName"
                  rules={{ required: 'Name is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>Full Name *</Text>
                      <TextInput
                        label="Enter name"
                        value={value}
                        mode="outlined"
                        onChangeText={onChange}
                        style={styles.input}
                        outlineColor={COLORS.lightGrey}
                        activeOutlineColor={COLORS.primary}
                        error={!!error}
                        left={<TextInput.Icon icon="account" color={COLORS.primary} />}
                      />
                      {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="relationship"
                  rules={{ required: 'Relationship is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>Relationship with Borrower *</Text>
                      <TextInput
                        label="e.g. Brother, Spouse"
                        value={value}
                        mode="outlined"
                        onChangeText={onChange}
                        style={styles.input}
                        outlineColor={COLORS.lightGrey}
                        activeOutlineColor={COLORS.primary}
                        error={!!error}
                        left={<TextInput.Icon icon="account-multiple" color={COLORS.primary} />}
                      />
                      {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                    </View>
                  )}
                />
              </View>
            ) : (
              borrowerType && (
                <View style={styles.subSection}>
                  <View style={styles.subDivider} />
                  <Controller
                    control={control}
                    name="customer_name"
                    rules={{ required: 'Customer name is required' }}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Select Customer *</Text>
                        <Dropdown
                          theme={dropTheme}
                          mode="outlined"
                          label="Select Name"
                          hideMenuHeader={true}
                          options={Apires.selectedlist}
                          value={value}
                          onSelect={(item) => { onChange(item); }}
                          onFocus={() => setIsFocus(true)}
                          onBlur={() => setIsFocus(false)}
                          style={styles.dropdown}
                        />
                        {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
                      </View>
                    )}
                  />
                </View>
              )
            )}
          </View>
        </View>

        {/* bottom padding for FAB */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Save Button ── */}
      <View style={styles.fabWrap}>
        <TouchableOpacity style={styles.fab} onPress={handleSubmit(onSubmit)} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>✓</Text>
          <Text style={styles.fabText}>Save Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
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
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bannerLeft: {},
  bannerEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    color: COLORS.lightPurple,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIcon: { fontSize: 24 },

  /* Progress */
  progressWrap: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { height: 6, borderRadius: 3 },
  stepDotGap: { marginRight: 5 },
  stepDotActive: { width: 22, backgroundColor: COLORS.primary },
  stepDotDone:   { width: 14, backgroundColor: COLORS.lightPurple },
  stepDotIdle:   { width: 14, backgroundColor: COLORS.lightGrey },
  progressLabel: { fontSize: 12, color: COLORS.label, flex: 1 },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

  /* Card */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.lightGrey,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Section header inside card */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
    gap: 10,
    backgroundColor: COLORS.bg,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  sectionIcon: { fontSize: 17 },
  sectionHeaderText: { flex: 1 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 1,
  },
  sectionNote: { fontSize: 11, color: COLORS.label },

  cardBody: { padding: 16 },

  /* Sub-section (revealed fields) */
  subSection: { marginTop: 4 },
  subDivider: {
    height: 1,
    backgroundColor: COLORS.bg,
    marginBottom: 14,
    marginHorizontal: -4,
  },

  /* Fields */
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.label,
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dropdown: {
    backgroundColor: COLORS.white,
  },
  input: {
    backgroundColor: COLORS.white,
    fontSize: 14,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  /* FAB */
  fabWrap: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  fab: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});

export default CustomerAddContact;
