import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
} from 'react-native-paper';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const BottomFilterPopup = ({ visible, onClose, onApplyFilters, currentFilters = {} }) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [overlayOpacity] = useState(new Animated.Value(0));
  
  const [filters, setFilters] = useState({
    customerName: '',
    accountNumber: '',
    trustCode: '',
    sellingBank: '',
    disposition: '',
    zone: '',
    ...currentFilters,
  });

  const [accountSuggestions, setAccountSuggestions] = useState([]);
  const [isSearchingAccounts, setIsSearchingAccounts] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState(null);

  // Fixed options data
  const filterOptions = {
    customerName: [
      'Alice Thompson',
      'Robert Chen',
      'Maria Garcia',
      'James Wilson',
      'Lisa Anderson',
      'David Kumar',
      'Emma Rodriguez',
    ],
    trustCode: [
      'TC-2024-001',
      'TC-2024-002', 
      'TC-2024-003',
      'TC-2024-004',
      'TC-2024-005',
      'TC-2024-006',
    ],
    sellingBank: [
      'HDFC Bank',
      'ICICI Bank',
      'State Bank of India',
      'Axis Bank',
      'Kotak Mahindra Bank',
      'Punjab National Bank',
    ],
    disposition: [
      'New Lead',
      'In Progress',
      'Follow Up Required',
      'Completed',
      'On Hold',
      'Cancelled',
    ],
    zone: [
      'Mumbai Central',
      'Mumbai North',
      'Mumbai South',
      'Pune District',
      'Nashik Region',
      'Aurangabad Zone',
    ],
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Account number API search
  const searchAccounts = async (query) => {
    if (query.length < 3) {
      setAccountSuggestions([]);
      setShowAccountDropdown(false);
      return;
    }

    setIsSearchingAccounts(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`YOUR_API_ENDPOINT/search-accounts?q=${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers
          // 'Authorization': 'Bearer YOUR_TOKEN',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAccountSuggestions(result.data || []);
        setShowAccountDropdown(true);
      }
    } catch (error) {
      console.error('Account search error:', error);
      setAccountSuggestions([]);
    } finally {
      setIsSearchingAccounts(false);
    }
  };

  // Debounced account search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.accountNumber.length >= 3) {
        searchAccounts(filters.accountNumber);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.accountNumber]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setOpenDropdown(null);
  };

  const toggleDropdown = (field) => {
    setOpenDropdown(openDropdown === field ? null : field);
    setShowAccountDropdown(false);
  };

  const resetFilters = () => {
    setFilters({
      customerName: '',
      accountNumber: '',
      trustCode: '',
      sellingBank: '',
      disposition: '',
      zone: '',
    });
    setOpenDropdown(null);
    setShowAccountDropdown(false);
    setAccountSuggestions([]);
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleBackdropPress = () => {
    setOpenDropdown(null);
    setShowAccountDropdown(false);
    onClose();
  };

  const renderDropdownField = (field, label, options) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownInput,
          openDropdown === field && styles.dropdownInputActive,
        ]}
        onPress={() => toggleDropdown(field)}
      >
        <Text style={[
          styles.dropdownText,
          !filters[field] && styles.placeholderText
        ]}>
          {filters[field] || `Choose ${label}`}
        </Text>
        <Text style={[
          styles.dropdownArrow,
          openDropdown === field && styles.dropdownArrowRotated
        ]}>
          ▼
        </Text>
      </TouchableOpacity>

      {openDropdown === field && (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.optionsList} nestedScrollEnabled>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  filters[field] === option && styles.selectedOption
                ]}
                onPress={() => handleFilterChange(field, option)}
              >
                <Text style={[
                  styles.optionText,
                  filters[field] === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderAccountField = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Account Number</Text>
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          value={filters.accountNumber}
          onChangeText={(text) => {
            handleFilterChange('accountNumber', text);
            if (text.length < 3) {
              setShowAccountDropdown(false);
            }
          }}
          placeholder="Enter at least 3 characters..."
          placeholderTextColor="#9CA3AF"
        />
        {isSearchingAccounts && (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.searchLoader} />
        )}
      </View>

      {showAccountDropdown && accountSuggestions.length > 0 && (
        <View style={styles.dropdownList}>
          <FlatList
            data={accountSuggestions}
            keyExtractor={(item, index) => index.toString()}
            style={styles.optionsList}
            nestedScrollEnabled
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  handleFilterChange('accountNumber', item.accountNumber);
                  setShowAccountDropdown(false);
                }}
              >
                <Text style={styles.optionText}>
                  {item.accountNumber}
                </Text>
                <Text style={styles.optionSubtext}>
                  {item.customerName}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: overlayOpacity }
          ]} 
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle Bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filter Options</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {renderDropdownField('customerName', 'Customer Name', filterOptions.customerName)}
          {renderAccountField()}
          {renderDropdownField('trustCode', 'Trust Code', filterOptions.trustCode)}
          {renderDropdownField('sellingBank', 'Selling Bank', filterOptions.sellingBank)}
          {renderDropdownField('disposition', 'Disposition', filterOptions.disposition)}
          {renderDropdownField('zone', 'Zone', filterOptions.zone)}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownInputActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionsList: {
    maxHeight: 180,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BottomFilterPopup;