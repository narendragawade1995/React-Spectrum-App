import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'react-native-paper-dropdown';  // Ensure this import is correct
import { TextInput, Button } from 'react-native-paper';
import Api from '../Utilities/apiService';
import { COLORS } from '../theme/theme';

const AddressForm = ({ route, ...props }) => {
  const { control, handleSubmit, watch, formState: { errors } ,reset} = useForm();
  const [borrowerTypes, setBorrowerTypes] = useState([{ label: 'Correspondence', value: 'Correspondence' }]);
  const [names, setNames] = useState([]);
  const [customerList, setCustomerList] = useState({ allCustomers: [], selectedCustomer: '' });
  const [showDropdowns, setShowDropdowns] = useState({
    addressType: false,
    borrowerType: false,
    names: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBorrowerType = watch('borrower_type');

  const addressTypes = [
    { label: 'Correspondence', value: 'Correspondence' },
    { label: 'Office', value: 'Office' },
    { label: 'Residential', value: 'Residential' },
    { label: 'Shop', value: 'Shop' },
    { label: 'Other', value: 'Other' },
  ];

  useEffect(() => {
    fetchBorrowerTypes();
  }, []);

  useEffect(() => {
    if (selectedBorrowerType) {
      fetchNames(selectedBorrowerType);
    }
  }, [selectedBorrowerType]);

  const fetchBorrowerTypes = async () => {
    try {
      const response = await Api.send({ ...route.params }, 'secure_borrowerdetails/getcustomerList');
      const data = response;
      setCustomerList(prevState => ({ ...prevState, allCustomers: data }));

      const uniqueBorrowerTypes = [...new Set(data.map(item => item['Borrower Type'])), 'Others'];
      setBorrowerTypes(uniqueBorrowerTypes.map(type => ({ label: type, value: type })));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch borrower types');
    }
  };

  const fetchNames = async (borrowerType) => {
    try {
      const filteredNames = customerList.allCustomers
        .filter(item => item['Borrower Type'] === borrowerType)
        .map(item => ({ label: item['Customer Name'], value: item['Customer Name'] }));

      setNames(filteredNames);
    } catch (error) {
      console.error('Error fetching names:', error);
      Alert.alert('Error', 'Failed to fetch names');
    }
  };

  const onSubmit = async (data) => {
    
    setIsSubmitting(true);
    const payload = {
      account_number: route.params.account_no,
      account_id: route.params.account_id,
      ...data,
    };
    try {

      let mode =  await Api.getMode()
      if(mode == 'offline'){
        Api.setOfflineSync({...payload,url:'secure_borrowerdetails/addSpectrumaddress'})
        Alert.alert('Success', 'Address Saved Offline.');
        reset();
        return;
      }
      Api.send(payload,'secure_borrowerdetails/addSpectrumaddress').then(
        res=>{
          Alert.alert('Success', 'Address Saved Successfully.');
          reset();
        }
        
      ).catch(err=>{
        Alert.alert('Success', 'Something Wrong Please try again.');
        reset();
      })
      // await Api.setOfflineSync(payload);
      
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTextInput = (name, label, rules = {}, extraProps = {}) => (
    <Controller
      control={control}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <TextInput
          label={label}
          mode="outlined"
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
          error={!!error}
          style={styles.input}
          {...extraProps}
        />
      )}
      name={name}
    />
  );

  const renderDropdown = (name, data, label, rules = {}, dropdownKey) => (
    <Controller
      control={control}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.dropdownContainer}>
          <Dropdown
            label={label}
            mode="outlined"
            visible={showDropdowns[dropdownKey]}
            showDropDown={() => setShowDropdowns(prevState => ({ ...prevState, [dropdownKey]: true }))}
            onDismiss={() => setShowDropdowns(prevState => ({ ...prevState, [dropdownKey]: false }))}
            value={value}
            onSelect={onChange}
            hideMenuHeader={true}
            options={data}
          />
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
      name={name}
    />
  );

  return (
    <View style={styles.maincontainer}>
      <ScrollView style={styles.container}>
        {renderTextInput('address1', 'Address 1', { required: 'Address 1 is required' })}
        {renderTextInput('address2', 'Address 2')}
        {renderDropdown('address_type', addressTypes, 'Select Address Type', { required: 'Address type is required' }, 'addressType')}
        {renderDropdown('borrower_type', borrowerTypes, 'Select Borrower Type', { required: 'Borrower type is required' }, 'borrowerType')}
        {selectedBorrowerType !== 'Others' ? (
          renderDropdown('customer_name', names, 'Select Name', { required: 'Name is required' }, 'names')
        ) : (
          <>
            {renderTextInput('customer_name', 'Enter Name', { required: 'Name is required' })}
            {renderTextInput('relation_with_borrower', 'Relationship With Borrower', { required: 'Field is required' })}
          </>
        )}
        {renderTextInput('state', 'State', { required: 'State is required' })}
        {renderTextInput('city', 'City', { required: 'City is required' })}
        {renderTextInput('pincode', 'Pincode', {
          required: 'Pincode is required',
          pattern: { value: /^[0-9]{6}$/, message: 'Pincode must be 6 digits' },
        }, { keyboardType: 'numeric' })}
      </ScrollView>
      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        style={styles.button}
        disabled={isSubmitting}
      >
        <Text style={{ color: COLORS.white, textAlign: 'center', fontSize: 16, letterSpacing: 1 }}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    backgroundColor: COLORS.geryl,
    position: 'relative',
    paddingBottom: 10,
  },
  container: {
    padding: 20,
    marginTop: 10,
  },
  input: {
    marginBottom: 15,
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 25,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    width: '100%',
    bottom: 0,
    color: COLORS.white,
  },
});

export default AddressForm;
