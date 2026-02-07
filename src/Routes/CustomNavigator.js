import { DrawerContentScrollView } from "@react-navigation/drawer";
import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Avatar, Divider, Text, Title, Snackbar } from "react-native-paper";
// import DrawerItems from "./DrawerItems";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import Api from "../Utilities/apiService";
import { useSelector } from "react-redux";

import DrawerItem from '../Components/drawerItem';
import { COLORS, SIZES, FONTWEIGHT } from "../theme/theme";
import Loader from "../Components/Loader";
import DrawerItems from "./DrawerItems";


const CustomNavigator = (props) => {

    const [userdetails, setuserdetails] = useState();
    const [visibleSnackbar, setVisibleSnackbar] = useState(false);

    const { userInfo: { userDetails } } = useSelector(state => state.USER)
    const avtarLabel = () => {
        if (userDetails[0]) {
            return `${userDetails[0].FIRST_NAME.charAt(0)}${userDetails[0].LAST_NAME.charAt(0)}`
        }
        else {
            return ''
        }
    };
    const signout = async () => {
        try {
            setVisibleSnackbar(true);
            await Api.send({}, 'logout');
            navigateToLogin();
        } catch (err) {
            console.log(err);
            navigateToLogin();
        }
    }

    const navigateToLogin = async () => {
        await Api.clearStorage('userdetail');
        await Api.clearStorage('authtoken');
        setVisibleSnackbar(false);
        props.navigation.navigate('Login');
    }

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
    const Routelist = [
        {
            icon: 'lock-outline', label: 'Secure', navigateTo: 'Home', Children: [
                { icon: 'home-outline', label: 'BorrowerList', navigateTo: 'Home' }
            ]
        },
        { icon: 'account', label: 'Account', navigateTo: 'Home' },
        { icon: 'chart-timeline-variant', label: 'Secure Admin', navigateTo: 'Home' },
        { icon: 'qrcode-scan', label: 'Lead Genaration', navigateTo: 'Home' },
        { icon: 'shield-link-variant', label: 'Notification', navigateTo: 'Notification' },
        { icon: 'cog', label: 'Notification', navigateTo: 'Notification' },
        { icon: 'exit-to-app', label: 'Notification', navigateTo: 'Notification' }

    ]
    return (
        <View style={styles.container}>
            {/* <ImageBackground source={require('../assets/finance.jpeg')}> */}
            <View style={styles.topContainer}>
                <View style={styles.topDetails}>
                    {/* <Image style={styles.profile} source={require('../assets/profile.jpeg')} /> */}
                    <Avatar.Text size={50} marginTop={5} label={avtarLabel()} style={{ backgroundColor: COLORS.card, color: COLORS.white }} />
                    <View>
                        <Text style={styles.name}>{`${userDetails[0]?.FIRST_NAME} ${userDetails[0]?.LAST_NAME}`}</Text>
                        <View style={styles.row}>
                            <Icon name="email" size={15} style={styles.icon} />
                            <Text style={styles.locationText}>{userDetails[0]?.EMAIL}</Text>
                        </View>
                    </View>
                </View>
            </View>
            {/* </ImageBackground> */}
            <ScrollView>
                <View style={styles.itemContainer}>
                    <DrawerItems />
                    <View style={styles.line} />
                    {/* <DrawerItem iconName="bell-ring" text="Notification" notification /> */}
                    <DrawerItem iconName="shield-link-variant" text="Privacy Policy" />
                    <DrawerItem iconName="cog" text="Settings" />
                    <TouchableOpacity onPress={() => handleLogout()}>
                        <DrawerItem iconName="exit-to-app" text="Logout" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <View style={styles.bottomContainer}>
                <Text style={styles.appName}>Spectrum </Text>
                <Text style={styles.versionText}>Version 1.0.1</Text>
            </View>
            <Snackbar
                visible={visibleSnackbar}
                onDismiss={() => setVisibleSnackbar(false)}
                duration={Snackbar.DURATION_SHORT}
            >
                Signed out successfully!
            </Snackbar>
            {visibleSnackbar && <Loader />}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,

    },
    topContainer: {
        // backgroundColor: 'rgba(99, 57, 116, 0.9)',
        backgroundColor: COLORS.primary,
        height: SIZES.height / 8,
        justifyContent: 'flex-end',
        padding: 15,
    },
    topDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    profile: {
        width: 70,
        height: 70,
        borderRadius: 50,
        marginRight: 15,
        borderColor: COLORS.white,
        borderWidth: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        color: COLORS.white,
        fontSize: SIZES.h2,
        fontWeight: FONTWEIGHT.bold,
        marginBottom: 2,
    },
    locationText: {
        color: COLORS.white,
        fontSize: SIZES.h4,
        fontWeight: FONTWEIGHT.weight500,
    },
    icon: {
        color: COLORS.white,
        marginRight: 5,
    },
    itemContainer: {
        marginTop: 10,
        backgroundColor: COLORS.white
    },

    line: {
        backgroundColor: COLORS.lightGrey,
        height: 2,
        marginHorizontal: 15,
        marginVertical: 20,
    },
    bottomContainer: {
        alignItems: 'center',
        marginBottom: 40,
        backgroundColor: COLORS.white
    },
    appName: {
        color: COLORS.grey,
        fontSize: SIZES.h3,
        fontWeight: FONTWEIGHT.bold,
        letterSpacing: 1.5
    },
    versionText: {
        color: COLORS.grey,
        fontSize: SIZES.h4,
        fontWeight: FONTWEIGHT.weight500,
    },
});


export default CustomNavigator;