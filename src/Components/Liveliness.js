import React, { useState, useEffect } from 'react';
import { View, StyleSheet ,Alert} from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { useForm, Controller } from 'react-hook-form';
import Api from '../Utilities/apiService';
 
const Liveliness = ({ route, navigation, ...props }) => {
  const [borrowerTypes, setBorrowerTypes] = useState([]);
  const [customerNames, setCustomerNames] = useState([]);
  const [customerlist, setCustomerlist] = useState({ allcustomer: [], selectedcustomer: '' });
  const theme = useTheme();

  const { control, handleSubmit, watch,reset } = useForm({
    defaultValues: {
      account_number: route.params.account_no,
      borrower_type: '',
      customer_name: '',
      borrower_status: '',
    },
  });

  const selectedBorrowerType = watch('borrower_type');

  useEffect(() => {
    fetchBorrowerTypes();
  }, []);

  useEffect(() => {
    if (selectedBorrowerType) {
      fetchCustomerNames(selectedBorrowerType);
    }
    
  }, [selectedBorrowerType]);

  const fetchBorrowerTypes = async () => {
    try {
      const response = await Api.send({ ...route.params }, 'secure_borrowerdetails/getcustomerList');
      const data = response;
      setCustomerlist({ ...customerlist, allcustomer: data });
      const types = [...new Set(data.map(item => item['Borrower Type']))];
      setBorrowerTypes(types.map(type => ({ label: type, value: type })));
    } catch (error) {
      console.error('Error fetching borrower types:', error);
    }
  };

  const fetchCustomerNames = (borrowerType) => {
    const filteredNames = customerlist.allcustomer
      .filter(item => item['Borrower Type'] === borrowerType)
      .map(item => ({ label: item['Customer Name'], value: item['Customer Name'] }));
    setCustomerNames(filteredNames);
  };

  const onSubmit = (data) => {
    // console.log(data);
    Api.send({...data,...route.params},'secure_borrowerdetails/borrowerStatus').then(
      res=>{
        Alert.alert('Success','Data Saved Sucessfully',[],{cancelable:true});
        reset()
      }
    ).catch(
      err=>{
        console.log(err)
        Alert.alert('Success','Something Wrong Please Try Again',[],{cancelable:true});
        reset();
      })
     
  };

  const borrowerStatusList = [
    { label: 'Alive', value: 'Alive' },
    { label: 'Deceased', value: 'Deceased' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liveliness</Text>

      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Account Number"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            disabled={true}
            style={styles.input}
            mode='outlined'
          />
        )}
        name="account_number"
      />

      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={borrowerTypes}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Borrower Type"
            itemTextStyle={styles.itemTextStyle}
            value={value}
            onChange={item => {
              onChange(item.value);
            }}
          />
        )}
        name="borrower_type"
      />

      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={customerNames}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select Name"
            itemTextStyle={styles.itemTextStyle}
            value={value}
            onChange={item => {
              onChange(item.value);
            }}
          />
        )}
        name="customer_name"
      />

      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={borrowerStatusList}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Status"
            itemTextStyle={styles.itemTextStyle}
            value={value}
            onChange={item => {
              onChange(item.value);
            }}
          />
        )}
        name="borrower_status"
      />

      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button}>
        Save
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    color:'black'
  },
  dropdown: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  placeholderStyle: {
    fontSize: 16,
    color: 'black',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    marginTop: 32,
    paddingVertical: 8,
    borderRadius: 8,
  },
  itemTextStyle: {
    color: 'black',
  },
});

export default Liveliness;