import React, { useEffect, useState } from 'react'
import { FlatList, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper'
import DateTimePicker from '@react-native-community/datetimepicker'
import Icon from 'react-native-vector-icons/Ionicons'
import Api from '../Utilities/apiService'
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather'
import { base64ToBlob, getFileNameAndExtension } from '../Utilities/CommonFun'
import { COLORS } from '../theme/theme'
const Disposition = (props) => {
    const [date, setDate] = useState(new Date())
    const [showpicker, setShowPicker] = useState(false)
    const [followupdate, setFollowupdate] = useState("")
    const [dropdowndata, setDropdowndata] = useState({})
    const [dispositiondata, setdispositiondata] = useState({ selected_image: [] });
    const [dispotype, setdistype] = useState([{ 'label': 'Site Visit', value: 'Site Visit' }, { 'label': 'Feild Visit', value: 'Feild Visit' }, { 'label': 'Call', value: 'call' }])
    const [selectedDis, setSelectedDis] = useState({});
    const getDropdowndata = async () => {
        try {
            let result = await Api.get('diposition/dropdowndata')
            let dropdown = {}
            result.dropdownValue.forEach(itm => {
                if (itm.input_type == 'Site Visit') {

                    dropdown.keys = [itm.input_type];
                    dropdown[itm.input_type] = JSON.parse(itm.drop_down_value)
                    dropdown['person_contact'] = ["Borrower", "Co-borrower", "Guarantor", "Relative", "Acquaintance", "TP-Payment", "TP", "Bidder", "Other"]
                    dropdown['reason'] = ["Property Inspection", "Legal Notice Pasting", "Possession activities"]
                    dropdown['grade_classification'] = ["Vacant property", "Possession withThird party/Builder", "Property not found/traceable", "Physical Possession – SB/SI", "Physical Possession– EARC", "Other Bank/SI notice/possession", "Incomplete construction", "Possession with Owner", "Property Rented/ on lease"]
                    dropdown['property_type'] = ["Flat", "Bungalow/Row house", "Land/Plot", "Commercial Shop/Office", "Warehouse/Godown", "Not Applicable"]
                    dropdown['status_of_property'] = ["Excellent", "Good", "Standard", "Average", "Poor", "Not Applicable"]
                    dropdown['address_visited_on'] = [
                        "SY NO. 228/1 EDAPPALLY SOUTH VILLAGE ELAMAKKARA KANAYANNUR TALUK,EDAPPALLY,ERNAKULAM-682026   , ERNAKULAM "
                    ]
                    // if(Array.isArray(dropdown[itm.input_type]) && itm.input_type == 'Site Visit'){
                    //     dropdown[itm.input_type].forEach(item=>{
                    //         dropdown[itm.input_type][item.formControl_name] = item.dropdowndata
                    //     })
                    // }
                }
            })
            setDropdowndata(dropdown)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => { getDropdowndata() }, [])

    const pickimages = () => {

        ImagePicker.openPicker({
            width: 300,
            height: 400,

            includeBase64: true,
            multiple: true
            // cropping: true
        }).then(image => {
            let images = image.map(item => {
                // return `data:${item.mime};base64,${item.data}`
                return {
                
                    'image': `data:${item.mime};base64,${item.data}`, type: item.mime,
                    filename: getFileNameAndExtension(item.path).fileName,
                    extension: getFileNameAndExtension(item.path).extension
                }
            })
            // let aa =  `data:${image.mime};base64,${image.data}`
            // {uri: `data:${image.mime};base64,${image.data}`}
            setSelected('selected_image', [...dispositiondata['selected_image'],...images])
            // setSelected('selected_image',aa)
        });
    }
    const toggleDatepicker = () => {
        setShowPicker(!showpicker)
    }

    const onChange = ({ type }, selectedDate) => {
        if (type == 'set') {
            const currentDate = selectedDate
            setDate(currentDate)
            if (Platform.OS === 'android') {
                toggleDatepicker()
                setFollowupdate(currentDate.toDateString())
            }
        } else {
            toggleDatepicker()
        }
    }

    const setSelected = (key, item) => {
        setdispositiondata(prv => {
            return { ...prv, [key]: item }
        })
    }

    const savedata = async () => {
        try {
            let disobj = {
                url: 'diposition/uploadeimages',
                ...dispositiondata,
                'type': dispositiondata['distype'],
                'disposition': dispositiondata['distype'],
                'account_number': props.route.params.account_no,
                'customer_name': '',
                trustname: props.route.params.trust,
                virtual_number: props.route.params.virtual_number,
                selling_bank: '',
                disposition_id: '9',
                'zone': props.route.params.zone,
                'lattitude': '',
                'longitude': '',
                followup_date: followupdate,
                // person_contacted_name
                add_id: dispositiondata.address_visited_on,
                con_id: null,
                nature: 'Visit',
                // person_contacted
                // reason
                // grade_classification
                // property_type
                // status_of_property
                // market_value_of_property
                address_visited_on: dispositiondata.addressval.value,
                "source": "Spectrum",
                "uploadedfrom": "Gallary",
                file: dispositiondata.selected_image,
                "lattitude": 17.433028,
                "longitude": 78.3728344



            }
            // console.log(disobj);
            // dispositiondata.selected_image.forEach((item, index) => {
            // Convert base64 string to Blob
            // const blob = base64ToBlob(item.image);

            // Append Blob to FormData with a unique name (e.g., 'image1', 'image2', ...)
            // formData.append(`file${index + 1}`, blob, `file${index + 1}.${item.path.extension}`);
            //     formData.append(`file`, blob, `${item.path.fileName}.${item.path.extension}`);
            //   });

            // let formdata = new FormData();
            // formdata.append('data',JSON.stringify(disobj))
            // formdata.append('location',JSON.stringify({"lattitude":17.433028,"longitude":78.3728344}))
            // formdata.append('file',JSON.stringify(dispositiondata.selected_image)) 
            // console.log("api call");

           // console.log("disobjd", disobj);
            let response = await Api.sendTest(disobj, 'diposition/mobileupload')
           // console.log(response);
            await AsyncStorage.setItem('disposition', JSON.stringify(disobj));
            // let data = await AsyncStorage.getItem('disposition');

        } catch (error) {
            console.log(error)
        }
    }
    const onaddressSelected = () => {
        let combineaddress = dropdowndata.combineaddress;
        let add_key = dispositiondata.address_visited_on
        let key = combineaddress.find(itm => itm.key == add_key)
        setdispositiondata(prv => { return { ...prv, addressval: key } })
    }
    const ontypeSelect = async (val) => {
        let address_api = await Api.get(`diposition/addressDetails?account_id=${props.route.params.account_id}&disposition=${dispositiondata['distype']}`)
        let phone_api = await Api.get(`diposition/phonenumber?account_id=${props.route.params.account_id}`)
        setSelectedDis({
            [dispositiondata['distype']]: {
                address_api, phone_api
            }
        });

        let combineaddress = address_api ? address_api.map(itm => { return { value: `${itm.address1},${itm.address2},${itm.address3}`, key: itm.add_sys_id } }) : ['']

        setDropdowndata(prv => {
            return { ...prv, address_visited_on: combineaddress, combineaddress }
        })


    }
    return (
        <View>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                <View style={styles.container_1}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <View style={{ flex: 1 }}>
                            <SelectList dropdownStyles={styles.dropdownStyles}
                                search={false}
                                setSelected={(value) => setSelected('account_no', value)}
                                boxStyles={styles.liststyle}
                                data={[props.route.params.account_no]}
                                placeholder='Account No'

                            />
                        </View>
                        {/* <Feather  name="check-circle" color="green" size={20} /> */}
                    </View>

                    <SelectList dropdownStyles={styles.dropdownStyles}
                        search={false}
                        setSelected={(value) => setSelected('distype', value)}
                        onSelect={(e) => ontypeSelect(e)}
                        boxStyles={styles.liststyle}
                        data={dispotype}
                        placeholder='Select Type'
                    />
                    <SelectList dropdownStyles={styles.dropdownStyles}
                        search={false}
                        setSelected={(val) => { setSelected("person_contacted", val) }}
                        boxStyles={styles.liststyle}
                        data={dropdowndata.person_contact}
                        placeholder='Person Contacted'

                    />
                    <TextInput
                        underlineColor="transparent"
                        
                        onChangeText={(val) => setSelected('person_contacted_name', val)}
                        style={styles.textInput}
                        label="Person Contacted Name"
                    />
                    <SelectList dropdownStyles={styles.dropdownStyles}
                        search={false}
                        setSelected={(val) => { setSelected("reason", val) }}
                        boxStyles={styles.liststyle}
                        data={dropdowndata.reason}
                        placeholder='Reason for Site Visit'
                    />

                    <SelectList dropdownStyles={styles.dropdownStyles}
                        search={false}
                        setSelected={(val) => { setSelected("grade_classification", val) }}
                        boxStyles={styles.liststyle}
                        data={dropdowndata.grade_classification}
                        placeholder='Property Classification'
                    />
                    <SelectList dropdownStyles={styles.dropdownStyles}
                        search={false}
                        setSelected={(val) => { setSelected("property_type", val) }}
                        boxStyles={styles.liststyle}
                        data={dropdowndata.property_type}
                        placeholder='Property Type'
                    />
                    <SelectList dropdownStyles={styles.dropdownStyles}
                        search={false}
                        setSelected={(val) => { setSelected("status_of_property", val) }}
                        boxStyles={styles.liststyle}
                        data={dropdowndata.status_of_property}
                        placeholder='Status Of Property'
                    />

                    <TextInput
                        keyboardType='number-pad'
                        underlineColor="transparent"
                        onChangeText={(val) => setSelected('market_value_of_property', val)}
                        style={styles.textInput}
                        label="Market Value Of Property"
                    />
                    <SelectList dropdownStyles={styles.dropdownStyles}
                        search={false}
                        setSelected={(val) => {
                            setSelected("address_visited_on", val)
                        }}
                        onSelect={onaddressSelected}
                        boxStyles={styles.liststyle}
                        data={dropdowndata.address_visited_on}
                        placeholder='Address Visited On'
                    />

                    <TextInput underlineColor="transparent"
                        setSelected={(val) => { setSelected("remarks", val) }}
                        style={styles.textInput}
                        label="Remark"
                    />

                    {showpicker && <DateTimePicker minimumDate={new Date()} mode='date' display='spinner' value={date} onChange={onChange} />}
                    {!showpicker && (
                        <Pressable onPress={toggleDatepicker}>
                            <TextInput underlineColor="transparent"
                                style={styles.textInput}
                                placeholder='Follow Up Date'
                                value={followupdate}
                                editable={false}
                                onChangeText={setFollowupdate}
                            />
                        </Pressable>
                    )}

                    {/* <View style={{ padding: 10 }}>
                        <Button onPress={pickimages} icon={({ size, color }) => (<Icon name="camera-outline" size={50} color={color} />)}>Capture Image</Button>
                    </View> */}
                    <ScrollView 
                    showsHorizontalScrollIndicator={false} 
                    horizontal={true}
                    style={styles.imagedrawer}>
                        {
                            dispositiondata['selected_image'].map((item,index) => {
                               
                                return <Card key={index} mode='outlined' style={styles.imgdrwcard}>
                                        <Card.Cover
                                            style={{ width: 100, height: 120, marginHorizontal: 13, borderRadius: 10 }}
                                            source={{ uri: item.image }} />

                                    </Card>
                                   
                            })

                        }
                        <Card style={{ flexDirection: 'row', justifyContent: 'center',alignSelf:"center", marginLeft: 10 }}>
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
                        {/* <Button onPress={openImageModel} icon={({size,color})=>(<Icon name="camera-outline" size={50} color={color}/>)}>Capture Image</Button> */}
                    </ScrollView>
                </View>


            </ScrollView>


            <View style={styles.buttonView}>

                <TouchableOpacity style={styles.button} onPress={savedata}>

                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>


            </View>


        </View>
    )
}

const styles = StyleSheet.create({
    imagedrawer:{  display:'flex', flexDirection: 'row', height: 120, paddingHorizontal: 3, paddingVertical: 3,marginTop:10,alignContent:'center' },
    imgdrwcard:{ flexDirection: 'row', justifyContent: 'center', marginLeft: 10 },
    buttonView: {
        padding: 20,
        width: "100%",
        // paddingHorizontal: 10,
        position: 'absolute',
        bottom: 0,
        backgroundColor: COLORS.white,
        // borderTopColor:COLORS.lightGrey,
        // borderTopWidth:2,
        display: 'flex',
        justifyContent: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // borderRadius:10
    },
    button: {
        height: 55,
        backgroundColor: COLORS.primary,
        borderColor: "#CED4DA",
        borderWidth: 1,
        borderRadius: 10,
        // fontSize:25,
        alignItems: "center",
        justifyContent: "center"
    },
    buttonText: {
        color: "#ffffff"
    },
    container: {
        // flex:1
        marginBottom: 100,
        backgroundColor: COLORS.bg,

    },
    container_1: {
        flex: 1,
        margin: 5,
        padding: 12
    },
    liststyle: {
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        borderColor: COLORS.white,
        height: 50

    },
    dropdownStyles: {
        borderRadius: 0,
        backgroundColor: COLORS.white,
        borderColor: COLORS.lightGrey,
    },
    textInput: {
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        borderColor: COLORS.white,
        height: 50,

    }

})

export default Disposition;