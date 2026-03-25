import React, { useEffect, useState, useRef,useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Api from '../../Utilities/apiService';
import ImagePicker from 'react-native-image-crop-picker';
import { getFileNameAndExtension } from '../../Utilities/CommonFun';

const { width, height } = Dimensions.get('window');

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  primary:      '#1741C4',
  primaryDark:  '#0F2E9E',
  primaryLight: '#E8EDFB',
  accent:       '#3D5AF1',
  surface:      '#FFFFFF',
  bg:           '#F0F3FB',
  border:       '#D0D8F0',
  label:        '#6B7BAE',
  text:         '#1A2340',
  subtext:      '#5A6894',
  error:        '#D93025',
  success:      '#1B8F5E',
  warning:      '#E07B00',
  grey:         '#A8B4CC',
  white:        '#FFFFFF',
  divider:      '#E2E8F6',
};

// ─── Custom Picker (Modal Sheet) ──────────────────────────────────────────────
const CustomPicker = ({ label, value, options = [], onSelect, error, required, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(o =>
    (o.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const displayValue = options.find(o => o.value === value || o.value?.cont_number === value)?.label || value || '';

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerTrigger, error && styles.pickerError, disabled && styles.pickerDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.75}
      >
        <View style={styles.pickerContent}>
          <Text style={[styles.pickerLabel, displayValue && styles.pickerLabelActive]}>
            {label}{required ? ' *' : ''}
          </Text>
          {!!displayValue && (
            <Text style={styles.pickerValue} numberOfLines={1}>{displayValue}</Text>
          )}
        </View>
        <Text style={[styles.chevron, open && styles.chevronUp]}>▾</Text>
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{label}</Text>
          {options.length > 5 && (
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={C.grey}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(_, i) => String(i)}
            ItemSeparatorComponent={() => <View style={styles.sheetDivider} />}
            renderItem={({ item }) => {
              const isSelected = item.value === value || item.label === displayValue;
              return (
                <TouchableOpacity
                  style={[styles.sheetItem, isSelected && styles.sheetItemSelected]}
                  onPress={() => { onSelect(item.value); setSearch(''); setOpen(false); }}
                >
                  <Text style={[styles.sheetItemText, isSelected && styles.sheetItemTextSelected]}>
                    {item.label}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
};

// ─── Date Input ───────────────────────────────────────────────────────────────
const DateInput = ({ label, value, onPress, error, required }) => (
  <View>
    <TouchableOpacity style={[styles.pickerTrigger, error && styles.pickerError]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.pickerContent}>
        <Text style={[styles.pickerLabel, value && styles.pickerLabelActive]}>{label}{required ? ' *' : ''}</Text>
        {!!value && <Text style={styles.pickerValue}>{value}</Text>}
      </View>
      <Text style={styles.calIcon}>📅</Text>
    </TouchableOpacity>
    {!!error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Field Input ──────────────────────────────────────────────────────────────
const FieldInput = ({ label, value, onChange, error, multiline, keyboardType, required }) => (
  <View>
    <View style={[styles.fieldInputWrap, error && styles.pickerError]}>
      <Text style={[styles.pickerLabel, value && styles.pickerLabelActive]}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        style={[styles.fieldInputText, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
        value={value || ''}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        placeholderTextColor={C.grey}
      />
    </View>
    {!!error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <View style={styles.sectionCard}>
    {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
    {children}
  </View>
);

// ─── Pill Selector ────────────────────────────────────────────────────────────
const PillSelector = ({ options, selected, onSelect }) => (
  <View style={styles.pillRow}>
    {options.map(opt => {
      const active = selected === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.pill, active && styles.pillActive]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Type Tab ────────────────────────────────────────────────────────────────
const TypeTabs = ({ options, selected, onSelect }) => (
  <View style={styles.typeTabs}>
    {options.map((opt, i) => {
      const active = selected === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.typeTab,
            active && styles.typeTabActive,
            i === 0 && { borderRadius: 10, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
            i === options.length - 1 && { borderRadius: 10, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
          ]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { label: 'Field Visit', value: 'Field Visit' },
  { label: 'Call', value: 'Call' },
  { label: 'Site Visit', value: 'Site Visit' },
];

const NATURE_OPTIONS = [
  { label: 'Call', value: 'Call' },
  { label: 'Visit', value: 'Visit' },
];

const PERSON_CONTACT_OPTIONS = [
  { label: 'Borrower', value: 'Borrower' },
  { label: 'Co-borrower', value: 'Co-borrower' },
  { label: 'Guarantor', value: 'Guarantor' },
  { label: 'Relative', value: 'Relative' },
  { label: 'Acquaintance', value: 'Acquaintance' },
  { label: 'TP-Payment', value: 'TP-Payment' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const DispositionNewPreview = (props) => {
  const [form, setForm] = useState({});
  const [formFields, setFormFields] = useState([]);
  const [formFieldsCopy, setFormFieldsCopy] = useState([]);
  const [errors, setErrors] = useState({});
  const [loader, setLoader] = useState(false);
  const [dropdownData, setDropdownData] = useState({});
  const [contacts, setContacts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [customerListAll, setCustomerListAll] = useState([]);
  const [dispositionCount, setDispositionCount] = useState(null);
  const [accountDetails, setAccountDetails] = useState({});
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [currentDate, setCurrentDate] = useState(null);
  const [outsideHours, setOutsideHours] = useState(false);
  const [snack, setSnack] = useState('');
useLayoutEffect(() => {
                props.navigation.setOptions({
                  headerShown: false,
                });
              }, [props.navigation]);
  // Date picker state
  const [datePickerConfig, setDatePickerConfig] = useState({ visible: false, field: null, mode: 'date' });
  const [showTimerForOutside, setShowTimerForOutside] = useState(false);
  const [predateValue, setPredateValue] = useState(new Date());
  const [previousDatePhase, setPreviousDatePhase] = useState(false);
  const [previousDateTimeDone, setPreviousDateTimeDone] = useState(false);

  // Image upload (Site Visit)
  const [images, setImages] = useState([]);

  // ─── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = props.route.params;
    setAccountDetails(params);
    setForm(prev => ({ ...prev, account_number: params.account_no }));
    fetchAllData(params);
    getLocation();
  }, []);

  const getLocation = () => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setLocation({ latitude: coords.latitude, longitude: coords.longitude }),
        err => console.log('Location error:', err.message)
      );
    }
  };

  // ─── API Calls ───────────────────────────────────────────────────────────────
  const fetchAllData = async (params) => {
    try {
      setLoader(true);
      const { account_no, account_id } = params;
      const [countRes, dropRes, contactRes, addrRes, custRes] = await Promise.all([
        Api.send({ account_number: account_no }, 'diposition/getdisposition_count'),
        Api.get('/diposition/dropdowndata'),
        Api.get(`diposition/phonenumber?account_id=${account_id}`),
        Api.get(`diposition/addressDetails?account_id=${account_id}&disposition=`),
        Api.send({ account_no }, 'secure_borrowerdetails/getcustomerList'),
      ]);

      setDispositionCount(countRes.count);
      console.log('Dropdown Data:*********************************************', dropRes);
      const currentDt = new Date(dropRes.date);
      setCurrentDate(currentDt);
      const hr = currentDt.getHours();
      if (hr < 8 || hr >= 19) setOutsideHours(true);

      if (countRes.count) {
        dropRes.disposition_masterfilter = dropRes.disposition_master.filter(
          e => e.disposition_name !== 'Site Visit' && e.disposition_name !== 'Welcome Call'
        );
      } else {
        dropRes.disposition_masterfilter = dropRes.disposition_master.filter(
          e => e.disposition_name === 'Welcome Call'
        );
      }
      
      setDropdownData(dropRes);
      const isPhone = s => /^\d{10}$/.test(s);
      setContacts(contactRes.filter(c => isPhone(c.cont_number)));
      setAddresses(addrRes);
      setCustomerListAll(custRes);
    } catch (e) {
      showSnack('Error loading data. Please try again.');
    } finally {
      setLoader(false);
    }
  };

  // ─── Form Helpers ────────────────────────────────────────────────────────────
  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));

    if (key === 'type' && value !== 'Site Visit') {
      filterFieldsByType(formFieldsCopy, value);
    }
    if (key === 'type' && value === 'Site Visit') {
      handleDispositionChange('Site Visit');
    }
    if (key === 'person_contacted') {
      filterCustomerList(value);
    }
    if(key ==='reason' && form.disposition === 'Welcome Call'){
          const match = dropdownData?.dropdownValue?.find(e => e.input_type === value);
          console.log('match****************', match);
          let formFieldsCopyTemp =formFields;
         let label = value === "Call back" ? "call_back_reason" : "reason";
         let sub_disposition  = typeof match.drop_down_value === 'string'  ? JSON.parse(match.drop_down_value) : match.drop_down_value;
         console.log('sub_disposition*************',   sub_disposition);   
         let sub_sub_dispo = sub_disposition.find(f => f.formControl_name === labellll ++);
             console.log('sub_sub_dispo*************',   sub_sub_dispo);
               console.log('formFields*************',   formFields);
               formFieldsCopyTemp[1].dropdowndata = sub_sub_dispo.dropdowndata;
               setFormFields(formFieldsCopyTemp);  
            
    }
  };

  const filterFieldsByType = (fields, type) => {
    const final = fields.filter(f => f.s_type === 'both' || f.s_type === type);
    setFormFields(final);
  };

  const filterCustomerList = (personContacted) => {
    let type;
    if (personContacted === 'Borrower') type = 'Applicant';
    else if (personContacted === 'Co-borrower') type = 'Co-Applicant';
    else type = personContacted;
    setCustomerList(customerListAll.filter(c => c['Borrower Type'] === type));
  };

  // ─── Disposition Change ──────────────────────────────────────────────────────
  const handleDispositionChange = (value) => {
    setForm(prev => ({
      account_number: prev.account_number,
      type: prev.type,
      nature: prev.nature,
      disposition: value,
    }));
    setErrors({});

    if (!value) { setFormFields([]); return; }

    const match = dropdownData?.dropdownValue?.find(e => e.input_type === value);
    if (!match) return;

    let ddv = typeof match.drop_down_value === 'string'
      ? JSON.parse(match.drop_down_value)
      : [...match.drop_down_value];

    // Inject person_contacted_name after person_contacted
    const pcIdx = ddv.findIndex(f => f.formControl_name === 'person_contacted');
    if (pcIdx !== -1) {
      const nameField = {
        dropdowndata: [],
        formControl_name: 'person_contacted_name',
        label: 'Name',
        s_type: 'both',
        type: 'dropdown',
        validation_msg: [{ text: 'Please select name', type: 'required' }],
      };
      ddv.splice(pcIdx + 1, 0, nameField);
    }

    setFormFieldsCopy(ddv);
    setField('disposition_id', match.id);

    const currentType = form.type || '';
    const final = ddv.filter(f => f.s_type === 'both' || f.s_type === currentType);
    setFormFields(final);
  };

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!form.type) newErrors.type = 'Please select Type';
    if (form.type === 'Field Visit' && !form.nature) newErrors.nature = 'Please select Nature';
    if (!form.disposition) newErrors.disposition = 'Please select Disposition';
    if (!form.followup_date && form.disposition !== 'Not Contactable') newErrors.followup_date = 'Please select Follow Up Date';
    if (!form.remarks) newErrors.remarks = 'Remark is required';

    formFields.forEach(field => {
      if (field?.rules?.required && !form[field.formControl_name]) {
        newErrors[field.formControl_name] = field?.validation_msg?.[0]?.text || `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // ─── Save ────────────────────────────────────────────────────────────────────
  const onPressSave = () => {
    if (!validate()) return;

    const dt = currentDate ? new Date(currentDate) : new Date();
    const hr = dt.getHours();
    if (hr < 8 || hr >= 19) {
      const msg = hr < 8 ? 'before 8 a.m.?' : 'Post 7 p.m?';
      if (hr < 8) {
        const prev = new Date(dt);
        prev.setDate(dt.getDate() - 1);
        setPredateValue(prev);
        setPreviousDatePhase(true);
      } else {
        setPredateValue(dt);
        setPreviousDatePhase(false);
      }
      Alert.alert('', `Have you visited/called borrower ${msg}`, [
        { text: 'Yes', onPress: handleSave },
        { text: 'No', onPress: () => setShowTimerForOutside(true), style: 'cancel' },
      ], { cancelable: false });
      return;
    }
    handleSave();
  };

  const handleSave = async () => {
    try {
      setLoader(true);
      const { customer_name, bank_name, trust, virtual_number, zone } = accountDetails;
      const payload = {
        ...form,
        customer_name,
        selling_bank: bank_name,
        trustname: trust,
        virtual_number,
        zone,
        source: 'Spectrum',
        ...location,
      };

      if (payload.no_contacted_on?.account_id) {
        payload.con_id = payload.no_contacted_on.con_sys_id;
        payload.no_contacted_on = payload.no_contacted_on.cont_number;
      }
      if (payload.address_visited_on?.account_id) {
        const a = form.address_visited_on;
        payload.add_id = a.add_sys_id;
        payload.address_visited_on = `${a.address1} ${a.address2} ${a.address3} ${a.city} ${a.state}`;
      }

      let url = 'diposition/createdisposition';
      if (form.type === 'Site Visit') {
        if (!images.length) { showSnack('Please upload images'); setLoader(false); return; }
        payload.file = images;
        url = 'diposition/mobileupload';
      }

      const mode = await Api.getMode();
      if (mode === 'offline') { Api.setOfflineSync({ ...payload, url }); return; }

      await Api.send(payload, url);
      showSnack('Disposition saved successfully.');
      props.navigation.navigate('Home');
    } catch (e) {
      showSnack('Error saving disposition. Please try again.');
    } finally {
      setLoader(false);
    }
  };

  // ─── Date Picker Handlers ────────────────────────────────────────────────────
  const openDatePicker = (field, mode = 'date') => {
    setDatePickerConfig({ visible: true, field, mode });
  };

  const onDateChange = ({ type }, date) => {
    setDatePickerConfig(prev => ({ ...prev, visible: false }));
    if (type !== 'set' || !date) return;
    const f = datePickerConfig.field;
    const formatted = formatDate(date, f === 'followup_date' ? 'datewithtime' : 'date');
    setField(f, formatted);
  };

  const onOutsideTimeChange = ({ type }, date) => {
    if (type !== 'set' || !date) return;
    const hr = date.getHours();

    if (previousDatePhase) {
      // Phase 1: picked a date — now pick time
      setPreviousDatePhase(false);
      setPreviousDateTimeDone(true);
      setField('activity_date', formatDate(date, 'date'));
      return;
    }

    if (hr < 8 || hr >= 19) {
      Alert.alert('Invalid Time', 'Please select a time between 8 AM and 7 PM.');
      return;
    }
    setField('activity_time', formatDate(date, 'time'));
    setShowTimerForOutside(false);
    handleSave();
  };

  // ─── Utilities ───────────────────────────────────────────────────────────────
  const formatDate = (date, type = 'date') => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const H = String(date.getHours()).padStart(2, '0');
    const M = String(date.getMinutes()).padStart(2, '0');
    const S = String(date.getSeconds()).padStart(2, '0');
    if (type === 'datetime') return `${y}-${m}-${d} ${H}:${M}:${S}`;
    if (type === 'time') return `${H}:${M}`;
    if (type === 'datewithtime') return `${y}-${m}-${d} 00:00:00`;
    return `${y}-${m}-${d}`;
  };

  const showSnack = (msg) => {
    setSnack(msg);
    setTimeout(() => setSnack(''), 3000);
  };

  // ─── Image Handling ──────────────────────────────────────────────────────────
  const pickImages = () => {
    if (images.length >= 4) { showSnack('Maximum 4 images allowed.'); return; }
    ImagePicker.openPicker({
      multiple: true, mediaType: 'photo', includeBase64: true,
    }).then(picked => {
      const mapped = picked.map(i => ({
        image: `data:${i.mime};base64,${i.data}`,
        type: i.mime,
        filename: getFileNameAndExtension(i.path).fileName,
        extension: getFileNameAndExtension(i.path).extension,
      }));
      setImages(prev => [...prev, ...mapped].slice(0, 4));
    }).catch(() => {});
  };

  // ─── Field Visibility Logic ───────────────────────────────────────────────────
  const showAddressField = (field) =>
    field.formControl_name === 'address_visited_on' &&
    (!form.nature || form.nature === 'Visit');

  const showPhoneInFormField = (field) =>
    field.formControl_name === 'no_contacted_on' &&
    (form.type === 'Call' || (form.type === 'Field Visit' && form.nature === 'Call'));

  const showPersonContactedName = () => {
    if (form.disposition === 'Not Contactable') return false;
    return true;
  };

  const showPersonContacted = () => form.disposition !== 'Not Contactable';

  const dispositionOptions = () =>
    (dropdownData?.disposition_masterfilter || [])
      .filter(d => {
        if (form.type === 'Call') return d.type === 'Call' || d.type === 'Field Visit, Call';
        if (form.type === 'Field Visit') return d.type === 'Field Visit' || d.type === 'Field Visit, Call';
        return true;
      })
      .map(d => ({ label: d.disposition_name, value: d.disposition_name }));

  // ─── Render Helpers ───────────────────────────────────────────────────────────
  const renderField = (field, index) => {
    if (field.formControl_name === 'person_contacted') return null; // rendered separately
    if (field.formControl_name === 'person_contacted_name') return null; // rendered separately

    if (field.formControl_name === 'address_visited_on') {
      if (!showAddressField(field)) return null;
      return (
        <View key={field.formControl_name} style={styles.fieldWrap}>
          <CustomPicker
            label="Address Visited On"
            required={!!field?.rules?.required}
            value={form.address_visited_on}
            error={errors.address_visited_on}
            options={addresses.map(a => ({
              label: `${a.address1} ${a.address2} ${a.address3} ${a.city} ${a.state}`.trim(),
              value: a,
            }))}
            onSelect={v => setField('address_visited_on', v)}
          />
        </View>
      );
    }

    if (field.formControl_name === 'no_contacted_on') {
      if (!showPhoneInFormField(field)) return null;
      return (
        <View key={field.formControl_name} style={styles.fieldWrap}>
          <CustomPicker
            label={field.label || 'Number Contact On'}
            required={!!field?.rules?.required}
            value={form.no_contacted_on}
            error={errors.no_contacted_on}
            options={contacts.map(c => ({ label: c.cont_number, value: c }))}
            onSelect={v => setField('no_contacted_on', v)}
          />
        </View>
      );
    }

    if (field.type === 'dropdown') {
      return (
        <View key={field.formControl_name} style={styles.fieldWrap}>
          <CustomPicker
            label={field.label}
            required={!!field?.rules?.required}
            value={form[field.formControl_name]} 
            error={errors[field.formControl_name]}
            options={(field.dropdowndata || []).map(d => ({ label: d, value: d }))}
            onSelect={v => setField(field.formControl_name, v)}
          />
        </View>
      );
    }

    if (field.type === 'date') {
      return (
        <View key={field.formControl_name} style={styles.fieldWrap}>
          <DateInput
            label={field.label}
            required={!!field?.rules?.required}
            value={form[field.formControl_name]}
            error={errors[field.formControl_name]}
            onPress={() => openDatePicker(field.formControl_name, 'date')}
          />
        </View>
      );
    }

    if (field.type === 'time') {
      return (
        <View key={field.formControl_name} style={styles.fieldWrap}>
          <DateInput
            label={field.label}
            required={!!field?.rules?.required}
            value={form[field.formControl_name]}
            error={errors[field.formControl_name]}
            onPress={() => openDatePicker(field.formControl_name, 'time')}
          />
        </View>
      );
    }

    if (field.type === 'text') {
      return (
        <View key={field.formControl_name} style={styles.fieldWrap}>
          <FieldInput
            label={field.label}
            required={!!field?.rules?.required}
            value={form[field.formControl_name]}
            error={errors[field.formControl_name]}
            keyboardType={field.rules?.pattern ? 'numeric' : 'default'}
            onChange={v => setField(field.formControl_name, v)}
          />
        </View>
      );
    }

    return null;
  };

  // ─── Borrower Info ────────────────────────────────────────────────────────────
  const { customer_name, bank_name, trust, account_no, zone } = accountDetails;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Loader Overlay */}
      {loader && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loaderText}>Please wait...</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => props.navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disposition</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Borrower Card */}
      <View style={styles.borrowerCard}>
        <View style={styles.borrowerAvatar}>
          <Text style={styles.avatarText}>{(customer_name || 'B').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.borrowerInfo}>
          <Text style={styles.borrowerName} numberOfLines={1}>{customer_name || '—'}</Text>
          <Text style={styles.borrowerAcct}>{account_no || '—'}</Text>
          <View style={styles.borrowerTags}>
            {!!trust && <View style={styles.tag}><Text style={styles.tagText}>{trust}</Text></View>}
            {!!zone && <View style={[styles.tag, styles.tagGrey]}><Text style={styles.tagText}>{zone}</Text></View>}
          </View>
        </View>
        {!!bank_name && (
          <View style={styles.bankBadge}>
            <Text style={styles.bankLabel}>Bank</Text>
            <Text style={styles.bankName} numberOfLines={1}>{bank_name}</Text>
          </View>
        )}
      </View>

      {/* Outside Hours Banner */}
      {outsideHours && (
        <View style={styles.hoursBanner}>
          <Text style={styles.hoursBannerIcon}>⏰</Text>
          <Text style={styles.hoursBannerText}>
            Outside office hours — {currentDate ? currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selection */}
        <SectionCard title="Activity Type">
          <TypeTabs
            options={
              dispositionCount === 0
                ? TYPE_OPTIONS.filter(t => t.value === 'Call')
                : TYPE_OPTIONS
            }
            selected={form.type}
            onSelect={v => {
              setField('type', v);
              setFormFields([]);
              setForm(prev => ({ account_number: prev.account_number, type: v }));
              setErrors({});
            }}
          />
          {!!errors.type && <Text style={[styles.errorText, { marginTop: 4 }]}>{errors.type}</Text>}

          {/* Nature — only for Field Visit */}
          {form.type === 'Field Visit' && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.subLabel}>Nature</Text>
              <PillSelector
                options={NATURE_OPTIONS}
                selected={form.nature}
                onSelect={v => {
                  setField('nature', v);
                  filterFieldsByType(formFieldsCopy, form.type);
                }}
              />
              {!!errors.nature && <Text style={styles.errorText}>{errors.nature}</Text>}
            </View>
          )}
        </SectionCard>

        {/* Disposition */}
        {form.type !== 'Site Visit' && (
          <SectionCard title="Disposition">
            <CustomPicker
              label="Select Disposition"
              required
              value={form.disposition}
              error={errors.disposition}
              options={dispositionOptions()}
              onSelect={v => handleDispositionChange(v)}
            />
          </SectionCard>
        )}

        {/* Dynamic Fields */}
        {formFields.length > 0 && (
          <SectionCard title="Contact Details">
            {/* Person Contacted */}
            {showPersonContacted() && (
              <View style={styles.fieldWrap}>
                <CustomPicker
                  label="Person Contacted"
                  required
                  value={form.person_contacted}
                  error={errors.person_contacted}
                  options={PERSON_CONTACT_OPTIONS}
                  onSelect={v => setField('person_contacted', v)}
                />
              </View>
            )}

            {/* Person Contacted Name */}
            {showPersonContactedName() && !!form.person_contacted && (
              <View style={styles.fieldWrap}>
                {(customerList.length > 0 || form.person_contacted === 'Co-borrower' || form.person_contacted === 'Guarantor') ? (
                  <CustomPicker
                    label="Name"
                    required
                    value={form.person_contacted_name}
                    error={errors.person_contacted_name}
                    options={customerList.map(c => ({ label: c['Customer Name'], value: c['Customer Name'] }))}
                    onSelect={v => setField('person_contacted_name', v)}
                  />
                ) : (
                  <FieldInput
                    label="Person Contacted Name"
                    required
                    value={form.person_contacted_name}
                    error={errors.person_contacted_name}
                    onChange={v => setField('person_contacted_name', v)}
                  />
                )}
              </View>
            )}

            {/* Dynamic fields from API */}
            {formFields.map((field, i) => renderField(field, i))}
          </SectionCard>
        )}

        {/* Follow Up & Remarks */}
        <SectionCard title="Follow Up">
          <View style={styles.fieldWrap}>
            <DateInput
              label="Follow Up Date"
              required={form.disposition !== 'Not Contactable'}
              value={form.followup_date ? form.followup_date.substring(0, 10) : ''}
              error={errors.followup_date}
              onPress={() => openDatePicker('followup_date', 'date')}
            />
          </View>
          <FieldInput
            label="Remark"
            required
            value={form.remarks}
            error={errors.remarks}
            multiline
            onChange={v => setField('remarks', v)}
          />
        </SectionCard>

        {/* Site Visit Images */}
        {form.type === 'Site Visit' && (
          <SectionCard title="Site Images">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((img, i) => (
                <View key={i} style={styles.imageCard}>
                  <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={styles.removeImgTxt}>✕</Text>
                  </TouchableOpacity>
                  <View style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 30 }}>🖼️</Text>
                  </View>
                </View>
              ))}
              {images.length < 4 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                  <Text style={styles.addImageIcon}>📷</Text>
                  <Text style={styles.addImageLabel}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </SectionCard>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={onPressSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Disposition</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {datePickerConfig.visible && (
        <DateTimePicker
          mode={datePickerConfig.mode}
          display={datePickerConfig.mode === 'time' ? 'clock' : 'calendar'}
          minimumDate={datePickerConfig.field === 'followup_date' ? new Date() : undefined}
          value={
            form[datePickerConfig.field]
              ? new Date(form[datePickerConfig.field])
              : new Date()
          }
          onChange={onDateChange}
        />
      )}

      {/* Outside Hours Time Picker */}
      {showTimerForOutside && previousDatePhase && (
        <DateTimePicker
          mode="date"
          display="calendar"
          minimumDate={predateValue}
          maximumDate={new Date()}
          value={predateValue}
          onChange={onOutsideTimeChange}
        />
      )}
      {showTimerForOutside && !previousDatePhase && (
        <DateTimePicker
          mode="time"
          display="clock"
          value={predateValue}
          onChange={onOutsideTimeChange}
        />
      )}

      {/* Snackbar */}
      {!!snack && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snack}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DispositionNewPreview;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:C.bg},
  root: { flex: 1, backgroundColor: C.bg },

  // ── Loader
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { color: C.subtext, fontSize: 14, marginTop: 8 },

  // ── Header
  header: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { color: C.white, fontSize: 20, fontWeight: '600' },
  headerTitle: { flex: 1, color: C.white, fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 0.4 },
  headerSpacer: { width: 36 },

  // ── Borrower Card
  borrowerCard: {
    backgroundColor: C.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  borrowerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: C.white, fontSize: 20, fontWeight: '800' },
  borrowerInfo: { flex: 1 },
  borrowerName: { color: C.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  borrowerAcct: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  borrowerTags: { flexDirection: 'row', gap: 6, marginTop: 5 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagGrey: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tagText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '600' },
  bankBadge: { alignItems: 'flex-end' },
  bankLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  bankName: { color: C.white, fontSize: 12, fontWeight: '600', maxWidth: 90 },

  // ── Hours Banner
  hoursBanner: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  hoursBannerIcon: { fontSize: 16 },
  hoursBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600', flex: 1 },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  // ── Section Card
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1741C4',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 14,
  },

  // ── Type Tabs
  typeTabs: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: C.border },
  typeTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  typeTabActive: { backgroundColor: C.primary },
  typeTabText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  typeTabTextActive: { color: C.white },

  // ── Pill Selector
  subLabel: { fontSize: 12, color: C.label, fontWeight: '600', marginBottom: 8, letterSpacing: 0.4 },
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.bg, alignItems: 'center',
  },
  pillActive: { backgroundColor: C.primaryLight, borderColor: C.accent },
  pillText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  pillTextActive: { color: C.primary },

  // ── Custom Picker / Field
  fieldWrap: { marginBottom: 14 },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: C.white,
    minHeight: 52,
  },
  pickerError: { borderColor: C.error },
  pickerDisabled: { backgroundColor: C.bg, opacity: 0.6 },
  pickerContent: { flex: 1 },
  pickerLabel: { fontSize: 12, color: C.label, fontWeight: '500' },
  pickerLabelActive: { fontSize: 11, marginBottom: 2, color: C.primary, fontWeight: '600' },
  pickerValue: { fontSize: 14, color: C.text, fontWeight: '500' },
  chevron: { fontSize: 16, color: C.grey, marginLeft: 8 },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  calIcon: { fontSize: 18, marginLeft: 8 },

  fieldInputWrap: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: C.white,
    minHeight: 52,
  },
  fieldInputText: { fontSize: 14, color: C.text, paddingTop: 2, paddingBottom: 0 },

  errorText: { fontSize: 11, color: C.error, marginTop: 4, marginLeft: 2 },

  // ── Modal Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: height * 0.65,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 15, fontWeight: '700', color: C.text,
    paddingHorizontal: 20, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: C.bg,
  },
  searchIcon: { fontSize: 18, color: C.grey, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 8 },
  sheetDivider: { height: 1, backgroundColor: C.divider, marginHorizontal: 20 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  sheetItemSelected: { backgroundColor: C.primaryLight },
  sheetItemText: { flex: 1, fontSize: 14, color: C.text, fontWeight: '500' },
  sheetItemTextSelected: { color: C.primary, fontWeight: '700' },
  checkmark: { fontSize: 16, color: C.primary, fontWeight: '700' },

  // ── Images
  imageCard: {
    width: 90, height: 110,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  removeImgBtn: {
    position: 'absolute', top: 5, right: 5, zIndex: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.error, justifyContent: 'center', alignItems: 'center',
  },
  removeImgTxt: { color: C.white, fontSize: 11, fontWeight: '700' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  addImageBtn: {
    width: 90, height: 110, borderRadius: 12,
    borderWidth: 2, borderStyle: 'dashed', borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  addImageIcon: { fontSize: 28 },
  addImageLabel: { fontSize: 11, color: C.subtext, fontWeight: '600' },

  // ── Footer
  footer: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // ── Snackbar
  snackbar: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#1A2340',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  snackbarText: { color: C.white, fontSize: 13, fontWeight: '500', lineHeight: 18 },
});
