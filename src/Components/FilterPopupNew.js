import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,  
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTER_FIELDS = [
  { key: 'borrower_name', label: 'Borrower Name', icon: 'account-outline', placeholder: 'Enter borrower name...' },
  { key: 'selling_bank', label: 'Selling Bank', icon: 'bank-outline', placeholder: 'Enter bank name...' },
  { key: 'trust_code', label: 'Trust Code', icon: 'shield-key-outline', placeholder: 'Enter trust code...' },
  { key: 'virtual_number', label: 'Virtual Number', icon: 'phone-outline', placeholder: 'Enter virtual number...' },
  { key: 'disposition', label: 'Disposition', icon: 'clipboard-text-outline', placeholder: 'Enter disposition...' },
  { key: 'zone', label: 'Zone', icon: 'map-marker-outline', placeholder: 'Enter zone...' },
  { key: 'resolution_type', label: 'Resolution Type', icon: 'check-circle-outline', placeholder: 'Enter resolution type...' },
];

const FilterPopup = ({ visible, onClose, onApply, initialFilters = {} }) => {
  const [filters, setFilters] = useState(initialFilters);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const closeModal = (callback) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => callback && callback());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.8) closeModal(onClose);
        else Animated.spring(translateY, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handleFieldChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleApply = () => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v && v.trim() !== '')
    );
    closeModal(() => onApply(activeFilters));
  };

  const activeCount = Object.values(filters).filter(v => v && v.trim() !== '').length;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => closeModal(onClose)} statusBarTranslucent>
      <Animated.View style={[fp.overlay, { opacity }]}>
        <TouchableOpacity style={fp.backdrop} activeOpacity={1} onPress={() => closeModal(onClose)} />
        <Animated.View style={[fp.sheet, { transform: [{ translateY }] }]}>
          {/* Drag Handle */}
          <View style={fp.dragArea} {...panResponder.panHandlers}>
            <View style={fp.dragHandle} />
          </View>

          {/* Header */}
          <View style={fp.header}>
            <View style={fp.headerLeft}>
              <View style={fp.headerIconWrap}>
                <Icon name="filter-variant" size={18} color="#fff" />
              </View>
              <View>
                <Text style={fp.headerTitle}>Filters</Text>
                {activeCount > 0 && (
                  <Text style={fp.headerSub}>{activeCount} filter{activeCount > 1 ? 's' : ''} active</Text>
                )}
              </View>
            </View>
            <View style={fp.headerRight}>
              {activeCount > 0 && (
                <TouchableOpacity style={fp.resetBtn} onPress={handleReset}>
                  <Icon name="refresh" size={14} color="#F44336" />
                  <Text style={fp.resetText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={fp.closeBtn} onPress={() => closeModal(onClose)}>
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Fields */}
          <ScrollView style={fp.scroll} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={fp.fieldsContainer}>
              {FILTER_FIELDS.map((field, idx) => {
                const hasValue = filters[field.key] && filters[field.key].trim() !== '';
                return (
                  <View key={field.key} style={fp.fieldWrap}>
                    <View style={fp.fieldLabelRow}>
                      <Icon name={field.icon} size={14} color={hasValue ? '#1565C0' : '#888'} />
                      <Text style={[fp.fieldLabel, hasValue && fp.fieldLabelActive]}>{field.label}</Text>
                      {hasValue && (
                        <TouchableOpacity onPress={() => handleFieldChange(field.key, '')} style={fp.clearField}>
                          <Icon name="close-circle" size={14} color="#aaa" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={[fp.textInput, hasValue && fp.textInputActive]}
                      placeholder={field.placeholder}
                      placeholderTextColor="#bbb"
                      value={filters[field.key] || ''}
                      onChangeText={(text) => handleFieldChange(field.key, text)}
                    />
                  </View>
                );
              })}
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={fp.footer}>
            <TouchableOpacity style={fp.cancelBtn} onPress={() => closeModal(onClose)}>
              <Text style={fp.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[fp.applyBtn, activeCount === 0 && fp.applyBtnDisabled]}
              onPress={handleApply}
            >
              <Icon name="check" size={16} color="#fff" />
              <Text style={fp.applyText}>
                Apply{activeCount > 0 ? ` (${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const fp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    minHeight: SCREEN_HEIGHT * 0.55,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  dragArea: { paddingVertical: 12, alignItems: 'center' },
  dragHandle: { width: 38, height: 4, backgroundColor: '#ddd', borderRadius: 2 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: '#1565C0', marginTop: 1, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF3F3',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  resetText: { fontSize: 12, color: '#F44336', fontWeight: '600' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  fieldsContainer: { paddingHorizontal: 20, paddingTop: 16 },
  fieldWrap: { marginBottom: 16 },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  fieldLabel: { fontSize: 13, color: '#888', fontWeight: '500', flex: 1 },
  fieldLabelActive: { color: '#1565C0' },
  clearField: { padding: 2 },
  textInput: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },
  textInputActive: {
    borderColor: '#1565C0',
    backgroundColor: '#F0F4FF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#666', fontWeight: '600' },
  applyBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    elevation: 3,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  applyBtnDisabled: { backgroundColor: '#90A4AE', elevation: 0, shadowOpacity: 0 },
  applyText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

export default FilterPopup;
