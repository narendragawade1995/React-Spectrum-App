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
import AccountDetailsScreen from '../Components/AccountDetailsScreen';
import Account360New from '../Components/Account360New';
import CustomerListScreen from '../Components/CustomerListScreen';
import AddressDetails from '../Components/CustomerAddress';
import CustomerContactDetails from '../Components/CustomerContact';
import CustomerAddContact from '../Components/CustomerAddContact';
import CustomerAddressForm from '../Components/CustomerAddaddress';
import ResolutionNew from '../Components/ResolutionNew';
import LivelinessNew from '../Components/LivelinessNew';
import AllocatedAccountsScreen from '../Components/AllocatedAccountsScreen';
import AllocatedAccountsScreenfinal from '../Components/AllocatedAccountsScreen_final';
import AllocatedAccountsScreenWithTracking from '../Components/AllocatedAccountsScreen_withTracking';
import CustomerAddressDetails from '../Components/AddressNew';
import DispositionHistoryScreen from '../Components/DispositionHistoryScreen';
import SplashScreen from '../Components/SplashScreen';
import PaymentReceiptScreen from '../Components/Payment Receipt/PaymentReceiptScreen';
import InitiateValuationScreen from '../Components/InitiateValuationScreen';
import InitiateValuationFinalScreen from '../Components/InitiateValuationScreenFinal';
import DispositionNewPreview from '../Components/Secure/DispositionNew';
import UnsecuredDispositionNew from '../Components/unsecure/UnsecuredDisposition';
import DispositionHistoryScreenNew from '../Components/DispositionHistoryScreenNew';
import AllocatedAccountsScreenWithTracking_New from '../Components/unsecure/BorrowerdeatilsNew';
import DispositionHistoryScreenUnsecured from '../Components/unsecure/DispositionHistoryScreen';
import DispositionDetailScreen from '../Components/unsecure/DispositionDetailScreen';
import Account360NewPreview from '../Components/Account360NewPreview';
import Account360NewPreviewNew from '../Components/Account360NewPreviewNew';
import CustomerListScreenNew from '../Components/CustomerListScreenNew';
import Account360PreviewNew from '../Components/Account360PreviewNew';
import AccountDetailsScreenNew from '../Components/AccountDetailsScreenNew';


const AppStackNav = ()=>{
    const Stack =  createNativeStackNavigator();
    const navigation = useNavigation()
    headerLeft = ()=>{
        return (
            <Icon name="menu" onPress={()=>navigation.dispatch(DrawerActions.openDrawer())} style={{marginRight:10}} size={30} color={COLORS.white} />
        );
    }
    const screens = [
        { name: 'splash', label:'splash',component: SplashScreen },

        { name: 'Login', label:'Login',component: LoginForm },
        // { name: 'Home', label:'Secure',component: Home },
        { name: 'Home', label:'Secure',component:AllocatedAccountsScreenWithTracking },
        // { name: 'Disposition', label:'Disposition',component: Disposition },

        { name: 'AddAddress', label:'Add Address',component: CustomerAddressForm },
        { name: 'AddContact', label:'Add Contact',component: CustomerAddContact },
        { name: 'Contacts', label:'Contacts',component: CustomerContactDetails },
        { name: 'AccDetails', label:'Account Details',component: AccountDetailsScreenNew },
        { name: 'Account360', label:'360 View',component: Account360NewPreviewNew },
        { name: 'FutuCom', label:' ',component: FutureComp },
        { name: 'Address', label:'Customer Address',component: CustomerAddressDetails },
        { name: 'Contact', label:'Contact',component: CustomerContactDetails },
        { name: 'Liveliness', label:'Liveliness',component: LivelinessNew },
        { name: 'CustomerList', label:'Customer List',component: CustomerListScreenNew },
        { name: 'Resolution', label:'Resolution Recommendation',component: ResolutionNew },
        { name: 'todolist', label:'To-Do List',component: Todolist },
        { name: 'DispositionNew', label:'Disposition',component:  DispositionNewPreview },
        { name: 'accountsearch', label:'Account Search',component: AccountSearch },
        { name: 'Auth', label:'Account Search',component: AuthComponent },
        { name: 'Unsecure', label:'Unsecure',component: AllocatedAccountsScreenWithTracking_New },
        { name: 'Disposirion', label:'UnsecureDisposition',component: UnsecuredDispositionNew },
        { name: 'dishistory', label:'Disposition History',component: DispositionHistoryScreenNew },
        { name: 'PaymentReceipt', label:'Payment Receipt',component: PaymentReceiptScreen },
        { name: 'Valuation', label:'Valuation',component: InitiateValuationFinalScreen },
        { name :'Unsecure_disposition_history', label:"Disposition History", component: DispositionHistoryScreenUnsecured },
        { name : "DispositionDetail", label:"DispositionDetail", component:DispositionDetailScreen}
        // { name: 'Notification', label:'',component: Notification },
        // Add more screens as needed
      ];
    return (
        <Stack.Navigator initialRouteName='splash'  screenOptions={styles.headeroptions}>
                 {
                    screens.map((itm,index)=>(
                        <Stack.Screen key={index + itm} name={itm.name}  component={itm.component} options={{headerLeft:()=>{
                            return (itm.name == 'Home1' || itm.name == 'Unsecure') ? headerLeft():null
                        },headerShown: (itm.name == 'splash' || itm.name == 'Home' || itm.name == 'CustomerList' ||itm.name == 'Login' || itm.name == 'Auth' || itm.name == 'Account360' ||  itm.name == 'AccDetails'  )? false:true ,headerTitle:itm.label,headerRight:()=>{
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