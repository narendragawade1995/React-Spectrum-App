/**
 * BottomSheetModal.js
 * Generic bottom sheet modal for dropdown selections.
 * Used for Payment Type, Payment For selections.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';

const BottomSheetModal = ({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Drag Handle */}
              <View style={styles.handle} />

              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {options.map(opt => {
                  const isSelected = selectedValue === opt.label;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[
                        styles.optionRow,
                        isSelected ? styles.optionRowSelected : styles.optionRowDefault,
                      ]}
                      onPress={() => onSelect(opt.label)}
                      activeOpacity={0.7}>
                      <View style={styles.optionLeft}>
                        {opt.icon ? (
                          <Text style={styles.optionIcon}>{opt.icon}</Text>
                        ) : null}
                        <Text
                          style={[
                            styles.optionLabel,
                            {
                              color: isSelected ? '#001a6e' : '#1e293b',
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {opt.label}
                        </Text>
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4},
  subtitle: {fontSize: 11, color: '#64748b', marginBottom: 14},
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  optionRowSelected: {backgroundColor: '#eff6ff', borderColor: '#001a6e'},
  optionRowDefault: {backgroundColor: '#f8fafc', borderColor: '#e2e8f0'},
  optionLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  optionIcon: {fontSize: 18},
  optionLabel: {fontSize: 14},
  checkmark: {color: '#001a6e', fontSize: 16, fontWeight: '700'},
});

export default BottomSheetModal;
