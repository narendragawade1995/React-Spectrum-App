import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { COLORS } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ─── Pulse Rings ───────────────────────────────────────────────────────────
// FIX: Both refs declared individually (not in .map), container has explicit size
const PulseRings = () => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const a1 = animate(ring1, 0);
    const a2 = animate(ring2, 900);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, []);

  const ringStyle = (anim) => ({
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.15, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
  });

  return (
    // FIX: explicit 170×170 — absolute children now center correctly
    <View style={{ width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />
    </View>
  );
};

// ─── Dot Loader ────────────────────────────────────────────────────────────
// FIX: useRef called at top level — not inside .map (was breaking rules of hooks)
const DotLoader = () => {
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 380, useNativeDriver: true }),
          Animated.delay(760 - delay),
        ])
      );
    const a0 = make(dot0, 0);
    const a1 = make(dot1, 180);
    const a2 = make(dot2, 360);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, []);

  const dotAnim = (anim) => ({
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.35] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
      <Animated.View style={dotAnim(dot0)} />
      <Animated.View style={dotAnim(dot1)} />
      <Animated.View style={dotAnim(dot2)} />
    </View>
  );
};

// ─── Splash Screen ─────────────────────────────────────────────────────────
export default function SplashScreen({ navigation }) {
  const logoScale      = useRef(new Animated.Value(0.3)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide   = useRef(new Animated.Value(20)).current;
  const dividerWidth   = useRef(new Animated.Value(0)).current;
  const panelSlide     = useRef(new Animated.Value(140)).current;
  const panelOpacity   = useRef(new Animated.Value(0)).current;
  const loaderOpacity  = useRef(new Animated.Value(0)).current;
  const loaderSlide    = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    // Step 1 — logo pops in
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Step 2 — divider + tagline
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(dividerWidth,   { toValue: 56, duration: 600, useNativeDriver: false }),
        Animated.timing(taglineOpacity, { toValue: 1,  duration: 500, useNativeDriver: true }),
        Animated.timing(taglineSlide,   { toValue: 0,  duration: 500, useNativeDriver: true }),
      ]).start();
    }, 500);

    // Step 3 — panel slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(panelSlide,   { toValue: 0, friction: 9, tension: 55, useNativeDriver: true }),
        Animated.timing(panelOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 900);

    // Step 4 — loader appears
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(loaderOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(loaderSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 1300);

    // Navigate
    const timer = setTimeout(async () => {
        const token = await AsyncStorage.getItem('authtoken');
      console.log("Token in splash screen:", token);
      if (token) {
        navigation?.replace('Home');
      } else {
        navigation?.replace('Login');
      };
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" translucent />

      {/* ── Decorative Circles ─────────────────────────────────────────────
          FIX: Only top-right + bottom-left corners — never overlaps logo center
      ── */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* ── Center Content ── */}
      <View style={styles.centerContent}>

        {/* Pulse rings — absolutely centered behind logo */}
      

        {/* Logo Badge */}
        <Animated.View style={[styles.logoBadge, {
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }]}>
            <View style={styles.pulseWrapper}>
          <PulseRings />
        </View>
          <View style={styles.logoBadgeInner}>
            <Image
              source={require('../assets/images/edelweiss_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Divider */}
        <Animated.View style={[styles.divider, { width: dividerWidth }]} />

        {/* Tagline */}
        <Animated.View style={{
          opacity: taglineOpacity,
          transform: [{ translateY: taglineSlide }],
          alignItems: 'center',
        }}>
          <Text style={styles.tagline}>ASSET RECONSTRUCTION</Text>
          <Text style={styles.taglineSub}>Transforming Challenges into Opportunities</Text>
        </Animated.View>

      </View>

      {/* ── Bottom Panel ── */}
      <Animated.View style={[styles.bottomPanel, {
        opacity: panelOpacity,
        transform: [{ translateY: panelSlide }],
      }]}>
        <View style={styles.handleBar} />

        <Animated.View style={{
          alignItems: 'center',
          opacity: loaderOpacity,
          transform: [{ translateY: loaderSlide }],
        }}>
          <DotLoader />
          <Text style={styles.loadingText}>Initializing secure session...</Text>
        </Animated.View>

        <Animated.View style={[styles.versionRow, { opacity: loaderOpacity }]}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v 2.0.1</Text>
          </View>
          <Text style={styles.copyrightText}>© 2025 Edelweiss ARC · All rights reserved</Text>
        </Animated.View>
      </Animated.View>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const WHITE    = '#FFFFFF';
const GRAY_50  = '#F8FAFC';
const GRAY_100 = '#F1F5F9';
const GRAY_200 = '#E2E8F0';
const GRAY_400 = '#94A3B8';
const GRAY_500 = '#64748B';

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },

  // FIX: Circles only at corners — top-right and bottom-left
  // They are far enough from center that they cannot clip the logo
  circle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.055)',
    top: -70,
    right: -70,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.045)',
    bottom: 210,
    left: -50,
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },

  // FIX: absolute wrapper centered over the logoBadge
  pulseWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // No width/height constraint — PulseRings component itself is 170×170
  },

  logoBadge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    // FIX: elevation: 0 prevents Android shadow from causing shape artifacts
    elevation: 0,
  },
  logoBadgeInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  // FIX: Logo bigger — properly fills the badge
  logoImage: {
    width: 110,
    height: 65,
    tintColor: WHITE,
  },

  divider: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 16,
  },

  tagline: {
    color: WHITE,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 4,
    marginBottom: 6,
    textAlign: 'center',
  },
  taglineSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  bottomPanel: {
    width: '100%',
    backgroundColor: GRAY_50,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    elevation: 20,
  },
  handleBar: {
    position: 'absolute',
    top: 12,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GRAY_200,
  },

  loadingText: {
    color: GRAY_400,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.4,
    marginBottom: 20,
  },

  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: GRAY_100,
    borderWidth: 1,
    borderColor: GRAY_200,
  },
  versionText: {
    color: GRAY_500,
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
  },
  copyrightText: {
    color: GRAY_400,
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
  },
});
