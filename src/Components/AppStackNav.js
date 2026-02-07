import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../Components/HomeScreen';
import Notification from '../Components/NotificationsScreen';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import LoginForm from '../Components/LoginScreen';
import Disposition from '../Components/Disposition';
import SecureData from '../Components/SecureData';
import { COLORS } from '../theme/theme';
import AccountDetails from '../Components/AccountDetails';
import Account360 from '../Components/Account360';
import FutureComp from '../Components/FutureComp';
import Address from '../Components/Address';
import Liveliness from '../Components/Liveliness';
import CustomerList from '../Components/CustomerList';
import Resolution from '../Components/Resolution';

const AppStackNav = ()=>{
    const Stack =  createNativeStackNavigator();
    const navigation = useNavigation()
    headerLeft = ()=>{
        return (
            <Icon name="menu" onPress={()=>navigation.dispatch(DrawerActions.openDrawer())} style={{marginRight:10}} size={30} color={COLORS.primary} />
        );
    }
    const screens = [
        { name: 'Login', label:'Login',component: LoginForm },
        // { name: 'Home', label:'Secure',component: Home },
        { name: 'Home', label:'Secure',component:SecureData },
        { name: 'Disposition', label:'Disposition',component: Disposition },
        { name: 'AccDetails', label:'Account Details',component: AccountDetails },
        { name: 'Account360', label:'360 View',component: Account360 },
        { name: 'FutuCom', label:' ',component: FutureComp },
        { name: 'Address', label:' ',component: Address },
        { name: 'Liveliness', label:'Liveliness',component: Liveliness },
        { name: 'CustomerList', label:'Customer List',component: CustomerList },
        { name: 'Resolution', label:'Resolution Recommendation',component: Resolution },



        // { name: 'Notification', label:'',component: Notification },
        // Add more screens as needed
      ];
    return (
        <Stack.Navigator initialRouteName='Login'  screenOptions={styles.headeroptions}>
                 {
                    screens.map((itm,index)=>(
                        <Stack.Screen key={index} name={itm.name}  component={itm.component} options={{headerLeft:()=>{
                            return itm.name == 'Home' ? headerLeft():null
                        },headerShown: itm.name == 'Login' ? false:true ,headerTitle:itm.label,headerRight:()=>{
                            return itm.name == 'Home' ?  <Ionicon name="sync" size={20} color={COLORS.primary} />: ''
                        }}} />
             
                    ))
                }
        </Stack.Navigator>
    )
}

const styles = StyleSheet.create({
    headeroptions :{
        statusBarColor:COLORS.primary,
        headerStyle:{
            backgroundColor: COLORS.white
        },
        headerTintColor: COLORS.primary
       
      }
})

export default AppStackNav;