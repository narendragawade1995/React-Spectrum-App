import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const Loan360View = ({ route, navigation }) => {
  const  accountNumber  = '1212121221';
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Sample data - replace with your API call
  const sampleAddresses = [
    {
      id: '1',
      name: 'John Doe',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      address3: 'Near City Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true,
      type: 'Home'
    },
    {
      id: '2',
      name: 'John Doe',
      address1: '456 Business Park',
      address2: 'Floor 3, Office 301',
      address3: 'Tech Hub Complex',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411014',
      isDefault: false,
      type: 'Office'
    },
    {
      id: '3',
      name: 'Jane Doe',
      address1: '789 Residential Area',
      address2: 'Block C, Flat 201',
      address3: 'Green Valley Society',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      isDefault: false,
      type: 'Home'
    }
  ];

  useEffect(() => {
    fetchAddresses();
    animateContent();
  }, []);

  const animateContent = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setAddresses(sampleAddresses);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAddresses().then(() => setRefreshing(false));
  }, []);

  const handleAddressPress = (address) => {
    Alert.alert(
      'Address Options',
      'What would you like to do with this address?',
      [
        { text: 'Edit', onPress: () => editAddress(address) },
        { text: 'Delete', onPress: () => deleteAddress(address.id), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const editAddress = (address) => {
    navigation.navigate('EditAddress', { address, accountNumber });
  };

  const deleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setAddresses(addresses.filter(addr => addr.id !== addressId));
          }
        }
      ]
    );
  };

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'Home':
        return 'home';
      case 'Office':
        return 'business';
      default:
        return 'location-on';
    }
  };

  const getTypeColor = (type, isDefault) => {
    if (isDefault) return '#6366f1';
    switch (type) {
      case 'Home':
        return '#10b981';
      case 'Office':
        return '#f59e0b';
      default:
        return '#6366f1';
    }
  };

  const AddressCard = ({ item, index }) => {
    const cardAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
      Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const typeColor = getTypeColor(item.type, item.isDefault);

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: cardAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.addressCard,
            item.isDefault && styles.defaultCard
          ]}
          onPress={() => handleAddressPress(item)}
          activeOpacity={0.95}
        >
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
                <Icon 
                  name={getAddressTypeIcon(item.type)} 
                  size={22} 
                  color={typeColor} 
                />
              </View>
              <View style={styles.headerTextContainer}>
                <View style={styles.typeRow}>
                  <Text style={[styles.addressType, { color: typeColor }]}>
                    {item.type}
                  </Text>
                  {item.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: typeColor }]}>
                      <Text style={styles.defaultBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.nameText}>{item.name}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => handleAddressPress(item)}
            >
              <Icon name="more-vert" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.addressContent}>
            <View style={styles.addressLine}>
              <Icon name="location-on" size={16} color="#94a3b8" />
              <Text style={styles.addressText}>{item.address1}</Text>
            </View>
            {item.address2 && (
              <View style={styles.addressLine}>
                <View style={styles.addressDot} />
                <Text style={styles.addressText}>{item.address2}</Text>
              </View>
            )}
            {item.address3 && (
              <View style={styles.addressLine}>
                <View style={styles.addressDot} />
                <Text style={styles.addressText}>{item.address3}</Text>
              </View>
            )}
            <View style={styles.locationLine}>
              <Icon name="place" size={16} color="#94a3b8" />
              <Text style={styles.locationText}>
                {item.city}, {item.state} {item.pincode}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="edit" size={16} color="#6366f1" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="delete-outline" size={16} color="#ef4444" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View 
      style={[
        styles.emptyState,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.emptyIconContainer}>
        <Icon name="location-off" size={48} color="#cbd5e1" />
      </View>
      <Text style={styles.emptyTitle}>No addresses found</Text>
      <Text style={styles.emptySubtitle}>
        There are no addresses associated with account {accountNumber}
      </Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddAddress', { accountNumber })}
      >
        <Icon name="add" size={18} color="#fff" />
        <Text style={styles.addButtonText}>Add New Address</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingSpinner}>
        <Icon name="refresh" size={24} color="#6366f1" />
      </View>
      <Text style={styles.loadingText}>Loading addresses...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerTextSection}>
            <Text style={styles.headerTitle}>Customer Addresses</Text>
            <Text style={styles.headerSubtitle}>Account: {accountNumber}</Text>
          </View>
          <TouchableOpacity 
            style={styles.addHeaderButton}
            onPress={() => navigation.navigate('AddAddress', { accountNumber })}
          >
            <Icon name="add" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        renderLoadingState()
      ) : (
        <Animated.View 
          style={[
            styles.listWrapper,
            { opacity: fadeAnim }
          ]}
        >
          <FlatList
            data={addresses}
            renderItem={({ item, index }) => <AddressCard item={item} index={index} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#6366f1']}
                tintColor="#6366f1"
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        </Animated.View>
      )}

      {addresses.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddAddress', { accountNumber })}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  addHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  defaultCard: {
    borderColor: '#6366f1',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  moreButton: {
    padding: 4,
  },
  addressContent: {
    marginBottom: 16,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94a3b8',
    marginTop: 8,
    marginLeft: 6,
    marginRight: 10,
  },
  addressText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e2e8f0',
  },
  actionText: {
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 6,
    fontWeight: '500',
  },
  deleteText: {
    color: '#ef4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});

 
export default Loan360View;
