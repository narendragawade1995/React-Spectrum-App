
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';


import Home from '../Components/HomeScreen';
import Notification from '../Components/NotificationsScreen';
import { StyleSheet } from 'react-native';
import AppStackNav from './AppStackNav';
import CustomNavigator from './CustomNavigator';
import LoginForm from '../Components/LoginScreen';
import { COLORS } from '../theme/theme'
import CustomsideBar from './CustomsideBar';
const Drawer = createDrawerNavigator()
const Drawerlist = () => {
    const screens = [
        { name: 'Home', component: Home },
        { name: 'Notification', component: Notification },
        // Add more screens as needed
    ];

    return (

        /**
         * merge drawer and stack navigator
         */
        <Drawer.Navigator
        // drawerContent={props=><CustomNavigator {...props}/>}
        drawerContent={props=>  <CustomsideBar  {...props} />}
        screenOptions={styles.headeroptions}>
            <Drawer.Screen name='HomeDrawer' component={AppStackNav} options={{ gestureEnabled: false }} />
            {/* <Drawer.Screen name='Login' component={LoginForm} options={{ gestureEnabled: false ,headerShown:false}} /> */}
        </Drawer.Navigator>

        /**
         * only drawer navigation
         */

        // <Drawer.Navigator initialRouteName="Home" screenOptions={styles.headeroptions}>
        //     {
        //         screens.map((itm)=>(
        //             <Drawer.Screen name={itm.name}  component={itm.component} />

        //         ))
        //     }
        // </Drawer.Navigator>

    )
}

const styles = StyleSheet.create({
    headeroptions: {
        headerShown: false,
        statusBarColor: COLORS.primary,
        headerStyle: {
            backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff'
    }
})
export default Drawerlist