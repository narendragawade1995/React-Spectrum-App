import React, { useState, useEffect, useCallback } from 'react';
import { Linking, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView, StatusBar ,Animated } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { resetState, setUser } from '../Redux/Slicer/UserSlice';
import Api from '../Utilities/apiService';
import {checkDeviceSecurity } from '../Utilities/securityCheck';
import {scheduleTracking  } from '../Utilities/trackingScheduler';


import CryptoJS from 'crypto-js';
// import AzureAuth from 'react-native-azure-auth';
import { useFocusEffect, useNavigation ,CommonActions} from '@react-navigation/native';
import { COLORS } from '../theme/theme';
import Loader from './Loader';
import {navigationref,cusnavigate} from './NavRef'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import IconManager from '../Utilities/IconManager';
export default function LoginForm() {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [showLoader, setLoader] = useState(false);
  const [isSecured, setIsSecured] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const handleUrl = (event) => {
    const { url } = event;
    const params = extractTokensFromUrl(url);
    if (params && params.token) {
      AuzureLoginPostApi(params.token);
    }
  };

  const extractTokensFromUrl = (url) => {
    const queryParams = {};
    const paramsString = url.split('?')[1];
    if (paramsString) {
      const pairs = paramsString.split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
      });
    }
    return queryParams;
  };

  const checkLoginStatus = useCallback(async () => {
    try {
      const userDetails = await Api.getItem('userdetail');
      console.log('User details:', userDetails); // Log user details for debugging
      if (userDetails && userDetails.token) {
        setIsLoggedIn(true);
        dispatch(setUser(userDetails)); // Update Redux store
        navigateToHome();
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  }, [dispatch]);


  const navigateToHome = useCallback(() => {
    if (navigationref.isReady()) {
      cusnavigate
      ('Home');
    } else {
      console.log('Navigation not ready, waiting...');
      // setTimeout(navigateToHome, 100); // Retry after 100ms
    }
  }, []);



  useEffect(() => {
    if (isLoggedIn) {
      // navigation.navigate('Home');
      
      cusnavigate('Home',[]);
    }
  }, [isLoggedIn, navigation]);

  useFocusEffect(useCallback(()=>{
    checkLoginStatus()
  },[checkLoginStatus]))
  
  useEffect(() => {
    checkLoginStatus();
    const linkSubscription = Linking.addListener('url', handleUrl);
    return () => linkSubscription.remove();
  }, [checkLoginStatus]);




  const encryptCredentials = (text) => {
    const _key = CryptoJS.enc.Utf8.parse("E1D2E3L4");
    const _iv = CryptoJS.enc.Utf8.parse("S1E2C3U4");
    const encrypted = CryptoJS.AES.encrypt(text, _key, {
      keySize: 16,
      iv: _iv,
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  };

  const decryptUsingAES256 = (encrypted) => {
    const _key = CryptoJS.enc.Utf8.parse("E1D2E3L4");
    const _iv = CryptoJS.enc.Utf8.parse("S1E2C3U4");
    const decrypted = CryptoJS.AES.decrypt(encrypted, _key, {
      keySize: 16,
      iv: _iv,
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
    return decrypted;
  };

  const init = async () => {
      const security = await checkDeviceSecurity();

      if (!security.safe) {
        Alert.alert("Security Alert", security.reason);
        return;
      }

      scheduleTracking();

      // check every 15 minutes
      setInterval(scheduleTracking, 900000);
    };

  const onSubmit = async (data) => {
    try {
      const encryptedUsername = encryptCredentials(data.username);
      const encryptedPassword = encryptCredentials(data.password);
      setLoader(true);
      await Api.clearStorage();
      const apres = await Api.sendRequest({
        username: encryptedUsername,
        password: encryptedPassword,
      }, 'login');
    console.log(apres) 
      if(!apres.ok){
        navigation.dispatch(CommonActions.reset({
          index:0,
          routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
        }))
      }

       response = await apres.json();
      
      let userrsp = JSON.parse(decryptUsingAES256(response.ResponseMessage));
      dispatch(setUser(userrsp));
      setLoader(false);

      if (response && response.ResponseMessage) {
        console.log("home navigation")
        navigation.navigate('Home');
      }
    } catch (error) {
      console.log(error)
      setLoader(false);
      Alert.alert('Error', 'Invalid Username and Password');
    }
  };


  const AzurehandleLogin = () => {
    Linking.openURL('https://testapp.edelweissarc.in?from=mobile');
  };

  const AuzureLoginPostApi = async (token) => {
    try {
      setLoader(true);
      const apres = await Api.sendRequest({ code: token }, '/Azurelogin');
      if(!apres.ok){
        navigation.dispatch(CommonActions.reset({
          index:0,
          routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
        }))
      }
      let response = await apres.json();
      
      let userrsp = JSON.parse(decryptUsingAES256(response.ResponseMessage));
      dispatch(setUser(userrsp));
      if (response && response.ResponseMessage) {
        navigation.navigate('Home');
      } else {
        setError('Invalid Username and Password');
      }
    } catch (error) {
      setError('Invalid Username and Password');
    } finally {
      setLoader(false);
    }
  };

  return (
    <SafeAreaView style={styles.maincontainer}>
      <StatusBar backgroundColor={COLORS.primary}/>
      <ScrollView showsVerticalScrollIndicator={false}>
       <Animated.View style={{ paddingHorizontal: 120, paddingTop:200, paddingBottom:40,backgroundColor:COLORS.primary, display:'flex', justifyContent:'center',alignItems:"center",

        borderBottomRightRadius:100,borderBottomLeftRadius:100

       }}>
      
                    <Text style={{color:COLORS.white, fontSize:20,letterSpacing:1.2,fontFamily:'Poppins-Regular'}}>WELCOME</Text>
          </Animated.View>
        <Animated.View style={styles.container}>
         
          <View style={{ marginBottom: 75 }}></View>
          {/* <View style={{ marginBottom: 40 }}>
            <View style={{ borderBottomColor: COLORS.primary, borderBottomWidth: 2 }}>
              <Text style={styles.title}>Sign In</Text>
            </View>
          </View> */}
          <View style={styles.loginOption}>
            <View style={styles.Optionbar}>
            
            </View>
              <Text style={styles.optionsText,[{paddingRight:5,paddingLeft:5, fontWeight:'700', fontSize:14,color:COLORS.black, fontFamily:'Poppins'}]}>For Employee</Text>
               <View style={styles.Optionbar}>
            </View>
          </View>
            <View style={styles.buttonView2}>
            <TouchableOpacity style={[styles.button,styles.azureButton]} onPress={AzurehandleLogin}>
                  <Icon name="microsoft"   color= {COLORS.white} style={styles.icon} /> 
              <Text style={styles.azureButtonText}>SIGN IN WITH AZURE AD</Text>
            </TouchableOpacity>
            
          </View>
           <View style={styles.loginOption}>
            <View style={styles.Optionbar}>
            
            </View>
              <Text style={styles.optionsText,[{paddingRight:5,paddingLeft:5, fontWeight:'700', fontSize:14,color:COLORS.black, fontFamily:'Poppins'}]}>
                For Others</Text>
               <View style={styles.Optionbar}>
            </View>
          </View>
          <View style={styles.inputView}>
            <Controller
              control={control}
              rules={{ required: 'Username is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  left={<TextInput.Icon icon="account" color={COLORS.primary} />}
                  style={[styles.input, errors.username && styles.inputError]}
                  placeholder='USERNAME'
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCorrect={false}
                  autoCapitalize='none'
                  activeOutlineColor={COLORS.primary}
                  underlineColor="transparent"
                />
              )}
              name="username"
            />
            {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}

            <Controller
              control={control}
              rules={{ required: 'Password is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  left={<TextInput.Icon icon="lock" color={COLORS.primary} />}
                  right={<TextInput.Icon color={COLORS.primary} onPress={() => setIsSecured(!isSecured)} icon={isSecured ? 'eye' : 'eye-off'} />}
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder='PASSWORD'
                  secureTextEntry={isSecured}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCorrect={false}
                  autoCapitalize='none'
                  activeOutlineColor='transparent'
                  underlineColor="transparent"
                />
              )}
              name="password"
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </View>

          <View style={styles.buttonView}>
            <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
              <Text style={styles.buttonText}>LOGIN</Text>
            </TouchableOpacity>
           
          </View>

        
          {showLoader && <Loader />}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  maincontainer: {
    backgroundColor: COLORS.white,
    flex: 1,
    
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 30,
    paddingBottom: 5
  },
  inputView: {
    gap: 15,
    width: "100%",
    paddingHorizontal: 40,
    marginBottom: 5
  },
  input: {
    height: 50,
    paddingHorizontal: 20,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 7,
    backgroundColor: COLORS.white,
    color: COLORS.primary
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 2,
  },
  button: {
    height: 55,
    backgroundColor: COLORS.primary,
    borderColor: "#CED4DA",
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection:'row',
    gap:10
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    // fontWeight: "bold",
  },
  buttonView: {
    marginTop: 20,
    width: "100%",
    paddingHorizontal: 40
  },
  buttonView2: {
    width: "100%",
    paddingHorizontal: 40,
    marginBottom: 40
  },
  optionsText: {
    textAlign: "center",
    
    color: COLORS.primary,
    fontSize: 13,
    marginBottom: 6
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  loginOption:{
    flexDirection:'row', 
    marginBottom:20, 
    alignItems:'center',
    paddingHorizontal:40
  },
  Optionbar:{borderColor:COLORS.primary, flex:1, borderWidth:1},
  icon:{
    fontSize:20,
    color:COLORS.primary
  },
    azureButton: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor:COLORS.white
  }, 
  azureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color:COLORS.primary
  },
});



