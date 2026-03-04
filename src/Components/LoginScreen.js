import React, { useState, useEffect, useCallback } from 'react';
import {
  Linking, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity,
  View, ScrollView, StatusBar, Animated, Image, Dimensions
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { resetState, setUser } from '../Redux/Slicer/UserSlice';
import Api from '../Utilities/apiService';
import { checkDeviceSecurity } from '../Utilities/securityCheck';
import { scheduleTracking } from '../Utilities/trackingScheduler';
import CryptoJS from 'crypto-js';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS } from '../theme/theme';
import Loader from './Loader';
import { navigationref, cusnavigate } from './NavRef';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// ─── Edelweiss Logo ──────────────────────────────────────────────────────────
// Logo PNG placed at: assets/images/edelweiss_logo.png
// (Copy your uploaded PNG there — the logo is white on black, so we invert
//  it to show white on the blue header background using a tintColor overlay)

const EdelweissLogo = () => (
  <View style={{ alignItems: 'center', marginBottom: 14 , position:'relative'}}> 
  <Image
    source={require('../assets/images/edelweiss_logo.png')}
    style={styles.logoImage}
    resizeMode="contain"
  />
            <View style={styles.dividerLine} />

  </View>
);

export default function LoginForm() {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [showLoader, setLoader] = useState(false);
  const [isSecured, setIsSecured] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

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
      if (userDetails && userDetails.token) {
        setIsLoggedIn(true);
        dispatch(setUser(userDetails));
        navigateToHome();
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  }, [dispatch]);

  const navigateToHome = useCallback(() => {
    if (navigationref.isReady()) {
      cusnavigate('Home');
      
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      cusnavigate('Home', []);
    }
  }, [isLoggedIn, navigation]);

  useFocusEffect(useCallback(() => {
    checkLoginStatus();
  }, [checkLoginStatus]));

  useEffect(() => {
    checkLoginStatus();
    const linkSubscription = Linking.addListener('url', handleUrl);
    return () => linkSubscription.remove();
  }, [checkLoginStatus]);

  const encryptCredentials = (text) => {
    const _key = CryptoJS.enc.Utf8.parse("E1D2E3L4");
    const _iv = CryptoJS.enc.Utf8.parse("S1E2C3U4");
    const encrypted = CryptoJS.AES.encrypt(text, _key, {
      keySize: 16, iv: _iv,
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  };

  const decryptUsingAES256 = (encrypted) => {
    const _key = CryptoJS.enc.Utf8.parse("E1D2E3L4");
    const _iv = CryptoJS.enc.Utf8.parse("S1E2C3U4");
    return CryptoJS.AES.decrypt(encrypted, _key, {
      keySize: 16, iv: _iv,
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
  };

  const init = async () => {
    const security = await checkDeviceSecurity();
    if (!security.safe) {
      Alert.alert("Security Alert", security.reason);
      return;
    }
    scheduleTracking();
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
      if (!apres.ok) {
        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'HomeDrawer', state: { routes: [{ name: 'Login' }] } }]
        }));
      }
      response = await apres.json();
      let userrsp = JSON.parse(decryptUsingAES256(response.ResponseMessage));
      dispatch(setUser(userrsp));
      setLoader(false);
      if (response && response.ResponseMessage) {
        navigation.navigate('Home');
      }
    } catch (error) {
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
      if (!apres.ok) {
        navigation.dispatch(CommonActions.reset({
          index: 0,
          routes: [{ name: 'HomeDrawer', state: { routes: [{ name: 'Login' }] } }]
        }));
      }
      let response = await apres.json();
      let userrsp = JSON.parse(decryptUsingAES256(response.ResponseMessage));
      dispatch(setUser(userrsp));
      if (response && response.ResponseMessage) {
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'Invalid Username and Password');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid Username and Password');
    } finally {
      setLoader(false);
    }
  };

  return (
    <SafeAreaView style={styles.maincontainer}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
            <EdelweissLogo />
            <Text style={styles.welcomeText}>WELCOME BACK</Text>
            <Text style={styles.welcomeSubText}>Please sign in to continue</Text>
          </Animated.View>
        </View>

        {/* ── FORM CARD ── */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Azure Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionLabel}>FOR EMPLOYEE</Text>
            <View style={styles.sectionLine} />
          </View>

          <TouchableOpacity style={styles.azureButton} onPress={AzurehandleLogin} activeOpacity={0.85}>
            <View style={styles.azureIconBox}>
              <Icon name="microsoft" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.azureButtonText}>SIGN IN WITH AZURE AD</Text>
          </TouchableOpacity>

          {/* Credentials Section */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionLabel}>FOR OTHERS</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.inputGroup}>
            <Controller
              control={control}
              rules={{ required: 'Username is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    left={<TextInput.Icon icon="account-outline" color={errors.username ? '#EF4444' : COLORS.primary} />}
                    style={[styles.input, errors.username && styles.inputError]}
                    placeholder="USERNAME"
                    placeholderTextColor="#9CA3AF"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCorrect={false}
                    autoCapitalize="none"
                    activeOutlineColor={COLORS.primary}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    mode="flat"
                  />
                </View>
              )}
              name="username"
            />
            {errors.username && (
              <View style={styles.errorRow}>
                <Icon name="alert-circle-outline" size={13} color="#EF4444" />
                <Text style={styles.error}>{errors.username.message}</Text>
              </View>
            )}

            <Controller
              control={control}
              rules={{ required: 'Password is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    left={<TextInput.Icon icon="lock-outline" color={errors.password ? '#EF4444' : COLORS.primary} />}
                    right={
                      <TextInput.Icon
                        color={COLORS.primary}
                        onPress={() => setIsSecured(!isSecured)}
                        icon={isSecured ? 'eye-outline' : 'eye-off-outline'}
                      />
                    }
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="PASSWORD"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={isSecured}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCorrect={false}
                    autoCapitalize="none"
                    activeOutlineColor={COLORS.primary}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    mode="flat"
                  />
                </View>
              )}
              name="password"
            />
            {errors.password && (
              <View style={styles.errorRow}>
                <Icon name="alert-circle-outline" size={13} color="#EF4444" />
                <Text style={styles.error}>{errors.password.message}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleSubmit(onSubmit)} activeOpacity={0.88}>
            <Text style={styles.loginButtonText}>LOGIN</Text>
            <Icon name="arrow-right" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          
        </Animated.View>

      </ScrollView>
      {showLoader && <Loader />}
    </SafeAreaView>
  );
}

const PRIMARY = '#1E3A8A'; // deep navy blue — override if COLORS.primary differs
const ACCENT = '#2563EB';

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // ── HEADER ──────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 64,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  decorCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: -30,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
  },

  // ── LOGO IMAGE ──────────────────────────────────────────
  logoImage: {
    width: 250,
    height: 130,
    // Logo is white-on-black PNG; tintColor makes it pure white on blue header
    tintColor: '#FFFFFF',
    overflow:'hidden'
  },

  dividerLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    marginBottom: 14,
    position:'absolute',
    bottom: 10,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 3,
    marginBottom: 4,
  },
  welcomeSubText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.3,
  },

  // ── CARD ────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -32,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 32,
    paddingBottom: 40,
  },

  // ── SECTION HEADERS ─────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#94A3B8',
    letterSpacing: 1.8,
  },

  // ── AZURE BUTTON ────────────────────────────────────────
  azureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  azureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  azureButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.primary,
    letterSpacing: 0.8,
    flex: 1,
    textAlign: 'center',
  },

  // ── INPUTS ──────────────────────────────────────────────
  inputGroup: {
    gap: 12,
    marginBottom: 8,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  input: {
    height: 52,
    backgroundColor: 'transparent',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -6,
    marginLeft: 4,
  },
  error: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },

  // ── LOGIN BUTTON ─────────────────────────────────────────
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 54,
    marginTop: 20,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 2,
  },

  footerNote: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    marginTop: 20,
    letterSpacing: 0.5,
  },
});
