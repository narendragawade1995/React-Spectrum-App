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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../theme/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const AccountDeatilsPopup = ({ visible, borrowerData, onClose ,navigation}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values and animate up
      translateY.setValue(SCREEN_HEIGHT);
      opacity.setValue(0);
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
  
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5 ;
      },
      onPanResponderGrant: () => {
        // Do nothing on grant
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.8) {
          closeModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const DetailRow = ({ label, value, isHighlight = false }) => (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, isHighlight && styles.highlightValue]}>
        {value || 'N/A'}
      </Text>
    </View>
  );

      const onAccountdetails360 = (item,component) => {
        navigation.navigate(component, item);

    };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-IN');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={closeModal}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={closeModal}
          />
          
          <Animated.View
            style={[
              styles.popup,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
              <View style={styles.dragHandle} />
            </View>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Borrower Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <DetailRow label="Account Number" value={borrowerData?.account_no} />
                <DetailRow label="Borrower Name" value={borrowerData?.customer_name} />
                <DetailRow label="Virtual Number" value={borrowerData?.virtual_number} />
              </View>

              {/* Bank & Trust Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bank & Trust Details</Text>
                <DetailRow label="Selling Bank" value={borrowerData?.bank_name} />
                <DetailRow label="Trust Code" value={borrowerData?.trust} />
                <DetailRow label="Trust Name" value={borrowerData?.trust} />
              </View>

              {/* Financial Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Information</Text>
                <DetailRow 
                  label="EMI Overdue" 
                  value={formatCurrency(borrowerData?.over_dues)} 
                  isHighlight 
                />
                <DetailRow 
                  label="EMI Amount" 
                  value={formatCurrency(borrowerData?.monthly_emi)} 
                  isHighlight 
                />
                <DetailRow label="TOS as per normal ledger" value={borrowerData?.over_dues} />
                <DetailRow label="TOS as per Settlement/Restructuring" value={borrowerData?.total_outstanding_settlement_restructure} />
                {/* <DetailRow label="EMI Overdue" value={borrowerData?.emiOverdue} /> */}
                <DetailRow label="Resolution Status" value={borrowerData?.resolution_status} />

              </View>

              {/* Status & Follow-up */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status & Follow-up</Text>
                <DetailRow label="Last Disposition" value={borrowerData?.disposition} />
                <DetailRow label="Last Action Date"  value={formatDate(borrowerData?.last_disposition_date)}  />

               
                <DetailRow 
                  label="Follow Up Date" 
                  value={formatDate(borrowerData?.follow_up_date)} 
                />
              </View>

         
              {/* Bottom spacing for safe area */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

 

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
     
  },
  // Dashboard Styles
  dashboard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  viewDetailsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Popup Styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  popup: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.6,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  dragHandleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'white',

  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    minHeight: 40,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1.5,
    textAlign: 'right',
    fontWeight: '400',
    flexWrap: 'wrap',
  },
  highlightValue: {
    color: '#007AFF',
    fontWeight: '600',
  },
 
  secondaryButtonText: {
    color: '#007AFF',
  },
});

export default AccountDeatilsPopup;