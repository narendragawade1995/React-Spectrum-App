/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React,{useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Drawerlist from './src/Routes/DrawerCoponent';
import { NavigationContainer ,DefaultTheme} from '@react-navigation/native';
import Home from './src/Components/HomeScreen';
import Notification from './src/Components/NotificationsScreen';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppStackNav from './src/Routes/AppStackNav';
import { adaptNavigationTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import LoginForm from './src/Components/LoginScreen';
import { navigationref } from './src/Components/NavRef';








const {LightTheme } = adaptNavigationTheme({reactNavigationLight:DefaultTheme})
// const Drawer = createDrawerNavigator()
function App() {

  const {userInfo:{userDetails}} = useSelector(state=>state.USER);
       
 

  return (
 
    <NavigationContainer ref={navigationref}>
      <Drawerlist/>
     
         {/* {userDetails.length > 0 ?  <Drawerlist/> : <LoginForm/>}  */}
       
     </NavigationContainer>

  );
}

const styles = StyleSheet.create({
  container:{
    backgroundColor:'yellow'
  }
});

export default App;
