/**
 * PASTE THESE TWO LOADERS INTO InitiateValuationScreen.js
 *
 * 1. InitialLoader  — shown before asset list loads (API fetch)
 * 2. SubmitLoader   — shown after Submit button is tapped (API save)
 *
 * ─── HOW TO INTEGRATE ───────────────────────────────────────────────────────
 *
 * STEP 1 ─ Add two states inside InitiateValuationScreen:
 *
 *   const [pageLoading,   setPageLoading]   = useState(true);   // initial fetch
 *   const [submitting,    setSubmitting]    = useState(false);   // submit loader
 *
 * STEP 2 ─ Simulate / replace with real API call for initial load:
 *
 *   useEffect(() => {
 *     fetchValuationData()           // your real API call
 *       .then(data => { setApiData(data); })
 *       .finally(() => setPageLoading(false));
 *   }, []);
 *
 * STEP 3 ─ Inside <View style={{ flex: 1 }}> replace content with:
 *
 *   {pageLoading ? (
 *     <InitialLoader />
 *   ) : screen === 'SELECT' ? (
 *     <AssetSelectionScreen ... />
 *   ) : screen === 'FORM' ? (
 *     <ValuationFormScreen
 *       ...
 *       onSubmit={async (payload) => {
 *         setSubmitting(true);
 *         try {
 *           await fetch('https://testapp.example.com/createvaluation', {
 *             method: 'POST',
 *             headers: { 'Content-Type': 'application/json' },
 *             body: JSON.stringify(payload),
 *           });
 *           setScreen('SUCCESS');
 *         } catch (err) {
 *           Alert.alert('Error', 'Failed to submit. Please try again.');
 *         } finally {
 *           setSubmitting(false);
 *         }
 *       }}
 *     />
 *   ) : (
 *     <SuccessScreen ... />
 *   )}
 *
 *   <SubmitLoader visible={submitting} />
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';

const C = {
  primary:      '#1A56DB',
  primaryLight: '#EBF1FF',
  primaryDark:  '#1240A8',
  accent:       '#3B82F6',
  white:        '#FFFFFF',
  text:         '#1E2A4A',
  textMuted:    '#6B7A99',
  grey:         '#E8EDF8',
  border:       '#D1DCF8',
  success:      '#10B981',
  successLight: '#ECFDF5',
};

// ═══════════════════════════════════════════════════════════════════════════════
//  LOADER 1 — INITIAL PAGE LOADER
//  Shown while the API fetches account + asset data before the asset list renders
// ═══════════════════════════════════════════════════════════════════════════════
export const InitialLoader = () => {
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1      = useRef(new Animated.Value(0.3)).current;
  const dot2      = useRef(new Animated.Value(0.3)).current;
  const dot3      = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Spinner rotation
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start();

    // Icon pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Dot wave
    const makeDot = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 350, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
          Animated.delay(700 - delay),
        ])
      );
    Animated.parallel([
      makeDot(dot1, 0),
      makeDot(dot2, 200),
      makeDot(dot3, 400),
    ]).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={ls.container}>
      {/* Spinner ring + house icon */}
      <View style={ls.spinnerWrap}>
        {/* Outer track */}
        <View style={ls.spinnerTrack} />
        {/* Animated arc */}
        <Animated.View style={[ls.spinnerArc, { transform: [{ rotate: spin }] }]} />
        {/* Icon */}
        <Animated.View style={[ls.iconBox, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={{ fontSize: 28 }}>🏠</Text>
        </Animated.View>
      </View>

      {/* Title */}
      <Text style={ls.title}>Loading Valuation Data</Text>

      {/* Sub */}
      <Text style={ls.subtitle}>
        Fetching account details{'\n'}and collateral assets...
      </Text>

      {/* Dots */}
      <View style={ls.dotsRow}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[ls.dot, { opacity: d }]} />
        ))}
      </View>

      {/* Status pill */}
      <View style={ls.statusPill}>
        <View style={ls.statusDot} />
        <Text style={ls.statusText}>Connecting to EARC Spectrum</Text>
      </View>

      {/* Info cards row */}
      <View style={ls.skeletonRow}>
        {[1, 2].map((n) => (
          <View key={n} style={ls.skeletonCard}>
            <View style={ls.skeletonLine} />
            <View style={[ls.skeletonLine, { width: '65%', marginTop: 6 }]} />
          </View>
        ))}
      </View>

      {/* Skeleton asset cards */}
      {[1, 2, 3].map((n) => (
        <View key={n} style={ls.skeletonAsset}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View style={ls.skeletonCircle} />
            <View style={{ flex: 1 }}>
              <View style={ls.skeletonLine} />
              <View style={[ls.skeletonLine, { width: '50%', marginTop: 5 }]} />
            </View>
            <View style={ls.skeletonBadge} />
          </View>
          <View style={ls.skeletonAddress} />
        </View>
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  LOADER 2 — SUBMIT LOADER (OVERLAY MODAL)
//  Shown over the screen after Submit is tapped, until API responds
// ═══════════════════════════════════════════════════════════════════════════════
export const SubmitLoader = ({ visible }) => {
  const spinAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const prog1       = useRef(new Animated.Value(0)).current;
  const prog2       = useRef(new Animated.Value(0)).current;
  const prog3       = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Appear
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,   tension: 65, friction: 9, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Spinner
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
      ).start();

      // Staggered step reveals (simulates progress)
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(prog1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(prog2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(prog3, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      // Reset
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      prog1.setValue(0);
      prog2.setValue(0);
      prog3.setValue(0);
    }
  }, [visible]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const steps = [
    { label: 'Validating form data',      anim: prog1 },
    { label: 'Saving valuation record',   anim: prog2 },
    { label: 'Confirming with server',    anim: prog3 },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => {}}>
      <View style={ss.overlay}>
        <Animated.View style={[ss.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>

          {/* Spinner */}
          <View style={ss.spinnerWrap}>
            <View style={ss.spinnerTrack} />
            <Animated.View style={[ss.spinnerArc, { transform: [{ rotate: spin }] }]} />
            <View style={ss.spinnerCore}>
              <Text style={{ fontSize: 26 }}>📋</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={ss.title}>Submitting Valuation</Text>
          <Text style={ss.subtitle}>Please wait, do not close the app</Text>

          {/* Divider */}
          <View style={ss.divider} />

          {/* Step progress */}
          {steps.map(({ label, anim }, i) => (
            <Animated.View
              key={i}
              style={[ss.stepRow, { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}
            >
              <Animated.View style={[
                ss.stepDot,
                { backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [C.grey, C.primary] }) },
              ]}>
                <Text style={{ color: C.white, fontSize: 10, fontWeight: '800' }}>✓</Text>
              </Animated.View>
              <Text style={ss.stepLabel}>{label}</Text>
            </Animated.View>
          ))}

          {/* Warning note */}
          <View style={ss.warnNote}>
            <Text style={{ fontSize: 14, marginRight: 7 }}>⚠️</Text>
            <Text style={ss.warnText}>Do not press back or close this screen</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── INITIAL LOADER STYLES ────────────────────────────────────────────────────
const ls = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.white,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 24,
  },

  // Spinner
  spinnerWrap: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  spinnerTrack: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: C.primaryLight },
  spinnerArc: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    borderWidth: 4, borderColor: 'transparent', borderTopColor: C.primary,
  },
  iconBox: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // Text
  title:    { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  // Dots
  dotsRow: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },

  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primaryLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9, marginBottom: 24,
    borderWidth: 1, borderColor: C.border,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  statusText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Skeleton rows
  skeletonRow:    { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 14 },
  skeletonCard:   { flex: 1, backgroundColor: C.grey, borderRadius: 12, padding: 12 },
  skeletonLine:   { height: 10, backgroundColor: C.border, borderRadius: 5, width: '80%' },
  skeletonBadge:  { width: 60, height: 20, backgroundColor: C.border, borderRadius: 10 },
  skeletonCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.border },

  // Skeleton asset
  skeletonAsset: {
    width: '100%', backgroundColor: C.grey, borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  skeletonAddress: { height: 28, backgroundColor: C.border, borderRadius: 8, width: '100%' },
});

// ─── SUBMIT LOADER STYLES ─────────────────────────────────────────────────────
const ss = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,60,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 20 },
    }),
  },

  // Spinner
  spinnerWrap:  { width: 86, height: 86, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  spinnerTrack: { position: 'absolute', width: 86, height: 86, borderRadius: 43, borderWidth: 4, borderColor: C.primaryLight },
  spinnerArc: {
    position: 'absolute', width: 86, height: 86, borderRadius: 43,
    borderWidth: 4, borderColor: 'transparent', borderTopColor: C.primary,
  },
  spinnerCore: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // Text
  title:    { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 18 },
  divider:  { height: 1, backgroundColor: C.border, width: '100%', marginBottom: 16 },

  // Steps
  stepRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginBottom: 12 },
  stepDot:  { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 13, color: C.text, fontWeight: '500' },

  // Warning
  warnNote: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D',
    borderRadius: 12, padding: 12, marginTop: 8, width: '100%',
  },
  warnText: { fontSize: 12, color: '#92400E', flex: 1, fontWeight: '500' },
});
