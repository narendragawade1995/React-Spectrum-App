import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { Drawer, Text, TouchableRipple, Switch, List, Avatar, Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from "react-redux";
import Api from "../Utilities/apiService";
import Loader from "../Components/Loader";
import { COLORS, FONTWEIGHT, SIZES } from "../theme/theme";
import { resetState } from "../Redux/Slicer/UserSlice";
import { CommonActions } from "@react-navigation/native";
const RouteList = [ 
    {
        icon: { name: 'security', class: 'materialicon' },
        label: 'Secure',
        navigateTo: 'Home',
        children: [
            { label: 'Borrower List', navigateTo: 'Home' },
            // { label: 'Disposition', navigateTo: 'accountsearch', customParam: { 'custom_redirect': 'Disposition' } },
            { label: 'Disposition History', navigateTo: 'dishistory' },
            
            // { label: 'To Do List', navigateTo: 'todolist' },
        ]
    },
    {
        icon: { name: 'account-balance', class: 'materialicon' },
        label: 'UnSecure',
        navigateTo: 'Finance',
        children: [
          { label: 'Borrower List', navigateTo: 'Unsecure' },
          // { label: 'Disposition', navigateTo: 'accountsearch', customParam: { 'custom_redirect': 'Disposition' } },
           { label: 'Disposition History', navigateTo: 'Unsecure_disposition_history' },
          // { label: 'To Do List', navigateTo: 'todolist' },
        ]
    },
    // {
    //     icon: { name: 'settings', class: 'materialicon' },
    //     label: 'Settings',
    //     navigateTo: 'Settings',
    // },
];

const CustomsideBar = ({ navigation }) => {

    const [expandedItems, setExpandedItems] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [userdetails,setuserdetails] = useState();
    const [visibleSnackbar,setVisibleSnackbar] = useState(false);

    const {userInfo:{userDetails}} = useSelector(state=>state.USER) 
    const dispatch = useDispatch()
    const avtarLabel = ()=>{
        if(userDetails[0]){
            return `${userDetails[0].FIRST_NAME.charAt(0)}${userDetails[0].LAST_NAME.charAt(0)}`
        }
        else{
            return ''
        }
    };

    const toggleExpanded = (label) => {
      if(expandedItems === label){
        setExpandedItems(null);
        return;
      }
        setExpandedItems(label);
    };
    const toggleOnlineStatus = () => {
      setIsOnline(!isOnline);
      // Here you can add logic to handle online/offline status change
      // Api.setMode(!isOnline ? 'online' : 'offline')
      // console.log(`App is now ${!isOnline ? 'online' : 'offline'}`);
  };
    const renderMenuItem = (item) => {

        if (item.children) {
            return (
                <List.Accordion
                    key={item.label}
                    title={item.label}
                    style={styles.accordian}
                    left={props => <Icon {...props} name={item.icon.name} size={24} color={expandedItems ===item.label ? COLORS.bg:COLORS.primary} style={expandedItems ===item.label ? styles.listAccordionIconActive:styles.listAccordionIcon} />}
                    expanded={expandedItems ===item.label}
                    onPress={() => toggleExpanded(item.label)}
                >
                    {item.children.map(child => (
                        <List.Item
                            key={child.label}
                            title={child.label}
                            onPress={() => navigation.navigate(child.navigateTo, child.customParam)}
                            style={styles.subItem}
                        />
                    ))}
                </List.Accordion>
            );
        } else {
            return (
                <List.Item
                    key={item.label}
                    title={item.label}
                    left={props => <Icon {...props} name={item.icon.name} size={24} />}
                    onPress={() => navigation.navigate(item.navigateTo)}
                />
            );
        }
    };

    const handleLogout = () => {
        Alert.alert(
          'Confirm Logout',
          'Are you sure you want to logout?',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Logout cancelled'),
              style: 'cancel',
            },
            {
              text: 'OK',
              onPress: () => {
                signout();
              },
            },
          ],
          { cancelable: false }
        );

        
      };
    
      const signout = async()=>{
        try{
          setVisibleSnackbar(true);
            Api.send({},'logout').then(
              res=>{
                navigateToLogin(); 
              },
              err=> {
                navigateToLogin();  
              }
            )
            
        }catch(err){
           console.log(err);
           navigateToLogin();
        }
     } 
     
     const navigateToLogin = async () => {
      await Api.clearStorage('userdetail');
      await Api.clearStorage('authtoken');
      setVisibleSnackbar(false);
      dispatch(resetState())      
      navigation.dispatch(CommonActions.reset({
        index:0,
        routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
      }))
      // navigation.navigate('Login');
  }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.userInfoSection}>
                <Avatar.Text
                    label={avtarLabel()}
                    labelStyle={{ color:COLORS.primary }}        
                    size={80}
                    style={{backgroundColor:COLORS.bg}}
                />
                {/* <Avatar.Text size={50} marginTop={5} label={avtarLabel()} style={{backgroundColor:COLORS.card}}/> */}
                <Text style={styles.userName}>{`${userDetails[0]?.FIRST_NAME} ${userDetails[0]?.LAST_NAME}`}</Text>
                <Text style={styles.userEmail}>{userDetails[0]?.EMAIL}</Text>
            </View>

            <ScrollView style={styles.menuSection}>
                {RouteList.map(renderMenuItem)}
            </ScrollView>

            <View style={styles.bottomSection}>
                {/* <List.Accordion
                    title="Settings"
                    left={props => <Icon {...props} name="settings" size={24} color={COLORS.primary} style={styles.listAccordionIcon} />}
                    expanded={expandedItems === 'Settings'}
                    onPress={() => toggleExpanded('Settings')}
                >
                    <View style={styles.settingsItem}>
                        <Text>Offline Mode</Text>
                        <Switch
                            value={!isOnline}
                            onValueChange={toggleOnlineStatus}
                            color={COLORS.primary}
                        />
                    </View>
                    
                </List.Accordion> */}

                <TouchableRipple onPress={() => { handleLogout() }}>
                    <View style={styles.bottomItem}>
                        <Icon name="exit-to-app" size={24} color={COLORS.primary} style={styles.listAccordionIcon} />
                        <Text style={styles.bottomItemText}>Logout</Text>
                    </View>
                </TouchableRipple>
                <Text style={styles.versionInfo}>Spectrum 1.0.0</Text>
                <Snackbar
                    visible={visibleSnackbar}
                    onDismiss={() => setVisibleSnackbar(false)}
                    duration={Snackbar.DURATION_SHORT}
                >
                    Signed out successfully!
                </Snackbar>
                {visibleSnackbar && <Loader />}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:  COLORS.white
    },
    userInfoSection: {
      padding: 20,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
      marginTop: 10,
    },
    userEmail: {
      fontSize: 14,
      color: '#e6e6e6',
    },
    userRole: {
      fontSize: 12,
      color: '#e6e6e6',
      marginTop: 5,
    },
    menuSection: {
      flex: 1,
      paddingTop:20
    },
    subItem: {
      paddingLeft: 30,
    },
    bottomSection: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    bottomItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    bottomItemText: {
      marginLeft: 10,
      fontSize: 16,
    },
    versionInfo: {
      textAlign: 'center',
      marginTop: 10,
      // color: '#888',
      color: COLORS.primary,
      fontSize: SIZES.h3,
      fontWeight: FONTWEIGHT.normal,
      letterSpacing: 1.1
    },
    listAccordionIcon: {
      marginTop: 5,
      backgroundColor:COLORS.bg,
      padding:5,
      borderRadius:10,
    
  },
  listAccordionIconActive:{
    marginTop: 5,
    backgroundColor:COLORS.primary,
    padding:5,
    borderRadius:10,
  },
  accordian:{
    paddingLeft:15
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
}
  });
export default CustomsideBar