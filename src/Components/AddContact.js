import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'react-native-paper-dropdown';
import Api from '../Utilities/apiService';
import { COLORS } from '../theme/theme';

const ResponseForm = ({ route, ...props }) => {
  const { control, handleSubmit, watch ,reset} = useForm();
  const [isFocus, setIsFocus] = useState(false);
  const [Apires, setApires] = useState({ selectedlist: [], borrower_type: [] });
  const [selectd_opt, setSelectedOpt] = useState({ borrower_type: '' });
  const [namesData, setnameData] = useState([]);
  const contactType = watch('contactType');
  const borrowerType = watch('borrowerType');
  const phoneNumberType = watch('phoneNumberType');
  const contactTypeData = [
    { label: 'Phone Number', value: 'Phone Number' },
    { label: 'Email Id', value: 'Email Id' },
  ];

  const phoneNumberTypeData = [
    { label: 'Mobile', value: 'Mobile' },
    { label: 'Landline', value: 'Landline' },
  ];

  useEffect(() => {
    fetchCustomerList();
    return ()=>{}
  }, []);

  const fetchCustomerList = async () => {
    try {
      let result = await Api.send({ ...route.params }, 'secure_borrowerdetails/getcustomerList');
      console.log(result);
      let types = [...new Set(result.map((im) => im['Borrower Type']))].map((type) => {
        return { label: type, value: type };
      });
      console.log({ types });
      setApires({
        customerlist: result,
        selectedlist: result,
        borrower_type: [...types, { label: 'Others', value: 'Others' }],
      });
      setnameData(result);
    } catch (error) {
      console.error(error);
    }
  };

  const setCustomerlist = (type) => {
    setSelectedOpt({ ...selectd_opt, borrower_type: type });
    let list = Apires.customerlist.filter((itm) => itm['Borrower Type'] === type).map(itm=>{
      return { value:itm['Customer Name'] , label:itm['Customer Name']}
    });
    setApires({ ...Apires, selectedlist: list });
  };

  const onSubmit = async(data) => {
    let contactdata = {
      account_id: route.params.account_id,
      account_number: route.params.account_no,
      borrower_type: data.borrowerType,
      con_type: data.contactType ? data.contactType : null,
      cont_number: data.contactType !== 'Phone Number' ? data.email : data.phoneNumber,
      number_type: data.phoneNumberType,
      relation_with_borrower: data.relationship ? data.relationship : '',
      customer_name:data.customer_name
    };
    
    let mode = await Api.getMode()
    if(mode == 'offline'){
      Api.setOfflineSync({...contactdata,url:'secure_borrowerdetails/addContact'})
      Alert.alert('Success', 'Contact Saved Offline', [], { cancelable: true });
      reset();
      return;
    }

    Api.send(contactdata,'secure_borrowerdetails/addContact').then(
      res=>{
        Alert.alert('Success', 'Contact Saved Successfully', [], { cancelable: true });
        reset();
      }
    ).catch(
      err=>{
        Alert.alert('Success', 'Something Wrong', [], { cancelable: true }); 
        reset();
      })
  };

  return (
    <View style={styles.maincontainer}>
    <ScrollView style={styles.container}>

      <Controller
        control={control}
        name="contactType"
        rules={{ required: 'Contact type is required' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.dropdownContainer}>
            <Dropdown
             theme={{
              colors: {
                primary:  COLORS.primary,
                background: 'white',  
                surface: 'white',  
              },
            }}
              mode="outlined"
              label="Contact Type"
              hideMenuHeader={true}
              style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
              options={contactTypeData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? 'Select contact type' : '...'}
              value={value}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onSelect={(item) => {
                console.log(item);
                onChange(item);
                setIsFocus(false);
              }}
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        )}
      />

      {contactType === 'Phone Number' && (
        <>
          <Controller
            control={control}
            name="phoneNumberType"
            rules={{ required: 'Number type is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.dropdownContainer}>
                <Dropdown
                  label="Number Type" 
                  hideMenuHeader={true}
                  mode="outlined"
                  style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  itemTextStyle={styles.itemTextStyle}
                  options={phoneNumberTypeData}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder={!isFocus ? 'Select number type' : '...'}
                  value={value}
                  onFocus={() => setIsFocus(true)}
                  onBlur={() => setIsFocus(false)}
                  onSelect={(item) => {
                    onChange(item);
                    setIsFocus(false);
                  }}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            rules={{
              required: 'Phone number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Please enter a valid 10-digit phone number',
              },
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Contact Number"
                  value={value}
                  mode='outlined'
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  style={styles.input}
                  error={!!error}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />
        </>
      )}

      {contactType === 'Email Id' && (
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address',
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                mode='outlined'
                label="Email Id"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                style={styles.input}
                error={!!error}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />
      )}

      <Controller
        control={control}
        name="borrowerType"
        rules={{ required: 'Borrower type is required' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.dropdownContainer}>
            <Dropdown
              label="Borrower Type"  
              hideMenuHeader={true}
              mode="outlined"
              style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
              options={Apires.borrower_type}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? 'Select borrower type' : '...'}
              value={value}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onSelect={(item) => {
                onChange(item);
                setCustomerlist(item);
                setIsFocus(false);
              }}
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        )}
      />

      {selectd_opt.borrower_type.toLowerCase() === 'others' ? (
        <>
          <Controller
            control={control}
            name="otherName"
            rules={{ required: 'Name is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  mode='outlined'
                  label="Enter Name"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!error}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="relationship"
            rules={{ required: 'Relationship is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  mode='outlined'
                  label="Relationship with Borrower"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!error}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />
        </>
      ) : (
        <Controller
    control={control}
    name="customer_name"
    rules={{ required: 'Customer name is required' }}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <View style={styles.dropdownContainer}>
        <Dropdown
          label="Select Name"
          hideMenuHeader={true}
          mode="outlined"
          style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          itemTextStyle={styles.itemTextStyle}
          options={Apires.selectedlist}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'Select Name' : '...'}
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onSelect={(item) => {
            onChange(item);
            setIsFocus(false);
          }}
        />
        {error && <Text style={styles.errorText}>{error.message}</Text>}
      </View>
    )}
  />
      )}

    
    </ScrollView>

    <TouchableOpacity onPress={handleSubmit(onSubmit)} style={styles.savebtn}>
        <Text style={{textAlign:'center',color:COLORS.white,letterSpacing:1}}>Save Contact</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  maincontainer:{
    flex: 1,
    position:'relative'
  },
  container: {
    padding: 20,
    marginTop:20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: 'white',
  },
  placeholderStyle: {
    color: 'grey',
  },
  selectedTextStyle: {
    color: 'black',
  },
  itemTextStyle: {
    color: 'black',
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
  },
  savebtn:{
    paddingHorizontal:10,
    paddingVertical:25,
    position:'absolute',
    bottom:0,
    backgroundColor:COLORS.primary,
    width:'100%'
  }
});

export default ResponseForm;
