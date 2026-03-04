import React, { useState, useEffect,useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'react-native-paper-dropdown';
import { TextInput } from 'react-native-paper';
import Api from '../Utilities/apiService';
import { COLORS } from '../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/* ─── Section Card wrapper ─── */
const SectionCard = ({ title, icon, children, index }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Text style={styles.sectionIcon}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.sectionStep}>STEP {index}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
    <View style={styles.sectionDivider} />
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

/* ─── Styled Dropdown wrapper ─── */
const StyledDropdown = ({
  label, name, data, rules, dropdownKey,
  showDropdowns, setShowDropdowns, control,
}) => (
  <Controller
    control={control}
    rules={rules}
    name={name}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <View style={styles.fieldWrap}>
        <Dropdown
          label={label}
          mode="outlined"
          visible={showDropdowns[dropdownKey]}
          showDropDown={() =>
            setShowDropdowns(prev => ({ ...prev, [dropdownKey]: true }))
          }
          onDismiss={() =>
            setShowDropdowns(prev => ({ ...prev, [dropdownKey]: false }))
          }
          value={value}
          onSelect={onChange}
          hideMenuHeader={true}
          options={data}
          theme={{
            colors: {
              primary: COLORS.primary,
              background: COLORS.white,
              placeholder: COLORS.label,
              text: COLORS.black,
              outline: COLORS.lightGrey,
            },
          }}
        />
        {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
      </View>
    )}
  />
);

/* ─── Main Component ─── */
const CustomerAddressForm = ({ route,navigation }) => {
  const {
    control, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm();

  const [borrowerTypes, setBorrowerTypes] = useState([
    { label: 'Correspondence', value: 'Correspondence' },
  ]);
  const [names, setNames] = useState([]);
  const [customerList, setCustomerList] = useState({
    allCustomers: [], selectedCustomer: '',
  });
  const [showDropdowns, setShowDropdowns] = useState({
    addressType: false,
    borrowerType: false,
    names: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBorrowerType = watch('borrower_type');

  const addressTypes = [
    { label: 'Correspondence', value: 'Correspondence' },
    { label: 'Office', value: 'Office' },
    { label: 'Residential', value: 'Residential' },
    { label: 'Shop', value: 'Shop' },
    { label: 'Other', value: 'Other' },
  ];

   useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    }, [navigation]);
  
  useEffect(() => { fetchBorrowerTypes(); }, []);
  useEffect(() => {
    if (selectedBorrowerType) fetchNames(selectedBorrowerType);
  }, [selectedBorrowerType]);

  const fetchBorrowerTypes = async () => {
    try {
      const response = await Api.send(
        { ...route.params },
        'secure_borrowerdetails/getcustomerList',
      );
      const data = response;
      setCustomerList(prev => ({ ...prev, allCustomers: data }));
      const uniqueTypes = [...new Set(data.map(i => i['Borrower Type'])), 'Others'];
      setBorrowerTypes(uniqueTypes.map(t => ({ label: t, value: t })));
    } catch {
      Alert.alert('Error', 'Failed to fetch borrower types');
    }
  };

  const fetchNames = async (borrowerType) => {
    try {
      const filtered = customerList.allCustomers
        .filter(i => i['Borrower Type'] === borrowerType)
        .map(i => ({ label: i['Customer Name'], value: i['Customer Name'] }));
      setNames(filtered);
    } catch {
      Alert.alert('Error', 'Failed to fetch names');
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const payload = {
      account_number: route.params.account_no,
      account_id: route.params.account_id,
      ...data,
    };
    try {
      const mode = await Api.getMode();
      if (mode === 'offline') {
        Api.setOfflineSync({ ...payload, url: 'secure_borrowerdetails/addSpectrumaddress' });
        Alert.alert('Success', 'Address Saved Offline.');
        reset();
        return;
      }
      Api.send(payload, 'secure_borrowerdetails/addSpectrumaddress')
        .then(() => { Alert.alert('Success', 'Address Saved Successfully.'); reset(); })
        .catch(() => { Alert.alert('Error', 'Something went wrong. Please try again.'); reset(); });
    } catch {
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Reusable styled TextInput ─── */
  const renderInput = (name, label, rules = {}, extraProps = {}) => (
    <Controller
      control={control}
      rules={rules}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.fieldWrap}>
          <TextInput
            label={label}
            mode="outlined"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!error}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            outlineColor={COLORS.lightGrey}
            activeOutlineColor={COLORS.primary}
            theme={{
              colors: {
                primary: COLORS.primary,
                background: COLORS.white,
                placeholder: COLORS.label,
                onSurfaceVariant: COLORS.label,
              },
            }}
            {...extraProps}
          />
          {error && <Text style={styles.errorText}>⚠ {error.message}</Text>}
        </View>
      )}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Banner ── */}
      <View style={styles.banner}>
          <TouchableOpacity
                                    style={styles.backBtn}
                                    onPress={() => navigation.goBack()}
                
                                    activeOpacity={0.75}
                                >
                                    <Icon name="arrow-left" size={20} color={COLORS.white} />
                                </TouchableOpacity>

        <View>
          <Text style={styles.bannerTitle}>Add Address</Text>
          <Text style={styles.bannerEyebrow}>{route.params.account_no}</Text>

        </View>
        {/* Progress pills */}
        <View style={styles.progressPills}>
          {[1, 2, 3].map(n => (
            <View key={n} style={[styles.pill, styles.pillActive]} />
          ))}
        </View>
      </View>

      {/* ── Form ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1 — Address Info */}
        <SectionCard title="Address Info" icon="📋" index={1}>
          {renderInput('address1', 'Address Line 1', { required: 'Address 1 is required' })}
          {renderInput('address2', 'Address Line 2 (Optional)')}
          <StyledDropdown
            name="address_type"
            label="Address Type"
            data={addressTypes}
            rules={{ required: 'Address type is required' }}
            dropdownKey="addressType"
            showDropdowns={showDropdowns}
            setShowDropdowns={setShowDropdowns}
            control={control}
          />
        </SectionCard>

        {/* Section 2 — Borrower Info */}
        <SectionCard title="Borrower Info" icon="👤" index={2}>
          <StyledDropdown
            name="borrower_type"
            label="Borrower Type"
            data={borrowerTypes}
            rules={{ required: 'Borrower type is required' }}
            dropdownKey="borrowerType"
            showDropdowns={showDropdowns}
            setShowDropdowns={setShowDropdowns}
            control={control}
          />
          {selectedBorrowerType === 'Others' ? (
            <>
              {renderInput('customer_name', 'Full Name', { required: 'Name is required' })}
              {renderInput('relation_with_borrower', 'Relationship with Borrower', {
                required: 'Relationship is required',
              })}
            </>
          ) : (
            <StyledDropdown
              name="customer_name"
              label="Select Name"
              data={names}
              rules={{ required: 'Name is required' }}
              dropdownKey="names"
              showDropdowns={showDropdowns}
              setShowDropdowns={setShowDropdowns}
              control={control}
            />
          )}
        </SectionCard>

        {/* Section 3 — Location */}
        <SectionCard title="Location" icon="📍" index={3}>
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              {renderInput('city', 'City', { required: 'City is required' })}
            </View>
            <View style={styles.halfField}>
              {renderInput('state', 'State', { required: 'State is required' })}
            </View>
          </View>
          {renderInput('pincode', 'Pincode', {
            required: 'Pincode is required',
            pattern: { value: /^[0-9]{6}$/, message: 'Must be 6 digits' },
          }, { keyboardType: 'numeric', maxLength: 6 })}
        </SectionCard>

        {/* Bottom spacer for FAB */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Submit FAB ── */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          style={[styles.fab, isSubmitting && styles.fabDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>{isSubmitting ? '⏳' : '✓'}</Text>
          <Text style={styles.fabText}>
            {isSubmitting ? 'Saving...' : 'Save Address'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  /* ── Banner ── */
  banner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  bannerEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    color: COLORS.lightPurple,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  progressPills: {
    flexDirection: 'row',
    gap: 5,
    paddingBottom: 4,
  },
  pill: {
    height: 6,
    width: 28,
    borderRadius: 3,
  },
  pillActive: {
    backgroundColor: COLORS.lightPurple,
  },

  /* ── Scroll ── */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  /* ── Section Card ── */
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.lightGrey,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.lightPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIcon: { fontSize: 18 },
  sectionStep: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.primary,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
  },
  sectionDivider: {
    height: 1.5,
    backgroundColor: COLORS.bg,
    marginHorizontal: 0,
  },
  sectionBody: {
    padding: 16,
  },

  /* ── Fields ── */
  fieldWrap: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    fontSize: 14,
  },
  inputOutline: {
    borderRadius: 10,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },

  /* ── FAB ── */
  fabWrap: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  fab: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  fabDisabled: {
    backgroundColor: COLORS.grey,
    shadowOpacity: 0.1,
  },
  fabIcon: {
    fontSize: 16,
    color: COLORS.white,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.4,
  },
});

export default CustomerAddressForm;
