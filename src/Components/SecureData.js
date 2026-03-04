import { useCallback,useRef, useState ,useEffect } from "react"
import { ScrollView, Modal,Button,StyleSheet, TouchableOpacity, View, BackHandler, Alert, Animated, Dimensions } from 'react-native'
import { Card, IconButton, Menu, Searchbar, Text, Divider,TextInput } from 'react-native-paper'
import Api from "../Utilities/apiService"
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CardInfo from "./CardInfo"
import { FlatList } from "react-native-gesture-handler"
import { COLORS, FONTWEIGHT, SIZES } from '../theme/theme'
import Loader from "./Loader";
import SkeletonLoader from "./SkeletonLoader ";
import IconManager from "../Utilities/IconManager";
import { useDispatch, useSelector } from "react-redux";
import { setSecure, setSecureFilter } from "../Redux/Slicer/UserSlice";


import { Dropdown as PaperDropdown } from 'react-native-paper-dropdown';
import commonfun from "../Utilities/CommonFun";
import { Dropdown } from 'react-native-paper-dropdown';
import FilterPanel from "./FilterPanel";
import { CommonActions, useFocusEffect,useNavigation  } from "@react-navigation/native";
import AccountDeatilsPopup from "./account_deatils_popup";

import {
  requestLocationPermissions,
  requestBatteryOptimizationExemption,
} from '../Utilities/permissions';
import {
  initLocationTracking,
  stopLocationTracking,
  sendManualLocationPing,
} from '../services/locationService_old';

const debounceing = (func, delay) => {
    let timeoutId;

    return (...args) => {
        
        if (timeoutId) {
            clearTimeout(timeoutId)
        };
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const SecureData = ({ navigation }) => {
    const nvstate = navigation.getState();
    const {secure:{borrowerdetails,filterborrowerlist}} = useSelector(state=>state.USER);
    const dispatch = useDispatch();
    const [toggleMenu, setToggleMenu] = useState({});
    const [securedata, setSecuredata] = useState([]);
    const [tempsecuredata, settempSecuredata] = useState([]);
    const [openInfocard, setInfoCard] = useState(false)
    const [currentItem, setCurrentItem] = useState({});
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuIndex, setMenuIndex] = useState(null);
    const [loader, setLoader] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    // const[isloading,setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);


    const [query, setQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    // const [filter, setFilter] = useState({});
    const [filtersparams,setFilterParams] = useState({});
    const [filterPanelVisible, setFilterPanelVisible] = useState(false);
    const [filterPosition, setFilterPosition] = useState(Dimensions.get('window').width);
    const [isfilterset,isfiltersetval] = useState(false);
    
    const toggleFilterPanel = useCallback((param={}) => {
        console.log("-----------is toggle------------")
        setQuery('');
        setDropdownVisible(false)
        setFilterPanelVisible(!filterPanelVisible);
        setFilterPosition(filterPanelVisible ? Dimensions.get('window').width : 0);
    }, [filterPanelVisible]);
  const nav = useNavigation();
  const applyFilters = async(params) => {
    console.log("----call apply filters------")
    setCurrentPage(0);
    setFilterParams(params)
    let apres = await Api.sendRequest(params,'secure_borrowerdetails/secure_borrowerdetailsData');
    if(!apres.ok){
       
        navigation.dispatch(CommonActions.reset({
          index:0,
          routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
        }))
      }
    let response = await apres.json(); 
     dispatch(setSecureFilter(response.ArrayOfResponse))
     toggleFilterPanel();
  };
 useEffect(() => {
    nav.setOptions({
      headerStyle: {
        backgroundColor: COLORS.primary, // ✅ background of header/tab bar
          borderBottomLeftRadius: 25,   // ✅ curve left side
            paddingLeft: 10,           // ✅ padding inside tab
            paddingBottom: 5,
      },
      headerTintColor: '#fff', // text/icon color in header
    });
  }, [nav]);



  const bootstrapApp = async () => {
    setLoading(true);
    try {
      // For demo — simulate a logged-in officer
      // In real app, this comes from your login API response
 
      // Request location permissions
      const granted = await requestLocationPermissions();
      if (!granted) {
        Alert.alert('Error', 'Location permissions are required.');
        return;
      }

      // Request battery optimization exemption (Android only)
      await requestBatteryOptimizationExemption();

      // Start background tracking
      await initLocationTracking();
      setIsTracking(true);

      console.log('[App] ✅ Background location tracking initialized.');
    } catch (err) {
      console.error('[App] Bootstrap error:', err.message);
      Alert.alert('Error', 'Failed to initialize location tracking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async () => {
    setLoading(true);
    try {
      const result = await sendManualLocationPing('borrower_visit');
      if (result.success) {
        const now = new Date().toLocaleTimeString();
        setLastPing(now);
        Alert.alert(
          '✅ Check-in Successful',
          `Location sent at ${now}\nLat: ${result.coords.latitude.toFixed(5)}\nLng: ${result.coords.longitude.toFixed(5)}`
        );
      } else {
        Alert.alert('❌ Check-in Failed', result.error);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
    bootstrapApp();
    handleManualCheckIn()
  }, []);



    const getdata = async (currentPages) => {
        console.log("================+++++",currentPages);
       
        try {
            setCurrentPage(currentPages)
            // if (isLoadingMore || !hasMoreData) return;
            setIsLoadingMore(true)
            let params = Object.keys(filtersparams).length > 0 ? {...filtersparams,pageIndex:currentPages}:{
                "pageIndex": currentPages,
                "pageSize": 10,
                "isfromCovex": false
                

            }

            console.log(params);
            let apres = await Api.sendRequest(params, 'secure_borrowerdetails/secure_borrowerdetailsData');
            if(!apres.ok){
       
                navigation.dispatch(CommonActions.reset({
                  index:0,
                  routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
                }))
              }
            let  result = await apres.json(); 
            setLoader(false);
            result.ArrayOfResponse.length < 10 ? setHasMoreData(false):setHasMoreData(true);
            dispatch(setSecure([...borrowerdetails ,...result.ArrayOfResponse]));
            
            // if (parseInt(result.totalRecords) >= securedata.length) {
            //     setSecuredata(prevData => [...prevData, ...result.ArrayOfResponse]);
            //     // settempSecuredata(prevData => [...prevData, ...result.ArrayOfResponse]);
            //     setCurrentPage(currentPages);
            // } else {
            //     setHasMoreData(false); // No more data available
            // }
        } catch (error) {
            console.log("the error is")
            console.log(result)
        } finally {
            setIsLoadingMore(false);
            setLoader(false);
        }

    }

    useFocusEffect(useCallback(()=>{
        getdata(0);
        setQuery('');
        dispatch(setSecure([]))
        BackHandler.addEventListener('hardwareBackPress',backHandler);
        return ()=>{
            BackHandler.removeEventListener('hardwareBackPress',backHandler);
            setCurrentPage(0);
            isfiltersetval(false);
        }
    },[]))
  
    const handleaccountsuggestion = useRef(debounceing((text)=>{
        
            
        if(text.length >2){
            fetchAccounts(text);
        }else{
        
            isfiltersetval(false);
            dispatch(setSecureFilter([]));
            setDropdownVisible(false)
        }
    
    },1600)).current

    const handleserach = (text)=>{
        setQuery(text)
        handleaccountsuggestion(text)
    }

    const fetchAccounts = async (searchQuery) => {
        try {
            const apres = await Api.sendRequest({
                "accountno": searchQuery,
                from: "search",
            }, 'secure_borrowerdetails/secure_borrowerdetailsData');
            if(!apres.ok){
                navigation.dispatch(CommonActions.reset({
                  index:0,
                  routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
                }))
              }
              let response = await apres.json();
            dispatch(setSecureFilter(response.ArrayOfResponse))
            setDropdownVisible(response.ArrayOfResponse.length == 0 ?  false:true);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleSelect = async (item) => {
        isfiltersetval(true)
        // console.log(filterborrowerlist,"==========");
        let selectitem = filterborrowerlist.filter(itm=>itm.account_no == item.account_no)
        dispatch(setSecureFilter(selectitem));
        setQuery(item.account_no);
        setDropdownVisible(false);
    };

    const filterData = async (currentPages, accountno) => {
        try {
            setLoader(true);
            let apres = await Api.sendRequest({
                "pageIndex": currentPages,
                "pageSize": 10,
                "isfromCovex": false,
                accountno
            }, 'secure_borrowerdetails/secure_borrowerdetailsData');
            if(!apres.ok){
                navigation.dispatch(CommonActions.reset({
                  index:0,
                  routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
                }))
              }
            let result = await apres.json();
            setSecuredata(prevData => [...result.ArrayOfResponse]);
            settempSecuredata(prevData => [...result.ArrayOfResponse]);
            setCurrentPage(currentPages);
            
            accountno ? setHasMoreData(false) : setHasMoreData(true);
        } catch (error) {
            console.log(error)
        } finally {
            setLoader(false);
        }

    }

    const handleOutsideClick = () => {
        setDropdownVisible(false);
    };

    
    onMenuopen = (index) => {
        setToggleMenu(prv => ({
            ...prv,
            [index]: !prv[index]
        }))
    }

    onMenuclose = () => { setToggleMenu(false) }

    const onDisposition = (item, index) => {
        setMenuVisible(false);
        navigation.navigate('DispositionNew', item)
    }

    const togleinfoCard = (flag, item = {}) => {
        setInfoCard(flag)
        if (Object.keys(item).length > 0) {
            setCurrentItem(item)
        }
    }

    const onMenuOpenbar = (index) => {
        setMenuIndex(index);
        setMenuVisible(!menuVisible);
    };

    const onAccountdetails = (item) => {
        setMenuVisible(false);
        navigation.navigate('AccDetails', item)
    }

    const Account360View = (item) => {
        setMenuVisible(false);
        navigation.navigate('Account360', item)
    }

    const handleEndReached = ()=>{
        console.log("---------end reach----------")
        if(hasMoreData){
            getdata(currentPage+1);
        }
    }
    
    const backHandler = () => {
        Alert.alert('Exit App!', 'Are you sure you want to exit ?', [
            {
                text: 'Cancel',
                onPress: () => null,
                style: 'cancel'
            },
            {
                text: 'Exit',
                onPress: () => BackHandler.exitApp()
            }
        ])
        return true
    }
    const redirectTo = (route, item) => {
        setMenuVisible(false);
        navigation.navigate(route, item)
    }

    const handleClear = () => {
        setQuery('');
        filterData(0); // Fetch all data when cleared
    };
    

    const onClose  = () =>{
        setInfoCard(!openInfocard)
    };


    if (loader) {
        return (
            <View style={styles.skeleton}>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
            </View>
        )
    }


    return (
        <View style={styles.container}>
            <View style={styles.filters}>
                <View>
                    <Searchbar
                        placeholder='Search Account No.'
                        value={query}
                        iconColor={COLORS.primary}
                        rippleColor={COLORS.primary}
                        onChangeText={handleserach}
                        onClearIconPress={handleClear}
                        style={styles.serachbar}
                        right = {()=>(
                            <TouchableOpacity style={styles.filterButton} onPress={toggleFilterPanel}>
                                <IconManager iconClass='ionicon' icon="options" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    />
       
                </View>
                {dropdownVisible && <View style={styles.dropdown}>
                    <FlatList
                        data={filterborrowerlist}
                        keyExtractor={(item) => item?.account_id}
                        renderItem={({ item }) => (

                            <View>
                                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelect(item)}>
                                    <Text style={styles.dropdownText}>{item.account_no}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </View>}

            </View>
            <View style={{ marginBottom: 100 }}>
                {/* {( filteredAccounts.length > 0) &&   <Dropdown filteredAccounts={filteredAccounts}/>  } */}
    
                <FlatList 
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isLoadingMore && <SkeletonLoader />}
                    ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
                    keyExtractor={(item, index) => index}
                    data={isfilterset ? filterborrowerlist:borrowerdetails}
                    renderItem={({ item, index }) => {
                        return (

                            <View style={{ backgroundColor: COLORS.bg }}>
                                <Card style={styles.card}>
                                    <Card.Title
                                        style={{ padding: 0, margin: 0, position: 'absolute', top: -25, right: -5 }}
                                        right={(props) => {
                                            return (
                                                <View  >
                                                    <Menu
                                                        contentStyle={{ margin: 10, borderRadius: 7, backgroundColor: COLORS.white }}
                                                        visible={menuVisible && menuIndex === index}
                                                        onDismiss={() => { setMenuVisible(false) }}
                                                        anchor={<Icon onPress={() => onMenuOpenbar(index)} name="dots-vertical" size={30} style={{ color: COLORS.primary, marginRight: 0 }} />}
                                                    >

                                                        <Menu.Item onPress={() => onDisposition(item)} contentStyle={{ padding: 5 }} title="Disposition" />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Account Details" onPress={() => onAccountdetails(item)} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="360 View" onPress={() => Account360View(item)} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Contacts" onPress={() => redirectTo( 'Contacts', item)} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Address" onPress={() => redirectTo('Address', item)} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Customer List" onPress={() => redirectTo('CustomerList', item)} />
                                                        <Divider />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Liveliness" onPress={() => redirectTo('Liveliness', item)} />

                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Resolution Recommendation" onPress={() => redirectTo('Resolution', item)} />

                                                    </Menu>
                                                </View>
                                            )
                                        }}

                                    />
                                    <TouchableOpacity style={{ marginTop: 25, borderRadius: 10 }}
                                        onPress={() => { togleinfoCard(true, item) }}>
                                        <Card.Content style={{ padding: 0, margin: 0 }}>
                                            <View style={styles.row}>
                                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%' }}>
                                                    <View style={styles.iconCircle}>
                                                        <Icon name="account" size={15} style={styles.icon} />
                                                    </View>

                                                    <View>
                                                        <View>
                                                            <Text style={styles.label}>Account Number</Text>
                                                            <Text style={{ ...styles.value, marginTop: 5, fontSize: 11 }}>{item.account_no}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View>
                                                    <View style={{ display: 'flex', flexDirection: 'row' }}>
                                                        <View style={styles.iconCircle}>
                                                            <Icon name="key-variant" size={15} style={styles.icon} />
                                                        </View>
                                                        <View>
                                                            <View>
                                                                <Text style={styles.label}>Virtual Number</Text>
                                                                <Text style={{ ...styles.value, marginTop: 5, fontSize: 11 }}>{item.virtual_number}</Text>
                                                            </View>

                                                        </View>
                                                    </View>
                                                </View>
                                            </View>


                                            <View style={{ ...styles.row, marginTop: 20 }}>
                                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%', paddingRight: 10 }}>
                                                    <View style={styles.iconCircle}>
                                                        <Icon name="account-outline" size={15} style={styles.icon} />
                                                    </View>
                                                    <View>
                                                        <View style={{ display: 'flex' }}>
                                                            <Text style={styles.label}>Borrower Name</Text>
                                                            <Text style={{ ...styles.value, marginTop: 5, flexWrap: 'wrap' }}>{item.customer_name} </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View>
                                                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                                                        <View style={styles.iconCircle}>
                                                            <Icon name="handshake" size={15} style={styles.icon} />
                                                        </View>
                                                        <View>
                                                            <View>
                                                                <Text style={styles.label}>Trust</Text>
                                                                <Text style={{ ...styles.value, marginTop: 5 }}>{item.trust}</Text>
                                                            </View>

                                                        </View>
                                                    </View>
                                                </View>
                                            </View>

                                            <View style={{ ...styles.row, marginTop: 20 }}>
                                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%' }}>
                                                    <View style={styles.iconCircle}>
                                                        <Icon name="bank" size={15} style={styles.icon} />
                                                    </View>
                                                    <View>


                                                        <View style={{ display: 'flex' }}>
                                                            <Text style={styles.label}>Bank Name</Text>
                                                            <View style={{ maxWidth: '97%' }}>
                                                                <Text style={{ ...styles.value, marginTop: 5, fontSize: 11, flexWrap: 'wrap' }}>{item.bank_name}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View>
                                                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                                                        <View style={styles.iconCircle}>
                                                            <Icon name="calendar" size={15} style={styles.icon} />
                                                        </View>
                                                        <View>
                                                            <View>
                                                                <Text style={styles.label}>Allocation Date</Text>
                                                                <Text style={{ ...styles.value, marginTop: 5 }}>{commonfun.formatDate(item.allocation_date)}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>

                                        </Card.Content>
                                    </TouchableOpacity>

                                </Card>
                            </View>
                        )
                    }}
                />
            </View>
            {/* {
                openInfocard && <View><CardInfo navigation={navigation} info={{ ...currentItem, openInfocard }} togleinfoCard={togleinfoCard} /></View>
            } */}
            {
                openInfocard && <View><AccountDeatilsPopup navigation={navigation} borrowerData={{ ...currentItem, openInfocard }}   visible={openInfocard} onClose={onClose}/></View>
            }
            {(loader) && <Loader />}

           
            {/* <View
                style={[   styles.filterPanel,
                    {
                        transform: [{ translateX: filterPosition }],
                    }
                ]}
            >

               
                <FilterPanel togglePanel={toggleFilterPanel} applyFilters={applyFilters} filterflag={isfiltersetval}/>
             

                
            </View> */}

            
           
           
        </View>
    )
}

export default SecureData


export const styles = StyleSheet.create({
    skeleton: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    container: {
        // padding: 10,
        height: '100%',
        // backgroundColor: "#03002f",
        backgroundColor: COLORS.bg,
        marginBottom: 20,
    },
    maincard: {
        margin: 10,
        borderRadius: 8,
        elevation: 3,
        // backgroundColor: '#F2F2F2',
        padding: 8,
    },
    cardcontent: {
        flexDirection: "row",
        padding: 1,
        // justifyContent:"space-between"
    },
    keycontent: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        // padding:3
    },
    cardheader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 3
    },
    menubutton: {
        marginTop: -5
    },
    valuecontent: {
        flex: 2,
        fontSize: 15,
        marginLeft: 15,
        // padding:3
    },
    menucontent: {
        position: 'absolute',
        top: 20,
        right: 0,
        zIndex: 100,
        // marginTop: 40, 
        // zIndex: 1, 
    },
    filters: {
        // flex:1,
        // flexDirection:'row'
        padding: 10,
        position: 'relative'
    },
    serachbar: {
        borderRadius: 13,
        margin: 5,
        backgroundColor: COLORS.white,
        color:COLORS.primary
    },
    card: {
        margin: 10,
        borderRadius: 8,
        elevation: 3,
        // backgroundColor: '#F2F2F2',
        backgroundColor: COLORS.white,
        padding: 15,
    },
    title: {
        fontSize: 18,
        color: COLORS.white,
        marginBottom: 10,
        // borderBottomColor: COLORS.lightGrey
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    iconCircle: {
        // backgroundColor: '#895FA5', // Define this color in your constants
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        padding: 7,
        marginRight: 10,
        height: 30,
        width: 30,
        alignItems: 'center',
        
    },
    icon: {
        color: COLORS.white,
    },
    label: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: 'bold',
        flex: 1,
    },
    value: {
        fontSize: 10,
        color: COLORS.primary,
    },

    // dropdeown

    dropdown: {
        position: 'absolute',
        top: 70, // Adjust based on your layout
        left: 10,
        right: 10,
        backgroundColor: '#fff',
        color:'black',
        borderRadius: 5,
        elevation: 3,
        zIndex: 1000,
    },
    dropdownItem: {
        padding: 10,
        paddingLeft: 20,
        paddingRight: 20,
        width: '100%',
        // color:'black'
    },
    dropdownText: {
        fontSize: 16,
        // color:'red'
    },


    // 

     
      filterButton: {
        marginLeft: 10,
        padding: 10,
        borderRadius: 20,
        // backgroundColor: '#e0e0e0', // Light background for the button
        justifyContent: 'center',
        alignItems: 'center',
        // elevation: 2, // Add shadow for a raised effect
      },
      modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay
      },
      modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000', // Add shadow for a 3D effect
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      },
      input: {
        height: 45,
        // borderColor: '#ccc',
        // borderWidth: 1,
        // borderRadius: 10,
        marginBottom: 15,
        // paddingHorizontal: 10,
        backgroundColor: '#f9f9f9',
      },
      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
      },
      filterPanel: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: Dimensions.get('window').width * 0.8,
        backgroundColor: 'white',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },

})