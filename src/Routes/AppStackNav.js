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
import CustomerList from '../Components/CustomerList';
import Resolution from '../Components/Resolution';
import DispositionNew from '../Components/DispositionNew';
import AccountSearch from '../Components/AccountSearch';
import ResponseForm from '../Components/AddContact';
import AuthComponent from '../Components/AuthComponent';
import Api from '../Utilities/apiService';
import Todolist from '../Components/ToDolist';
import AddressForm from '../Components/Addaddress';
import Liveliness from '../Components/Liveliness';
import ContactDetails from '../Components/Contact';
import Borrowerdetails from '../Components/unsecure/borrowerdetails';
import DispositionHistory from '../Components/DispositionHistory';
import SyncIcon from '../Components/SyncIcon ';
import Usecuredisposition from '../Components/unsecure/disposition';

const AppStackNav = ()=>{
    const Stack =  createNativeStackNavigator();
    const navigation = useNavigation()
    headerLeft = ()=>{
        return (
            <Icon name="menu" onPress={()=>navigation.dispatch(DrawerActions.openDrawer())} style={{marginRight:10}} size={30} color={COLORS.white} />
        );
    }
    const screens = [
        { name: 'Login', label:'Login',component: LoginForm },
        // { name: 'Home', label:'Secure',component: Home },
        { name: 'Home', label:'Secure',component:SecureData },
        // { name: 'Disposition', label:'Disposition',component: Disposition },
        { name: 'AddAddress', label:'Add Address',component: AddressForm },
        { name: 'AddContact', label:'Add Contact',component: ResponseForm },
        { name: 'Contacts', label:'Contacts',component: ContactDetails },
        { name: 'AccDetails', label:'Account Details',component: AccountDetails },
        { name: 'Account360', label:'360 View',component: Account360 },
        { name: 'FutuCom', label:' ',component: FutureComp },
        { name: 'Address', label:'Address',component: Address },
        { name: 'Contact', label:'Contact',component: ContactDetails },
        { name: 'Liveliness', label:'Liveliness',component: Liveliness },
        { name: 'CustomerList', label:'Customer List',component: CustomerList },
        { name: 'Resolution', label:'Resolution Recommendation',component: Resolution },
        { name: 'todolist', label:'To-Do List',component: Todolist },
        { name: 'DispositionNew', label:'Disposition',component:  DispositionNew },
        { name: 'accountsearch', label:'Account Search',component: AccountSearch },
        { name: 'Auth', label:'Account Search',component: AuthComponent },
        { name: 'Unsecure', label:'Unsecure',component: Borrowerdetails },
        { name: 'Disposirion', label:'UnsecureDisposition',component: Usecuredisposition },

        { name: 'dishistory', label:'Disposition History',component: DispositionHistory }

        // { name: 'Notification', label:'',component: Notification },
        // Add more screens as needed
      ];
    return (
        <Stack.Navigator initialRouteName='Auth'  screenOptions={styles.headeroptions}>
                 {
                    screens.map((itm,index)=>(
                        <Stack.Screen key={index + itm} name={itm.name}  component={itm.component} options={{headerLeft:()=>{
                            return (itm.name == 'Home' || itm.name == 'Unsecure') ? headerLeft():null
                        },headerShown: (itm.name == 'Login' || itm.name == 'Auth' || itm.name == 'Account360'  )? false:true ,headerTitle:itm.label,headerRight:()=>{
                            return itm.name == 'Home' ?  <SyncIcon itemsToSync={10}  />: ''
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