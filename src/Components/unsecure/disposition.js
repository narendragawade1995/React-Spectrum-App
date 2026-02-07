import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS } from '../../theme/theme';
import { TextInput, Snackbar, Card, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-paper-dropdown';
import Api from "../../Utilities/apiService"
import Loader from '.././Loader';
import ImagePicker from 'react-native-image-crop-picker';
import { getFileNameAndExtension } from '../../Utilities/CommonFun'
import IconManager from '../../Utilities/IconManager';


const type = [
    {
        label: 'Field Visit',
        value: 'Field Visit',
    },
    {
        label: 'Call',
        value: 'Call',
    }

];


const nature = [
    {
        label: 'Call',
        value: 'Call',
    },
    {
        label: 'Visit',
        value: 'Visit',
    }
]


const Usecuredisposition = props => {
    const [selectedOption, setSelectedOption] = useState('');
    const [formFields, setFormFields] = useState([]);
    const [formFieldscopy, setFormFieldscopy] = useState([]);
    const [date, setDate] = useState(new Date());
    const [label, setlabel] = useState('');
    const [dropDownState, setDropDownState] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState({});

    const [dropdowndata, setDropdowndata] = useState({});
    const [contact, setContact] = useState([]);
    const [adress, setAdress] = useState([]);
    const [dispositionCount, setDispositionCount] = useState(null);
    const [customerList, setcustomerList] = useState([]);
    const [customerListCopy, setcustomerListCopy] = useState([]);

    const [acoountdetails, setAcoountdetails] = useState({});
    const [loader, setLoader] = useState(false);
    const [visibleSnackbar, setVisibleSnackbar] = useState(false);
    const [dispositiondata, setdispositiondata] = useState({ selected_image: [] });
    const [message, setMessage] = useState('');
    const [typeOption, setTypeOption] = useState(type);
    const [location, setLocation] = useState({ lattitude: null, longitude: null });
    const [currentdate, setCurrentdate] = useState(null);
    const [shoowtimer, setShoowtimer] = useState(false);
    const [predateValue, setPredateValue] = useState(new Date());
    const [previousdate, setPreviousdate] = useState(false);
    const [previousdatetime, setPreviousdatetime] = useState(false);







    const getLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
                console.log("lattitude: ", latitude, "longitude: ", longitude);
            },
            (error) => {
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const fetchData = async () => {
        const selectedOption = props.route.params.account_no;
        console.log('props.route.params', props.route.params);
        setAcoountdetails(props.route.params)
        console.log(selectedOption);
        setSelectedOption(selectedOption);
        handleDropDownChange('account_number', selectedOption);
        fetchAllData();
        getLocation();
        // dropDown();
        // getDispositionCount();
        // getAddress();
        // getContacts();
        // getCustomerList();

    }


    useEffect(() => {
        fetchData();
        // return () => {
        //     setDropDownState({});
        // };
    }, []);

    const handleSelectionChange = (value) => {
        console.log(value);
        let prevoiusdata = {
            account_number: dropDownState.account_number,
            type: dropDownState.type,
            nature: dropDownState.nature

        }
        setDropDownState(prevoiusdata);
        // setSelectedOption(value);
        handleDropDownChange('disposition', value);
        let selectDisposition = [];
        if (value) {
            console.log('handleSelectionChange', dropdowndata)
            selectDisposition = dropdowndata?.dropdownValue?.filter(ele => ele.input_type === value);
            console.log("selectDisposition------------------------------", selectDisposition);
            if (selectDisposition && selectDisposition.length) {
                if (typeof selectDisposition[0].drop_down_value === 'string') {
                    selectDisposition[0].drop_down_value = JSON.parse(selectDisposition[0].drop_down_value);

                    console.log(`*******************************************************selectDisposition afte`, selectDisposition);
                    console.log(selectDisposition);
                    const index = selectDisposition[0].drop_down_value.findIndex(obj => obj.formControl_name === 'person_contacted');
                    console.log(`*******************************************************`);
                    console.log(index);
                    console.log(selectDisposition);
                    const name = {
                        dropdowndata: [],
                        formControl_name: 'person_contacted_name',
                        label: 'Name',
                        //  rules: {required: true},
                        s_type: "both",
                        type: "dropdown",
                        validation_msg: [{ text: 'Please select name', type: 'required' }]
                    }

                    selectDisposition[0].drop_down_value.splice(index + 1, 0, name);
                }

                console.log(selectDisposition);
                const sortedFormFields = [...selectDisposition[0].drop_down_value].sort((a, b) => {
                    if (a.label === "Sub Disposition *") return -1;
                    if (b.label === "Sub Disposition *") return 1;
                    return 0;
                });

                setFormFieldscopy(sortedFormFields)
                setDisposition(sortedFormFields, value == 'Site Visit' ? 'Site Visit' : null);
                handleDropDownChange('disposition_id', selectDisposition[0]?.id);
            }
        } else {
            setFormFields([]);
        }
    };

    const setDisposition = (formdata = [], type) => {
        console.log('*********************', dropDownState?.type)
        const ctype = type || dropDownState?.type
        const final = formdata.filter(ele => ele.s_type === 'both' || ele.s_type === ctype);
        // setFormFields(final);
        setFormFields((prevState) => [
            ...final
        ]);

        console.log(formFields)
    }

    const onDateClick = (label) => {
        setlabel(label);
        setShowDatePicker(true);
    }

    const getsubdisposition = (disposition) => {
        const selectDisposition = dropdowndata?.dropdownValue?.filter(ele => ele.input_type === disposition);
        console.log("selectDisposition+++++++++++++56");
        //  console.log(selectDisposition);
        // "sub_sub_disposition"
        if (selectDisposition && selectDisposition.length) {
            const selecteddropdown = JSON.parse(selectDisposition[0].drop_down_value);
            const subdisposition = selecteddropdown.filter(ele => ele.formControl_name == 'reason');
            console.log('reason subdisposition', 'subdisposition', subdisposition[0].dropdowndata);
            const formfilter = formFields;
            formfilter.forEach(ele => {
                if (ele.formControl_name == 'sub_sub_disposition') {
                    ele.dropdowndata = subdisposition[0].dropdowndata;
                }
            });
            setFormFields(formfilter)
        }
    }


    const onChangeActivity = ({ type }, selectedDate, formControlName, format = 'date') => {
        console.log(type, selectedDate)
        if (formControlName === 'activity_date') {
            setPreviousdate(false);
            setPreviousdatetime(true);
        } else {
            setShowtimer(false);
        }

        if (type === 'set') {
            const formattedDate = formatDate(new Date(selectedDate), format);
            const selectedHour = new Date(selectedDate).getHours();
            if (selectedHour < 8 || selectedHour >= 19) {
                Alert.alert("Invalid Time", "Please select a time between 8 AM and 7 PM.");
                setPreviousdate(false);
                setPreviousdatetime(false);
                setShowtimer(false);
                return;

            }



            if (format === 'datetime') {
                const formattedTime = formatDate(new Date(selectedDate), 'time');
                handleDropDownChange(formControlName, formattedTime);
                handleDropDownChange('activity_date', formattedDate);
            } else {
                handleDropDownChange(formControlName, formattedDate);
            }
        }

        if (formControlName === 'activity_time') {
            setPreviousdate(false);
            setPreviousdatetime(false);
            setShowtimer(false);
            handleSave();

        }
    }



    const onChange = ({ type }, selectedDate, formcontrolname, format = 'date') => {
        if (type == 'set') {
            // const currentDate = selectedDate;
            // setDate(currentDate); 
            setlabel('');
            const currentDate = formatDate(new Date(selectedDate), format);
            console.log("%%%%%%%%%%%%%%%%%%%%%%,", selectedDate, formcontrolname);
            handleDropDownChange(formcontrolname, currentDate);
            console.log(dropDownState);
        }
        setShowDatePicker(false);
    };

    const OndateSelected = ({ type }, selectedDate) => {
        setShowDatePicker(false);
        setDate(selectedDate)
        setlabel('');
        if (type == 'set') {
            const currentDate = formatDate(new Date(selectedDate), 'datewithtime');
            handleDropDownChange('followup_date', currentDate)
            if (Platform.OS === 'android') {
            }
        }
    }


    const handleDropDownChange = (formControlName, value) => {
        console.log(formControlName, value);
        // setDropDownState({
        //     ...dropDownState,
        //     [formControlName]: value,
        // });
        setDropDownState((prevState) => ({
            ...prevState,
            [formControlName]: value
        }),);

        console.log(dropDownState)
        setErrors((prevState) => ({
            ...prevState,
            [formControlName]: ''
        }));

        if (formControlName === 'type' && value != 'Site Visit') {
            setDisposition(formFieldscopy, value);
        }
        if (formControlName === 'type' && value === 'Site Visit') {
            handleSelectionChange('Site Visit');
        }
        if (formControlName === 'reason' && dropDownState.disposition === 'Welcome Call') {
            getsubdisposition(value);
        }

        if (formControlName === 'person_contacted') {
            let btype;
            if (value == 'Borrower') {
                btype = 'Applicant';
            } else if (value == 'Co-borrower') {
                btype = 'Co-Applicant';
            } else {
                btype = value;
            }
            let customerlistc = customerListCopy.filter(ele => ele['Borrower Type'] == btype);
            console.log("customerlistc,value", customerlistc, value, customerListCopy)
            setcustomerList(customerlistc)
        }
    };


    const validateFields = () => {
        const newErrors = {};
        console.log(newErrors);
        formFields.forEach(field => {
            if (field?.rules?.required && !dropDownState[field.formControl_name]) {
                newErrors[field.formControl_name] = field?.validation_msg[0]?.text;
            }
            if (dropDownState[field.formControl_name] && field?.rules?.pattern && !new RegExp(field.rules.pattern).test(dropDownState[field.formControl_name])) {
                newErrors[field.formControl_name] = field?.validation_msg?.find(msg => msg.type === 'pattern')?.text;
            }

            // Check for minlength validation
            if (dropDownState[field.formControl_name] && field?.rules?.MinLength && dropDownState[field.formControl_name]?.length < field.rules.MinLength) {
                newErrors[field.formControl_name] = field?.validation_msg?.find(msg => msg.type === 'minlength')?.text;
            }

            // Check for maxlength validation
            if (dropDownState[field.formControl_name] && field?.rules?.MaxLength && dropDownState[field.formControl_name]?.length > field.rules.MaxLength) {
                newErrors[field.formControl_name] = field?.validation_msg?.find(msg => msg.type === 'maxlength')?.text;
            }
        });

        if (!dropDownState.type) {
            newErrors.type = 'Please select Type';
        }

        if (!dropDownState.nature && dropDownState.type == 'Field Visit') {
            newErrors.nature = 'Please select Nature';
        }

        if (!dropDownState.disposition) {
            newErrors.disposition = 'Please select Disposition';
        }

        if (!dropDownState.followup_date) {
            newErrors.followup_date = 'Please select Followup Date';
        }
        if (!dropDownState.remarks) {
            newErrors.remarks = 'Please select Remarks';
        }

        setErrors(newErrors);
        console.log(newErrors)
        return Object.keys(newErrors).length === 0;  // Returns true if no errors
    };


    // const getDispositionCount = async () => {
    //     try {
    //         const DispositionCount = await Api.send({ account_number: props.route.params.account_no }, 'diposition/getdisposition_count');
    //         setDispositionCount(DispositionCount.count)
    //     } catch (error) {

    //     }
    // }


    // const dropDown = async () => {
    //     try {
    //         const dropdowndata = await Api.get('/diposition/dropdowndata');
    //         dropdowndata.disposition_masterfilter = dropdowndata.disposition_master;
    //         setDropdowndata(dropdowndata);
    //     } catch (error) {

    //     }
    // }


    // const getContacts = async () => {
    //     try {
    //         const isPhoneNumber = (str) => /^\d{10}$/.test(str);
    //         const contactlist = await Api.get(`diposition/phonenumber?account_id=${props.route.params.account_id}`);
    //         let filteredContacts  = contactlist.filter(item => isPhoneNumber(item.cont_number));
    //         setContact(filteredContacts);
    //     } catch (error) {

    //     }
    // }

    // const getAddress = async () => {
    //     try {
    //         const address = await Api.get(`diposition/addressDetails?account_id=${props.route.params.account_id}&disposition=${dropDownState.disposition}`);
    //         setAdress(address);
    //     } catch (error) {

    //     }
    // }

    // const getCustomerList = async () => {
    //     try {
    //         const CustomerList2 = await Api.send({ account_no: props.route.params.account_no }, 'secure_borrowerdetails/getcustomerList');
    //         setcustomerList(CustomerList2);
    //         console.log('CustomerList', CustomerList2);
    //     } catch (error) {

    //     }
    // }

    const fetchAllData = async () => {
        try {
            setLoader(true);
            // Destructure the necessary parameters from props.route.params
            const { account_no, account_id } = props.route.params;

            // Run all API calls in parallel
            const [
                dispositionCountResponse,
                dropdowndataResponse,
                contactlistResponse,
                addressResponse,
                customerListResponse
            ] = await Promise.all([
                Api.send({ account_number: account_no }, 'diposition/getdisposition_count'),
                Api.get('/diposition/dropdowndata'),
                Api.get(`diposition/phonenumber?account_id=${account_id}`),
                Api.get(`diposition/addressDetails?account_id=${account_id}&disposition=${dropDownState.disposition}`),
                Api.send({ account_no }, 'secure_borrowerdetails/getcustomerList')
            ]);
            setLoader(false);
            setCurrentdate(dropdowndataResponse.date)
            // Set states with the respective responses
            setDispositionCount(dispositionCountResponse.count);
            console.log("dispositionCountResponse.count", dispositionCountResponse.count);


            // Manipulate and set the dropdown data
            if (dispositionCountResponse.count) {
                dropdowndataResponse.disposition_masterfilter = dropdowndataResponse.disposition_master.filter(
                    ele => ele.disposition_name !== 'Site Visit' && ele.disposition_name !== 'Welcome Call'
                );
                // dropdowndataResponse.disposition_master = dropdowndataResponse.disposition_masterfilter;

            } else {
                dropdowndataResponse.disposition_masterfilter = dropdowndataResponse.disposition_master.filter(ele => ele.disposition_name === 'Welcome Call');
                // dropdowndataResponse.disposition_master = dropdowndataResponse.disposition_masterfilter;

            }

            console.log('disposition_masterfilter', dropdowndataResponse.disposition_masterfilter, dropdowndataResponse.disposition_master);
            setDropdowndata(dropdowndataResponse);
            const isPhoneNumber = (str) => /^\d{10}$/.test(str);
            const filteredContacts = contactlistResponse.filter(item => isPhoneNumber(item.cont_number));
            setContact(filteredContacts);
            setAdress(addressResponse);
            // setcustomerList(customerListResponse);
            setcustomerListCopy(customerListResponse);

        } catch (error) {
            setLoader(false);
            setVisibleSnackbar(true);
            setMessage('Error fetching data:');
            console.error('Error fetching data:', error);

        }
    };


    const validation = () => {
        setPreviousdate(false);
        console.log('Dropdown State:', dropDownState);
        if (!validateFields()) {
            console.warn('Form has validation errors. API call aborted.');
            return;
        };
        const currentDate2 = currentdate ? new Date(currentdate) : new Date();
        const currentHour = currentDate2.getHours();
        if (currentHour < 8 || currentHour >= 19) {
            const aftermessage = currentHour >= 19 ? 'Post 7 p.m ?' : "before 8 a.m.?";
            if (currentHour < 8) {
                const previousDate = new Date(currentDate2);
                previousDate.setDate(currentDate2.getDate() - 1); // Set to previous day
                setPredateValue(previousDate);
                setPreviousdate(true);
            } else {
                setPredateValue(currentDate2); // Set to current date
            }
            Alert.alert(
                '',
                `Have you visited/called borrower ${aftermessage}`,
                [

                    {
                        text: 'Yes',
                        onPress: () => {
                            handleSave();
                        },
                    },
                    {
                        text: 'No',
                        onPress: () => {
                            setShoowtimer(true)
                        },
                        style: 'cancel',
                    }
                ],
                { cancelable: false }
            );
            return;
        }
        handleSave();
    }

    const handleSave = async () => {
        try {


            setLoader(true);
            const {
                customer_name,
                bank_name: selling_bank,
                trust: trustname,
                virtual_number,
                zone
            } = acoountdetails;

            const data = {
                customer_name,
                selling_bank,
                trustname,
                virtual_number,
                zone,
                source: 'Spectrum'
            };
            const payload = {
                ...dropDownState,
                ...data,
                ...location
            };

            if (payload.no_contacted_on && payload?.no_contacted_on?.account_id) {
                payload.no_contacted_on = dropDownState?.no_contacted_on?.cont_number;
                payload.con_id = dropDownState?.no_contacted_on?.con_sys_id;
            }

            if (payload.address_visited_on && payload?.address_visited_on?.account_id) {
                payload.address_visited_on = `${dropDownState?.address_visited_on?.address1} ${dropDownState?.address_visited_on?.address2} ${dropDownState?.address_visited_on?.address3} ${dropDownState?.address_visited_on?.city} ${dropDownState?.address_visited_on?.state}`;
                payload.add_id = dropDownState?.address_visited_on?.add_sys_id;
            }

            console.log('Prepared Payload:', JSON.stringify(payload, null, 2));
            let url = 'diposition/createdisposition';
            if (dropDownState.type === 'Site Visit') {
                if (dispositiondata.selected_image && dispositiondata.selected_image.length === 0) {
                    setVisibleSnackbar(true);
                    setMessage('Please Upload Images');
                    return;
                }
                payload.file = dispositiondata.selected_image,
                    url = 'diposition/mobileupload'
            };
            setMessage('Disposition saved successfully.');

            let mode = await Api.getMode()
            if (mode == 'offline') {
                Api.setOfflineSync({ ...payload, url })
                return;
            }
            const response = await Api.send(payload, url);
            setVisibleSnackbar(true);
            console.log('API Response:', JSON.stringify(response, null, 2));

            props.navigation.navigate('Home')

            // Handle success (e.g., show a success message or redirect)
        } catch (error) {
            console.error('Error occurred in handleSave:', error);
            setVisibleSnackbar(true);
            setMessage('An error occurred while saving the disposition. Please try again.');

            // Optionally, handle error (e.g., show an error notification to the user)
        } finally {
            setLoader(false);
            console.log('Final Dropdown State:', dropDownState);
        }
    };

    // const formatDate = (date) => {
    //     const day = String(date.getDate()).padStart(2, '0');
    //     const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    //     const year = date.getFullYear();
    //     // const hours = String(date.getHours()).padStart(2, '0');
    //     // const minutes = String(date.getMinutes()).padStart(2, '0');
    //     // const seconds = String(date.getSeconds()).padStart(2, '0');
    //     return `${year}-${month}-${day} 00:00:00`;

    //     // return `${year}-${month}-${day} ${00}:${minutes}:${seconds}`;
    // };

    const formatDate = (date, formatType = 'datetime') => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        if (formatType === 'datetime') {
            // Return full date and time: YYYY-MM-DD HH:mm:ss
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else if (formatType === 'time') {
            // Return only time: HH:mm
            return `${hours}:${minutes}`;
        } else if (formatType === 'date') {
            // Return only date: YYYY-MM-DD
            return `${year}-${month}-${day}`;
        } else if (formatType === 'datewithtime') {
            // Return only date: YYYY-MM-DD
            return `${year}-${month}-${day} 00:00:00`;
        }
        else {
            throw new Error('Invalid format type. Choose either "datetime", "time", or "date".');
        }
    };


    const removeImage = (index) => {
        console.log(index);

        // Create a shallow copy of the selected_image array
        let images = [...dispositiondata.selected_image];

        // Remove the item at the given index
        images.splice(index, 1);

        console.log(images);

        // Update the state with the new array
        setSelected('selected_image', images);
    }
    const pickimages = () => {
        if (dispositiondata['selected_image'].length < 5) {
            ImagePicker.openPicker({
                width: 300,
                height: 400,
                mediaType: 'photo',
                includeBase64: true,
                multiple: true
                // cropping: true
            }).then(image => {
                if (image.length < 5) {
                    let images = image.map(item => {
                        return {

                            'image': `data:${item.mime};base64,${item.data}`, type: item.mime,
                            filename: getFileNameAndExtension(item.path).fileName,
                            extension: getFileNameAndExtension(item.path).extension
                        }
                    })
                    setSelected('selected_image', [...dispositiondata['selected_image'], ...images])
                } else {
                    showError();
                }
            });

        } else {
            showError();
        }
    }

    const showError = () => {
        setVisibleSnackbar(true);
        setMessage('Please note that a maximum of 4 images can be uploaded. Kindly reduce the number of images and try again');
    }

    const setSelected = (key, item) => {
        setdispositiondata(prv => {
            return { ...prv, [key]: item }
        })
    };


    return (
        <View style={styles.container}>
            {loader && <Loader />}

            <ScrollView showsVerticalScrollIndicator={false}>
                {<Snackbar
                    style={{ zIndex: 100 }}
                    visible={visibleSnackbar}
                    onDismiss={() => setVisibleSnackbar(false)}
                    duration={Snackbar.DURATION_SHORT}
                >
                    {message}
                </Snackbar>}
                <View style={{ ...styles.input, marginTop: 20 }}>
                    <Dropdown
                        hideMenuHeader={true}

                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        label="Account Number"
                        placeholder="Account Number"
                        options={[
                            {
                                label: selectedOption,
                                value: selectedOption,
                            },
                        ]}
                        mode='outlined'
                        value={dropDownState.account_number}
                        onSelect={(item) => handleDropDownChange('account_number', item)}
                    />
                </View>

                <View style={styles.input}>
                    <Dropdown
                        hideMenuHeader={true}
                        label="Type"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        placeholder="Select Type"
                        // options={type}
                        options={dispositionCount == 0 ?
                            typeOption.filter(item => item.value === 'Call') : typeOption
                        }
                        mode='outlined'
                        value={dropDownState.type}
                        onSelect={(item) => handleDropDownChange('type', item)}
                    />
                    {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
                </View>

                {dropDownState.type == 'Field Visit' && <View style={styles.input}>
                    <Dropdown
                        hideMenuHeader={true}
                        label="Nature"
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        placeholder="Select Nature"
                        options={nature}
                        mode='outlined'
                        value={dropDownState.nature}
                        onSelect={(item) => handleDropDownChange('nature', item)}
                    />
                    {errors.nature && <Text style={styles.errorText}>{errors.nature}</Text>}
                </View>
                }



                {dropDownState.type != 'Site Visit' && <View style={styles.input}>
                    <Dropdown
                        label="Disposition"
                        hideMenuHeader={true}
                        style={styles.inputstyle}
                        menuContentStyle={styles.menuContentStyle}
                        placeholder="Select Disposition"
                        options={dropdowndata?.disposition_masterfilter?.map(item => ({
                            label: item.disposition_name,
                            value: item.disposition_name,
                        })) || []}
                        mode='outlined'
                        value={dropDownState.disposition}
                        onSelect={handleSelectionChange}
                    />
                    {errors.disposition && <Text style={styles.errorText}>{errors.disposition}</Text>}

                </View>
                }
                {formFields.map((field, index) => (
                    <View key={index} style={styles.input}>

                        {(field.type === 'dropdown' && field.formControl_name === 'no_contacted_on') && (
                            <Dropdown key={index + field.formControl_name}
                                hideMenuHeader={true}
                                label={field.label}
                                mode="outlined"
                                style={styles.inputstyle}
                                menuContentStyle={styles.menuContentStyle}
                                placeholder={field.label}
                                value={dropDownState[field.formControl_name]}
                                onSelect={(item) => handleDropDownChange(field.formControl_name, item)}
                                options={contact?.map(item => ({
                                    label: item.cont_number,
                                    value: item,
                                })) || []}
                            />
                        )}

                        {(field.type === 'dropdown' && field.formControl_name === 'person_contacted_name') && (
                            <Dropdown key={index + field.formControl_name}
                                hideMenuHeader={true}
                                label='Name'
                                mode="outlined"
                                style={styles.inputstyle}
                                menuContentStyle={styles.menuContentStyle}
                                placeholder={field.label}
                                value={dropDownState[field.formControl_name]}
                                onSelect={(item) => handleDropDownChange(field.formControl_name, item)}
                                options={customerList?.map(item => ({
                                    label: item['Customer Name'],
                                    value: item['Customer Name'],
                                }))}
                            />
                        )}


                        {(field.type === 'dropdown' && field.formControl_name === 'address_visited_on') && (
                            <Dropdown key={index + field.formControl_name}
                                hideMenuHeader={true}
                                label={field.label}
                                mode="outlined"
                                style={styles.inputstyle}

                                // CustomDropdownItem = {(item) => (
                                //     <ScrollView horizontal>
                                //       <Text style={{color:COLORS.black}}>{JSON.stringify(item)}</Text>
                                //     </ScrollView>
                                //   )}
                                menuContentStyle={styles.menuContentStyle}
                                placeholder={field.label}
                                value={dropDownState[field.formControl_name]}
                                onSelect={(item) => handleDropDownChange(field.formControl_name, item)}
                                options={adress?.map(item => ({
                                    label: `${item.address1} ${item.address2} ${item.address3} ${item.city} ${item.state}`,
                                    value: item,
                                })) || []}
                            />
                        )}

                        {((field.type === 'dropdown' && (field.formControl_name !== 'address_visited_on' && field.formControl_name !== 'no_contacted_on' && field.formControl_name !== 'person_contacted_name'))) && (
                            <Dropdown key={index + field.formControl_name}
                                hideMenuHeader={true}
                                label={field.label}
                                mode="outlined"
                                style={styles.inputstyle}
                                menuContentStyle={styles.menuContentStyle}
                                placeholder={field.label}
                                textInputStyle={{
                                    numberOfLines: 4, // Limits to one line
                                    textAlign: 'left', // Align text to the left
                                }}
                                value={dropDownState[field.formControl_name]}
                                onSelect={(item) => handleDropDownChange(field.formControl_name, item)}
                                options={field?.dropdowndata?.map(item => ({
                                    label: item,
                                    value: item,
                                })) || []}
                            />
                        )}
                        {field.type === 'text' && (
                            <TextInput key={index + field.formControl_name}
                                label={field.label}
                                value={dropDownState[field.formControl_name]}
                                onChangeText={(item) => handleDropDownChange(field.formControl_name, item)}
                                mode='outlined'
                                keyboardType={field.rules?.pattern ? 'numeric' : 'default'}
                            />
                        )}

                        {field.type === 'time' && (
                            <>
                                <TextInput key={index + field.formControl_name}
                                    mode='outlined'
                                    readOnly
                                    value={dropDownState[field.formControl_name]}
                                    // onChangeText={(item) => handleDropDownChange(field.formControl_name, item)}
                                    right={<TextInput.Icon color={COLORS.primary} icon="clock-outline" onPress={() => onDateClick(field.label)} />}
                                    label={field.label}
                                />
                                {(showDatePicker && label === field.label) && (
                                    <DateTimePicker key={index + field.formControl_name + 'date'}
                                        // minimumDate={new Date()}
                                        mode='time'
                                        display='clock'
                                        value={new Date()}
                                        // value={dropDownState[field.formControl_name] ? new Date(dropDownState[field.formControl_name]): new Date()}
                                        onChange={(event, date) => onChange(event, date, field.formControl_name, 'time')}
                                    />
                                )}
                            </>
                        )}
                        {field.type === 'date' && (
                            <>
                                <TextInput key={index + field.formControl_name}
                                    mode='outlined'
                                    readOnly
                                    value={dropDownState[field.formControl_name]}
                                    // onChangeText={(item) => handleDropDownChange(field.formControl_name, item)}
                                    right={<TextInput.Icon color={COLORS.primary} icon="calendar" onPress={() => onDateClick(field.label)} />}
                                    label={field.label}
                                />
                                {(showDatePicker && label === field.label) && (
                                    <DateTimePicker key={index + field.formControl_name + 'date'}
                                        minimumDate={new Date()}
                                        mode='date'
                                        display='calendar'
                                        value={dropDownState[field.formControl_name] ? new Date(dropDownState[field.formControl_name]) : new Date()}
                                        onChange={(event, date) => onChange(event, date, field.formControl_name)}
                                    />
                                )}
                            </>
                        )}
                        {errors[field.formControl_name] && <Text style={styles.errorText}>{errors[field.formControl_name]}</Text>}

                    </View>
                ))}

                <View style={styles.input}>
                    <TextInput
                        mode='outlined'
                        readOnly
                        activeOutlineColor={COLORS.primary}
                        value={dropDownState.followup_date}

                        right={<TextInput.Icon icon="calendar" color={COLORS.primary} onPress={() => onDateClick('Followup Date')} />}
                        label='Follow Up Date'
                    />

                    {(showDatePicker && label === 'Followup Date') && (
                        <DateTimePicker
                            minimumDate={new Date()}
                            mode='date'
                            display='calendar'
                            value={date}
                            textColor='red'
                            accentColor='red'

                            onChange={OndateSelected}
                        />
                    )}

                    {errors.followup_date && <Text style={styles.errorText}>{errors.followup_date}</Text>}



                </View>

                <View style={styles.input}>
                    <TextInput
                        mode='outlined'
                        label="Remark"
                        placeholder="Enter your remark"
                        value={dropDownState.remarks}
                        onChangeText={(item) => handleDropDownChange('remarks', item)}
                        multiline={true}
                        numberOfLines={4}
                        activeOutlineColor={COLORS.primary}
                    />
                    {errors.remarks && <Text style={styles.errorText}>{errors.remarks}</Text>}
                </View>


                {(shoowtimer && previousdate) && (

                    <DateTimePicker
                        mode='date'
                        display='calendar'
                        minimumDate={predateValue}
                        maximumDate={new Date()}
                        value={predateValue}
                        onChange={(event, date) => onChangeActivity(event, date, 'activity_date', 'date')}
                    />


                )}


                {(!previousdate && shoowtimer) && (<DateTimePicker
                    value={predateValue} // Use the selected time or current time
                    mode='time' // Show only the time picker
                    display='clock'
                    onChange={(event, date) => onChangeActivity(event, date, 'activity_time', previousdatetime ? 'time' : 'datetime')}
                />)}
                {dropDownState.type === 'Site Visit' && <ScrollView
                    showsHorizontalScrollIndicator={false}
                    horizontal={true}
                    style={styles.imagedrawer}
                >

                    {dispositiondata['selected_image'].map((item, index) => {

                        return <View style={{ position: 'relative' }}>
                            <View style={{ position: 'absolute', width: 15, height: 15, right: 5, top: 5, zIndex: 100 }}>
                                <TouchableOpacity onPress={() => removeImage(index)} onLongPress={() => removeImage(index)} >
                                    <IconManager iconClass="antdesign" icon='closecircleo' color={COLORS.black} size={15} />
                                </TouchableOpacity>
                            </View>

                            <Card key={index} mode='outlined' style={styles.imgdrwcard} >

                                <Card.Cover

                                    style={{ width: 100, height: 120, marginHorizontal: 13, borderRadius: 10 }}
                                    source={{ uri: item.image }} />

                            </Card>
                        </View>

                    })

                    }
                    <Card style={{ flexDirection: 'row', justifyContent: 'center', alignSelf: "center", marginLeft: 10 }}>
                        <Card.Content>
                            <IconButton
                                style={{ width: 80, marginHorizontal: 13, borderRadius: 10 }}
                                icon="camera"
                                // iconColor={'black'}
                                size={50}
                                onPress={pickimages}
                            />
                        </Card.Content>
                    </Card>

                </ScrollView>}
            </ScrollView>


            <View style={styles.btnctn}>
                <TouchableOpacity onPress={validation}>
                    <Text style={{ textAlign: 'center', color: COLORS.white, fontSize: 16, letterSpacing: 1, padding: 20 }}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Usecuredisposition;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: COLORS.bg,
        position: 'relative',
        paddingBottom: 70,
        backgroundColor: COLORS.white
    },
    input: {
        marginBottom: 20,
        paddingLeft: 20,
        paddingRight: 20
    },
    inputstyle: {
        backgroundColor: COLORS.white,
        // borderColor: 'red', // Customize border color
        borderWidth: 2,
        // borderColor : COLORS.primary,

    },
    menuContentStyle: {
        backgroundColor: '#fff',
        width: '100%',

    },
    btnctn: {

        backgroundColor: COLORS.primary,
        position: 'absolute',
        width: '100%',
        bottom: 0
    },
    errorText: {
        color: 'red',
        marginTop: 5,
    },
    imgdrwcard: { flexDirection: 'row', justifyContent: 'center', marginLeft: 10 },
    imagedrawer: { display: 'flex', flexDirection: 'row', height: 120, paddingHorizontal: 3, alignSelf: 'center' },
});


