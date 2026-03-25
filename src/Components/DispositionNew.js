import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, Modal, Platform
} from 'react-native';
import { COLORS } from '../theme/theme';
import { TextInput, Snackbar, Card, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-paper-dropdown';
import Api from '../Utilities/apiService';
import Loader from './Loader';
import ImagePicker from 'react-native-image-crop-picker';
import { getFileNameAndExtension } from '../Utilities/CommonFun';
import IconManager from '../Utilities/IconManager';

// ─── Static option lists ────────────────────────────────────────────────────
const TYPE_OPTIONS = [
    { label: 'Field Visit', value: 'Field Visit' },
    { label: 'Call',        value: 'Call'        },
    { label: 'Site Visit',  value: 'Site Visit'  },
];

const NATURE_OPTIONS = [
    { label: 'Call',  value: 'Call'  },
    { label: 'Visit', value: 'Visit' },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const DispositionNew = (props) => {

    // ── Form / dropdown state ──────────────────────────────────────────────
    const [dropDownState, setDropDownState]         = useState({});
    const [errors, setErrors]                       = useState({});
    const [formFields, setFormFields]               = useState([]);      // rendered dynamic fields
    const [formFieldsCopy, setFormFieldsCopy]       = useState([]);      // original copy for type-filter

    // ── API data ───────────────────────────────────────────────────────────
    const [dropdownApiData, setDropdownApiData]         = useState({});
    const [dispositionMaster, setDispositionMaster]     = useState([]);  // filtered list shown in dropdown
    const [dispositionMasterCopy, setDispositionMasterCopy] = useState([]); // unfiltered full list from API
    const [contact, setContact]                         = useState([]);
    const [address, setAddress]                         = useState([]);
    const [dispositionCount, setDispositionCount]       = useState(null);
    const [customerList, setCustomerList]               = useState([]);
    const [customerListCopy, setCustomerListCopy]       = useState([]);
    const [accountDetails, setAccountDetails]           = useState({});
    const [userData, setUserData]                       = useState(null);

    // ── UI state ───────────────────────────────────────────────────────────
    const [loader, setLoader]                       = useState(false);
    const [visibleSnackbar, setVisibleSnackbar]     = useState(false);
    const [message, setMessage]                     = useState('');
    const [outsideHours, setOutsideHours]           = useState(false);
    const [currentDate, setCurrentDate]             = useState(null);

    // ── Date / time pickers ─────────────────────────────────────────────────
    const [showDatePicker, setShowDatePicker]       = useState(false);
    const [datePickerLabel, setDatePickerLabel]     = useState('');
    const [date, setDate]                           = useState(new Date());

    // ── Activity-time picker (outside-hours "No" flow) ──────────────────────
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityPickerStep, setActivityPickerStep] = useState('date'); // 'date' | 'time'
    const [activityDateValue, setActivityDateValue] = useState(new Date());
    const activityTimeRef = useRef(null); // stores final Date after modal

    // ── Image upload ────────────────────────────────────────────────────────
    const [dispositionData, setDispositionData]     = useState({ selected_image: [] });

    // ── GPS ────────────────────────────────────────────────────────────────
    const [location, setLocation]                   = useState({ lattitude: null, longitude: null });

    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const init = async () => {
            const params = props.route.params;
            setAccountDetails(params);
            setDropDownState(prev => ({ ...prev, account_number: params.account_no }));
            getLocation();
            await fetchAllData(params);
        };
        init();
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // GPS  (mirrors Angular's getLocation)
    // ═══════════════════════════════════════════════════════════════════════
    const getLocation = () => {
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                setLocation({ lattitude: latitude, longitude: longitude });
            },
            (err) => console.log('Location error:', err.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FETCH ALL DATA  (mirrors Angular's integration() + forkJoin)
    // ═══════════════════════════════════════════════════════════════════════
    const fetchAllData = async (params) => {
        try {
            setLoader(true);
            const { account_no, account_id } = params;

            const [
                countRes,
                dropdownRes,
                contactsRes,
                addressRes,
                customerListRes,
                userDataRes,
            ] = await Promise.all([
                Api.send({ account_number: account_no }, 'diposition/getdisposition_count'),
                Api.get('/diposition/dropdowndata'),
                Api.get(`diposition/phonenumber?account_id=${account_id}`),
                Api.get(`diposition/addressDetails?account_id=${account_id}&disposition=`),
                Api.send({ account_no }, 'secure_borrowerdetails/getcustomerList'),
                Api.get('user/userdetails').catch(() => null),
            ]);

            const count = countRes?.count ?? 0;
            setDispositionCount(count);

            // Current server date → detect outside office hours (mirrors Angular integration callback)
            const serverDate = new Date(dropdownRes.date);
            setCurrentDate(serverDate);
            const hour = serverDate.getHours();
            if (hour < 8 || hour >= 19) setOutsideHours(true);

            // Store user data for user_type based filtering
            const udata = userDataRes?.ResponseMessage?.userDetails?.[0] ?? null;
            setUserData(udata);

            // Keep full disposition master copy
            const fullMaster = dropdownRes.disposition_master ?? [];
            setDispositionMasterCopy(fullMaster);

            // Apply initial type-based filter (mirrors setdispositiondropdown)
            // Will be refined when user selects a type; here we just store raw.
            applyUserTypeFilter(fullMaster, udata);

            // Parse dropdownValue JSON strings
            (dropdownRes.dropdownValue ?? []).forEach(ele => {
                if (typeof ele.drop_down_value === 'string') {
                    ele.drop_down_value = JSON.parse(ele.drop_down_value);
                }
            });
            setDropdownApiData(dropdownRes);

            // Contacts – only valid 10-digit numbers
            const isPhone = (s) => /^\d{10}$/.test(s);
            setContact((contactsRes ?? []).filter(i => isPhone(i.cont_number)));

            setAddress(addressRes ?? []);
            setCustomerListCopy(customerListRes ?? []);

        } catch (err) {
            showSnackbar('Error fetching data. Please try again.');
            console.error('fetchAllData error:', err);
        } finally {
            setLoader(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // USER-TYPE FILTER  (mirrors Angular's setdispositiondropdown)
    // ═══════════════════════════════════════════════════════════════════════
    const applyUserTypeFilter = (masterList, udata) => {
        if (!masterList?.length) return;
        let filtered = masterList;
        const userType = udata?.user_type;
        if (userType === 'Fos') {
            filtered = masterList.filter(d => d.type === 'Field Visit');
        } else if (userType === 'Telecaller') {
            filtered = masterList.filter(d => d.type === 'Call');
        }
        // Internal / undefined → all types allowed; filtering happens on type select
        setDispositionMaster(filtered);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TYPE SELECTION  (mirrors Angular's onselectType)
    // ═══════════════════════════════════════════════════════════════════════
    const onSelectType = (value) => {
        handleDropDownChange('type', value);

        // Reset disposition when type changes (unless Site Visit – auto-selects)
        if (value !== 'Site Visit') {
            handleDropDownChange('disposition', '');
            setFormFields([]);
        }

        // Filter dispositionmaster by type (mirrors Angular onselectType exactly)
        if (value === 'Call') {
            if (!dispositionCount) {
                // First disposition ever → include Welcome Call
                setDispositionMaster(
                    dispositionMasterCopy.filter(d => d.type === 'Call' || d.type === 'Field Visit, Call')
                );
            } else {
                setDispositionMaster(
                    dispositionMasterCopy.filter(
                        d => (d.type === 'Call' || d.type === 'Field Visit, Call') &&
                             d.disposition_name !== 'Welcome Call'
                    )
                );
            }
        } else if (value === 'Site Visit') {
            const siteList = dispositionMasterCopy.filter(d => d.type === 'Site Visit');
            setDispositionMaster(siteList);
            // Auto-select first Site Visit disposition (mirrors Angular)
            if (siteList.length) {
                setTimeout(() => onSelectDisposition(siteList[0].disposition_name), 0);
            }
        } else {
            // Field Visit
            setDispositionMaster(
                dispositionMasterCopy.filter(d => d.type === 'Field Visit' || d.type === 'Field Visit, Call')
            );
        }

        // Refresh address/contacts when type changes (mirrors Angular)
        if (accountDetails.account_id) {
            refreshAddressForType(value);
        }
    };

    const refreshAddressForType = async (typeValue) => {
        try {
            const res = await Api.get(
                `diposition/addressDetails?account_id=${accountDetails.account_id}&disposition=${typeValue}`
            );
            setAddress(res ?? []);
        } catch (e) {
            console.log('address refresh error', e);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DISPOSITION SELECTION  (mirrors Angular's disposition() method)
    // ═══════════════════════════════════════════════════════════════════════
    const onSelectDisposition = (value) => {
        if (!value) {
            setFormFields([]);
            return;
        }

        handleDropDownChange('disposition', value);

        // Find this disposition's dynamic form config from API data
        let selectDisposition = (dropdownApiData?.dropdownValue ?? []).filter(
            ele => ele.input_type === value
        );

        if (!selectDisposition.length) return;

        const selected = selectDisposition[0];
        if (typeof selected.drop_down_value === 'string') {
            selected.drop_down_value = JSON.parse(selected.drop_down_value);
        }

        // Insert person_contacted_name field right after person_contacted (mirrors Angular)
        const personIdx = selected.drop_down_value.findIndex(
            f => f.formControl_name === 'person_contacted'
        );
        if (personIdx !== -1) {
            const nameField = {
                dropdowndata: [],
                formControl_name: 'person_contacted_name',
                label: 'Name',
                s_type: 'both',
                type: 'dropdown',
                validation_msg: [{ text: 'Please select name', type: 'required' }],
            };
            // Only insert if not already present
            const alreadyHas = selected.drop_down_value.some(
                f => f.formControl_name === 'person_contacted_name'
            );
            if (!alreadyHas) {
                selected.drop_down_value.splice(personIdx + 1, 0, nameField);
            }
        }

        // Sort: Sub Disposition always first (mirrors Angular sortedFormFields)
        const sorted = [...selected.drop_down_value].sort((a, b) => {
            if (a.label === 'Sub Disposition *') return -1;
            if (b.label === 'Sub Disposition *') return 1;
            return 0;
        });

        handleDropDownChange('disposition_id', selected.id ?? null);
        setFormFieldsCopy(sorted);
        applyTypeFilterToFormFields(sorted, value === 'Site Visit' ? 'Site Visit' : null);
    };

    // Filter dynamic form fields by currently selected type
    const applyTypeFilterToFormFields = (fields = formFieldsCopy, overrideType = null) => {
        const currentType = overrideType ?? dropDownState.type;
        const filtered = fields.filter(
            f => f.s_type === 'both' || f.s_type === currentType
        );
        setFormFields(filtered);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DROPDOWN / INPUT CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════════════
    const handleDropDownChange = (formControlName, value) => {
        setDropDownState(prev => ({ ...prev, [formControlName]: value }));
        setErrors(prev => ({ ...prev, [formControlName]: '' }));

        // Re-filter dynamic fields when type changes
        if (formControlName === 'type' && value !== 'Site Visit') {
            applyTypeFilterToFormFields(formFieldsCopy, value);
        }

        // Sub-disposition cascade (mirrors Angular checkvalidation for Welcome Call)
        if (formControlName === 'reason' && dropDownState.disposition === 'Welcome Call') {
            getSubDisposition(value);
        }

        // Person contacted → filter customer name list (mirrors Angular onselectpercontact)
        if (formControlName === 'person_contacted') {
            let btype;
            if (value === 'Borrower')    btype = 'Applicant';
            else if (value === 'Co-borrower') btype = 'Co-Applicant';
            else                         btype = value;
            setCustomerList(customerListCopy.filter(e => e['Borrower Type'] === btype));
        }
    };

    // Update sub-sub-disposition dropdowndata (mirrors Angular getsubdisposition)
    const getSubDisposition = (dispositionName) => {
        const sel = (dropdownApiData?.dropdownValue ?? []).find(
            e => e.input_type === dispositionName
        );
        if (!sel) return;
        const parsed = typeof sel.drop_down_value === 'string'
            ? JSON.parse(sel.drop_down_value) : sel.drop_down_value;
        const subdisposition = parsed.find(e => e.formControl_name === 'reason');
        if (!subdisposition) return;
        setFormFields(prev => prev.map(f =>
            f.formControl_name === 'sub_sub_disposition'
                ? { ...f, dropdowndata: subdisposition.dropdowndata }
                : f
        ));
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DATE / TIME PICKERS (for regular form fields & follow-up date)
    // ═══════════════════════════════════════════════════════════════════════
    const openDatePicker = (label) => {
        setDatePickerLabel(label);
        setShowDatePicker(true);
    };

    const formatDate = (date, formatType = 'datetime') => {
        const d  = String(date.getDate()).padStart(2, '0');
        const m  = String(date.getMonth() + 1).padStart(2, '0');
        const y  = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        switch (formatType) {
            case 'datetime':   return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
            case 'time':       return `${hh}:${mm}`;
            case 'date':       return `${y}-${m}-${d}`;
            case 'datewithtime': return `${y}-${m}-${d} 00:00:00`;
            default:           return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
        }
    };

    // Regular field date/time change
    const onDateChange = ({ type }, selectedDate, formControlName, format = 'date') => {
        if (type === 'set') {
            setDatePickerLabel('');
            handleDropDownChange(formControlName, formatDate(new Date(selectedDate), format));
        }
        setShowDatePicker(false);
    };

    // Follow-up date change
    const onFollowUpDateChange = ({ type }, selectedDate) => {
        setShowDatePicker(false);
        setDate(selectedDate);
        setDatePickerLabel('');
        if (type === 'set') {
            handleDropDownChange('followup_date', formatDate(new Date(selectedDate), 'datewithtime'));
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ACTIVITY-TIME MODAL (outside-hours "No" → mirrors DispositionTimeComponent)
    // User picks a date+time for the actual visit/call time
    // ═══════════════════════════════════════════════════════════════════════
    const openActivityTimePicker = () => {
        const serverDate = currentDate ? new Date(currentDate) : new Date();
        const hour = serverDate.getHours();
        // Before 8 AM: user may have called previous day → start with date picker
        // After 7 PM : same day is fine → start with time picker
        if (hour < 8) {
            const prevDay = new Date(serverDate);
            prevDay.setDate(serverDate.getDate() - 1);
            setActivityDateValue(prevDay);
            setActivityPickerStep('date');
        } else {
            setActivityDateValue(serverDate);
            setActivityPickerStep('time');
        }
        setShowActivityModal(true);
    };

    const onActivityDateChange = ({ type }, selectedDate) => {
        if (type === 'set' && selectedDate) {
            setActivityDateValue(selectedDate);
            setActivityPickerStep('time'); // move to time picker
        } else {
            setShowActivityModal(false);
        }
    };

    const onActivityTimeChange = ({ type }, selectedDate) => {
        if (type === 'set' && selectedDate) {
            // Combine chosen date + chosen time into one Date object
            const combined = new Date(activityDateValue);
            combined.setHours(selectedDate.getHours());
            combined.setMinutes(selectedDate.getMinutes());
            combined.setSeconds(selectedDate.getSeconds());
            activityTimeRef.current = combined;
            setShowActivityModal(false);
            handleSave(combined); // pass activity_time directly (avoids async state lag)
        } else {
            setShowActivityModal(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VALIDATION  (mirrors Angular's validateFields + ValidationError)
    // ═══════════════════════════════════════════════════════════════════════
    const validateFields = () => {
        const newErrors = {};

        // Dynamic fields
        formFields.forEach(field => {
            if (field?.rules?.required && !dropDownState[field.formControl_name]) {
                newErrors[field.formControl_name] = field?.validation_msg?.[0]?.text || `${field.label} is required`;
            }
            if (dropDownState[field.formControl_name] && field?.rules?.pattern &&
                !new RegExp(field.rules.pattern).test(dropDownState[field.formControl_name])) {
                newErrors[field.formControl_name] =
                    field?.validation_msg?.find(m => m.type === 'pattern')?.text;
            }
        });

        // Fixed required fields
        if (!dropDownState.type)       newErrors.type        = 'Please select Type';
        if (!dropDownState.type)       {}
        else if (dropDownState.type === 'Field Visit' && !dropDownState.nature)
                                       newErrors.nature      = 'Please select Nature';
        if (!dropDownState.disposition) newErrors.disposition = 'Please select Disposition';
        if (!dropDownState.followup_date && dropDownState.disposition !== 'Not Contactable')
                                       newErrors.followup_date = 'Please select Follow Up Date';
        if (!dropDownState.remarks)    newErrors.remarks     = 'Please enter Remarks';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SAVE CONFIRMATION  (mirrors Angular's savecnf())
    // ═══════════════════════════════════════════════════════════════════════
    const onSavePress = () => {
        if (!validateFields()) return;

        const serverDate = currentDate ? new Date(currentDate) : new Date();
        const hour = serverDate.getHours();

        if (hour < 8 || hour >= 19) {
            // Outside office hours → confirm with user (mirrors Angular savecnf)
            const aftermessage = hour < 8 ? 'before 8 a.m.?' : 'Post 7 p.m?';
            Alert.alert(
                '',
                `Have you visited/called borrower ${aftermessage}`,
                [
                    {
                        text: 'Yes',
                        onPress: () => handleSave(null), // same as Angular: just Save()
                    },
                    {
                        text: 'No',
                        style: 'cancel',
                        onPress: () => openActivityTimePicker(), // mirrors DispositionTimeComponent dialog
                    },
                ],
                { cancelable: false }
            );
        } else {
            handleSave(null);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLE SAVE  (mirrors Angular's Save())
    // activityTime: Date | null (passed directly from outside-hours flow)
    // ═══════════════════════════════════════════════════════════════════════
    const handleSave = async (activityTime) => {
        try {
            setLoader(true);

            // Welcome Call restriction (mirrors Angular Save())
            if (dropDownState.disposition === 'Welcome Call' && userData?.user_type === 'Fos') {
                showSnackbar('As an FOS, you do not have permission to conduct the welcome call.');
                return;
            }

            // Build payload (mirrors Angular params = myForm.value + extras)
            const {
                customer_name,
                bank_name: selling_bank,
                trust: trustname,
                virtual_number,
                zone,
            } = accountDetails;

            const payload = {
                ...dropDownState,
                customer_name,
                selling_bank,
                trustname,
                virtual_number,
                zone,
                source: 'Spectrum',
                ...location,
            };

            // Flatten address object (mirrors Angular onselectaddress)
            if (payload.address_visited_on?.account_id) {
                const a = dropDownState.address_visited_on;
                payload.address_visited_on = `${a.address1} ${a.address2} ${a.address3} ${a.city} ${a.state}`;
                payload.add_id = a.add_sys_id;
            }

            // Flatten phone object (mirrors Angular onselectphone)
            if (payload.no_contacted_on?.con_sys_id) {
                payload.no_contacted_on = dropDownState.no_contacted_on.cont_number;
                payload.con_id = dropDownState.no_contacted_on.con_sys_id;
            }

            // No Contact / Left message → clear address & contact ids (mirrors Angular)
            if (['No Contact', 'Left message'].includes(dropDownState.disposition)) {
                payload.add_id = null;
                payload.con_id = null;
            }

            // Activity time from outside-hours "No" path (mirrors Angular activity_time)
            if (activityTime) {
                payload.activity_time = activityTime;
            }

            // ── Site Visit: upload images ──────────────────────────────────
            if (dropDownState.type === 'Site Visit') {
                if (!dispositionData.selected_image?.length) {
                    showSnackbar('Please upload images');
                    return;
                }
                payload.file = dispositionData.selected_image;
                const response = await handleSaveOrOffline(payload, 'diposition/mobileupload');
                onSaveSuccess(response);
                return;
            }

            const response = await handleSaveOrOffline(payload, 'diposition/createdisposition');
            onSaveSuccess(response);

        } catch (err) {
            console.error('handleSave error:', err);
            showSnackbar('An error occurred while saving. Please try again.');
        } finally {
            setLoader(false);
        }
    };

    const handleSaveOrOffline = async (payload, url) => {
        const mode = await Api.getMode();
        if (mode === 'offline') {
            Api.setOfflineSync({ ...payload, url });
            return null;
        }
        return Api.send(payload, url);
    };

    const onSaveSuccess = (_response) => {
        showSnackbar('Disposition Added Successfully');
        setTimeout(() => props.navigation.navigate('Home'), 1000);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE UPLOAD
    // ═══════════════════════════════════════════════════════════════════════
    const pickImages = () => {
        if (dispositionData.selected_image.length >= 4) {
            showSnackbar('Maximum 4 images can be uploaded.');
            return;
        }
        ImagePicker.openPicker({
            width: 300, height: 400,
            mediaType: 'photo', includeBase64: true, multiple: true,
        }).then(images => {
            if (images.length + dispositionData.selected_image.length > 4) {
                showSnackbar('Maximum 4 images can be uploaded.');
                return;
            }
            const mapped = images.map(img => ({
                image: `data:${img.mime};base64,${img.data}`,
                type: img.mime,
                filename: getFileNameAndExtension(img.path).fileName,
                extension: getFileNameAndExtension(img.path).extension,
            }));
            setDispositionData(prev => ({
                ...prev,
                selected_image: [...prev.selected_image, ...mapped],
            }));
        }).catch(err => console.log('Image picker error', err));
    };

    const removeImage = (index) => {
        setDispositionData(prev => {
            const images = [...prev.selected_image];
            images.splice(index, 1);
            return { ...prev, selected_image: images };
        });
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    const showSnackbar = (msg) => {
        setMessage(msg);
        setVisibleSnackbar(true);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    const renderDynamicField = (field, index) => {
        const { type, formControl_name, label } = field;

        // Exclude person_contacted from rendering (handled separately above the loop)
        if (formControl_name === 'person_contacted') return null;

        // ── Address dropdown ───────────────────────────────────────────────
        if (type === 'dropdown' && formControl_name === 'address_visited_on') {
            return (
                <View key={index} style={styles.input}>
                    <Dropdown
                        hideMenuHeader={true}
                        label={label}
                        mode="outlined"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        placeholder={label}
                        value={dropDownState[formControl_name]}
                        onSelect={(item) => handleDropDownChange(formControl_name, item)}
                        options={(address ?? []).map(a => ({
                            label: `${a.address1 ?? ''} ${a.address2 ?? ''} ${a.address3 ?? ''} ${a.city ?? ''} ${a.state ?? ''}`.trim(),
                            value: a,
                        }))}
                    />
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        // ── Phone / number contacted dropdown ──────────────────────────────
        if (type === 'dropdown' && formControl_name === 'no_contacted_on') {
            return (
                <View key={index} style={styles.input}>
                    <Dropdown
                        hideMenuHeader={true}
                        label={label}
                        mode="outlined"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        placeholder={label}
                        value={dropDownState[formControl_name]}
                        onSelect={(item) => handleDropDownChange(formControl_name, item)}
                        options={(contact ?? []).map(c => ({
                            label: c.cont_number,
                            value: c,
                        }))}
                    />
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        // ── Customer name dropdown (person_contacted_name) ─────────────────
        if (type === 'dropdown' && formControl_name === 'person_contacted_name') {
            return (
                <View key={index} style={styles.input}>
                    <Dropdown
                        hideMenuHeader={true}
                        label="Name"
                        mode="outlined"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        placeholder="Select Name"
                        value={dropDownState[formControl_name]}
                        onSelect={(item) => handleDropDownChange(formControl_name, item)}
                        options={(customerList ?? []).map(c => ({
                            label: c['Customer Name'],
                            value: c['Customer Name'],
                        }))}
                    />
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        // ── Generic dropdown ───────────────────────────────────────────────
        if (type === 'dropdown') {
            return (
                <View key={index} style={styles.input}>
                    <Dropdown
                        hideMenuHeader={true}
                        label={label}
                        mode="outlined"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        placeholder={label}
                        value={dropDownState[formControl_name]}
                        onSelect={(item) => handleDropDownChange(formControl_name, item)}
                        options={(field.dropdowndata ?? []).map(item => ({
                            label: item,
                            value: item,
                        }))}
                    />
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        // ── Text input ─────────────────────────────────────────────────────
        if (type === 'text') {
            return (
                <View key={index} style={styles.input}>
                    <TextInput
                        label={label}
                        mode="outlined"
                        activeOutlineColor={COLORS.primary}
                        keyboardType={field.rules?.pattern ? 'numeric' : 'default'}
                        value={dropDownState[formControl_name]}
                        onChangeText={(v) => handleDropDownChange(formControl_name, v)}
                    />
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        // ── Time picker ────────────────────────────────────────────────────
        if (type === 'time') {
            return (
                <View key={index} style={styles.input}>
                    <TextInput
                        label={label}
                        mode="outlined"
                        activeOutlineColor={COLORS.primary}
                        readOnly
                        value={dropDownState[formControl_name]}
                        right={
                            <TextInput.Icon
                                color={COLORS.primary}
                                icon="clock-outline"
                                onPress={() => openDatePicker(label)}
                            />
                        }
                    />
                    {showDatePicker && datePickerLabel === label && (
                        <DateTimePicker
                            mode="time"
                            display="clock"
                            value={new Date()}
                            onChange={(e, d) => onDateChange(e, d, formControl_name, 'time')}
                        />
                    )}
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        // ── Date picker ────────────────────────────────────────────────────
        if (type === 'date') {
            return (
                <View key={index} style={styles.input}>
                    <TextInput
                        label={label}
                        mode="outlined"
                        activeOutlineColor={COLORS.primary}
                        readOnly
                        value={dropDownState[formControl_name]}
                        right={
                            <TextInput.Icon
                                color={COLORS.primary}
                                icon="calendar"
                                onPress={() => openDatePicker(label)}
                            />
                        }
                    />
                    {showDatePicker && datePickerLabel === label && (
                        <DateTimePicker
                            minimumDate={new Date()}
                            mode="date"
                            display="calendar"
                            value={
                                dropDownState[formControl_name]
                                    ? new Date(dropDownState[formControl_name])
                                    : new Date()
                            }
                            onChange={(e, d) => onDateChange(e, d, formControl_name, 'date')}
                        />
                    )}
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        // ── Number input ───────────────────────────────────────────────────
        if (type === 'number') {
            return (
                <View key={index} style={styles.input}>
                    <TextInput
                        label={label}
                        mode="outlined"
                        activeOutlineColor={COLORS.primary}
                        keyboardType="numeric"
                        value={dropDownState[formControl_name]}
                        onChangeText={(v) => handleDropDownChange(formControl_name, v)}
                    />
                    {errors[formControl_name] ? <Text style={styles.errorText}>{errors[formControl_name]}</Text> : null}
                </View>
            );
        }

        return null;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <View style={styles.container}>
            {loader && <Loader />}

            {/* ── Activity-Time Modal (matches Angular's DispositionTimeComponent dialog) ── */}
            <Modal
                visible={showActivityModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowActivityModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Visit / Call Time</Text>
                        <Text style={styles.modalSubtitle}>
                            {activityPickerStep === 'date'
                                ? 'Select the date of your visit / call:'
                                : 'Select the actual time of your visit / call:'}
                        </Text>

                        {activityPickerStep === 'date' && (
                            <DateTimePicker
                                mode="date"
                                display="calendar"
                                value={activityDateValue}
                                maximumDate={new Date()}
                                onChange={onActivityDateChange}
                            />
                        )}
                        {activityPickerStep === 'time' && (
                            <DateTimePicker
                                mode="time"
                                display="clock"
                                value={activityDateValue}
                                onChange={onActivityTimeChange}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => setShowActivityModal(false)}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

                {/* ── Snackbar ── */}
                <Snackbar
                    style={{ zIndex: 100 }}
                    visible={visibleSnackbar}
                    onDismiss={() => setVisibleSnackbar(false)}
                    duration={Snackbar.DURATION_SHORT}
                >
                    {message}
                </Snackbar>

                {/* ── Outside-hours banner (mirrors Angular's alert div) ── */}
                {outsideHours && (
                    <View style={styles.outsideBanner}>
                        <Text style={styles.outsideBannerText}>
                            ⚠ Outside office hours –{' '}
                            {currentDate
                                ? new Date(currentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                        </Text>
                    </View>
                )}

                {/* ── Account Number (read-only, pre-filled from route.params) ── */}
                <View style={{ ...styles.input, marginTop: 20 }}>
                    <Dropdown
                        hideMenuHeader={true}
                        label="Account Number"
                        placeholder="Account Number"
                        mode="outlined"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        options={[{ label: accountDetails.account_no, value: accountDetails.account_no }]}
                        value={dropDownState.account_number}
                        onSelect={(item) => handleDropDownChange('account_number', item)}
                    />
                </View>

                {/* ── Type ── */}
                <View style={styles.input}>
                    <Dropdown
                        hideMenuHeader={true}
                        label="Type *"
                        placeholder="Select Type"
                        mode="outlined"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        options={
                            dispositionCount === 0
                                ? TYPE_OPTIONS.filter(t => t.value === 'Call')
                                : TYPE_OPTIONS
                        }
                        value={dropDownState.type}
                        onSelect={(item) => onSelectType(item)}
                    />
                    {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}
                </View>

                {/* ── Nature (only for Field Visit) ── */}
                {dropDownState.type === 'Field Visit' && (
                    <View style={styles.input}>
                        <Dropdown
                            hideMenuHeader={true}
                            label="Nature *"
                            placeholder="Select Nature"
                            mode="outlined"
                            style={styles.inputstyle}
                            menuContentStyle={styles.menuContentStyle}
                            options={NATURE_OPTIONS}
                            value={dropDownState.nature}
                            onSelect={(item) => handleDropDownChange('nature', item)}
                        />
                        {errors.nature ? <Text style={styles.errorText}>{errors.nature}</Text> : null}
                    </View>
                )}

                {/* ── Disposition (hidden for Site Visit, auto-selected) ── */}
                {dropDownState.type !== 'Site Visit' && (
                    <View style={styles.input}>
                        <Dropdown
                            hideMenuHeader={true}
                            label="Disposition *"
                            placeholder="Select Disposition"
                            mode="outlined"
                            style={styles.inputstyle}
                            menuContentStyle={styles.menuContentStyle}
                            options={(dispositionMaster ?? []).map(d => ({
                                label: d.disposition_name,
                                value: d.disposition_name,
                            }))}
                            value={dropDownState.disposition}
                            onSelect={(item) => onSelectDisposition(item)}
                        />
                        {errors.disposition ? <Text style={styles.errorText}>{errors.disposition}</Text> : null}
                    </View>
                )}

                {/* ── Person Contacted (shown when disposition is selected & not Not Contactable) ── */}
                {dropDownState.disposition && dropDownState.disposition !== 'Not Contactable' && (
                    <View style={styles.input}>
                        <Dropdown
                            hideMenuHeader={true}
                            label="Person Contacted *"
                            placeholder="Select Person Contacted"
                            mode="outlined"
                            style={styles.inputstyle}
                            menuContentStyle={styles.menuContentStyle}
                            options={(
                                formFields.find(f => f.formControl_name === 'person_contacted')
                                    ?.dropdowndata ?? []
                            ).map(item => ({ label: item, value: item }))}
                            value={dropDownState.person_contacted}
                            onSelect={(item) => handleDropDownChange('person_contacted', item)}
                        />
                        {errors.person_contacted
                            ? <Text style={styles.errorText}>{errors.person_contacted}</Text>
                            : null}
                    </View>
                )}

                {/* ── Dynamic form fields (from disposition config) ── */}
                {formFields.map((field, index) => renderDynamicField(field, index))}

                {/* ── Follow-up Date ── */}
                <View style={styles.input}>
                    <TextInput
                        label="Follow Up Date *"
                        mode="outlined"
                        activeOutlineColor={COLORS.primary}
                        readOnly
                        value={dropDownState.followup_date ?? ''}
                        right={
                            <TextInput.Icon
                                icon="calendar"
                                color={COLORS.primary}
                                onPress={() => openDatePicker('Followup Date')}
                            />
                        }
                    />
                    {showDatePicker && datePickerLabel === 'Followup Date' && (
                        <DateTimePicker
                            minimumDate={new Date()}
                            mode="date"
                            display="calendar"
                            value={date}
                            onChange={onFollowUpDateChange}
                        />
                    )}
                    {errors.followup_date ? <Text style={styles.errorText}>{errors.followup_date}</Text> : null}
                </View>

                {/* ── Remarks ── */}
                <View style={styles.input}>
                    <TextInput
                        label="Remarks"
                        placeholder="Enter your remark"
                        mode="outlined"
                        activeOutlineColor={COLORS.primary}
                        multiline
                        numberOfLines={4}
                        value={dropDownState.remarks ?? ''}
                        onChangeText={(v) => handleDropDownChange('remarks', v ? v.trim() ? v : null : null)}
                    />
                    {errors.remarks ? <Text style={styles.errorText}>{errors.remarks}</Text> : null}
                </View>

                {/* ── Site Visit image upload ── */}
                {dropDownState.type === 'Site Visit' && (
                    <>
                        <View style={styles.imageSectionHeader}>
                            <Text style={styles.imageSectionLabel}>Upload Site Visit Images</Text>
                            <Text style={styles.imageSectionHint}>Max 4 images</Text>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.imagedrawer}
                        >
                            {dispositionData.selected_image.map((item, idx) => (
                                <View key={idx} style={{ position: 'relative' }}>
                                    <View style={styles.imageCloseBtn}>
                                        <TouchableOpacity onPress={() => removeImage(idx)}>
                                            <IconManager
                                                iconClass="antdesign"
                                                icon="closecircleo"
                                                color={COLORS.white}
                                                size={16}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <Card mode="outlined" style={styles.imgdrwcard}>
                                        <Card.Cover
                                            style={styles.imageCover}
                                            source={{ uri: item.image }}
                                        />
                                    </Card>
                                </View>
                            ))}

                            {/* Add-image button */}
                            <Card style={styles.addImageCard}>
                                <Card.Content>
                                    <IconButton
                                        style={styles.addImageBtn}
                                        icon="camera"
                                        size={45}
                                        onPress={pickImages}
                                    />
                                </Card.Content>
                            </Card>
                        </ScrollView>
                    </>
                )}

            </ScrollView>

            {/* ── Save Button ── */}
            <View style={styles.btnctn}>
                <TouchableOpacity onPress={onSavePress} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Save Disposition</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default DispositionNew;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', // light gray background
        position: 'relative',
    },

    // Outside-hours banner
    outsideBanner: {
        backgroundColor: '#E8F0FE',
        borderLeftWidth: 4,
        borderLeftColor: '#1A56DB',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    outsideBannerText: {
        color: '#1A56DB',
        fontSize: 13,
        fontWeight: '500',
    },

    // Form inputs
    input: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    inputstyle: {
        backgroundColor: '#FFFFFF',
    },
    menuContentStyle: {
        backgroundColor: '#FFFFFF',
        width: '100%',
    },

    // Error text
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },

    // Save button
    btnctn: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#1A56DB', // blue
    },
    saveBtn: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    // Image section
    imageSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    imageSectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    imageSectionHint: {
        fontSize: 12,
        color: '#6B7280',
    },
    imagedrawer: {
        height: 140,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    imgdrwcard: {
        marginHorizontal: 6,
        borderRadius: 10,
    },
    imageCover: {
        width: 100,
        height: 115,
        borderRadius: 10,
    },
    imageCloseBtn: {
        position: 'absolute',
        right: 8,
        top: 6,
        zIndex: 10,
        backgroundColor: '#1A56DB',
        borderRadius: 10,
        padding: 1,
    },
    addImageCard: {
        justifyContent: 'center',
        alignSelf: 'center',
        marginHorizontal: 6,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        backgroundColor: '#F9FAFB',
    },
    addImageBtn: {
        width: 90,
        borderRadius: 10,
    },

    // Activity-time modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalCancelBtn: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    modalCancelText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '500',
    },
});
